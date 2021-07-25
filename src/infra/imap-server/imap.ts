import { inject, injectable } from 'inversify';
import imaps, { ImapSimpleOptions } from 'imap-simple';
import _ from 'lodash';
import mailparser from 'mailparser';

import { imap as imapConfig, redmine } from '../../config';
import { redmine as redmineConfig } from '../../config';

import { DISymbols } from '../../di/symbols';
import { CommonLogger } from '../logger/common-logger';
import { TelegramLogger } from '../logger/telegram-logger';
import { container } from '../../di/container';

const { simpleParser } = mailparser;

if (!imapConfig.user || !imapConfig.password || !imapConfig.host) {
  throw new Error('Configuración para IMAP incompleta, verifique archivo .env');
}

const config: ImapSimpleOptions = {
	imap: {
		user: imapConfig.user,
		password: imapConfig.password,
		host: imapConfig.host,
		port: imapConfig.port,
		tls: true,
  }
};

export interface IImapServer {
	openBox(inboxName: string): Promise<void>
  findAll(): Promise<any[]>
	addFlag(id: string, flag: string): Promise<void>
	moveMessageToBox(emailId: string, boxName: string): Promise<void>
}

class ImapServer implements IImapServer {
  private connection: any = undefined;

  private commonLogger: CommonLogger = container.get<CommonLogger>(DISymbols.CommonLogger);
  private telegramLogger: CommonLogger = container.get<TelegramLogger>(DISymbols.TelegramLogger);

  private async log(message: any) {
    await Promise.all([
      this.commonLogger.log(message),
      this.telegramLogger.log(message)
    ])
  }

  private getParts(message: any): any {
    return imaps.getParts(message.attributes.struct);
  }

  private getAttachmentsParts(message: any): any {
    const parts = this.getParts(message);

    return parts.filter((p: any) => {
      const isAttachment = p.disposition;
      return isAttachment;
    })
  }

  private getPlainParts(message: any): any {
    const parts = this.getParts(message);

    return parts.filter((p: any) => {
      const isPlain = p.type === 'text' && p.subtype === 'plain';
      return isPlain;
    })
  }

  private getHTMLParts(message: any): any {
    const parts = this.getParts(message);

    return parts.filter((p: any) => {
      const isPlain = p.type === 'text' && p.subtype === 'html';
      return isPlain;
    })
  }

  private async getHeader(message: any): Promise<any> {
    const { parts } = message;

    const headerPart = parts.find((p: any) => {
      const isHeader = p.which === 'HEADER';
      return isHeader;
    });

    const {
      from,
      subject
    } = headerPart.body;

    const r = await simpleParser(`From: ${from[0]}`);
    return ({ from: r.from?.value[0].address, subject: subject[0] });
  }

  private async getBodyParts(message: any, parts: any): Promise<any> {
    const ops = parts.map(async (pp: any) => {
      const partData = await this.connection.getPartData(message, pp);
      return partData;
    });

    const bodyParts = await Promise.all(ops);
    return bodyParts.join('\n');
  }

  private async getPlainBody(message: any): Promise<any> {
    const plainParts = this.getPlainParts(message);
    return this.getBodyParts(message, plainParts);
  }

  private async getHTMLBody(message: any): Promise<any> {
    const htmlParts = this.getHTMLParts(message);
    return this.getBodyParts(message, htmlParts);
  }

  private async getBody(message: any): Promise<any> {
    let body = await this.getPlainBody(message);
    if (!body) {
      body = await this.getHTMLBody(message);
    }

    return body;
  }

  private async getAttachmentsPartsData(message: any, parts: any): Promise<any> {
    const ops = parts.map(async (pp: any) => {
      const partData = await this.connection.getPartData(message, pp);
      return ({
        filename: pp.disposition.params.filename,
        content: partData,
        contentType: `${pp.type}/${pp.subtype}`
      });
    });

    return Promise.all(ops);
  }

  private async getAttachments(subject: string, message: any): Promise<any> {
    const attachmentsParts = this.getAttachmentsParts(message);
    const allowedAttachments = attachmentsParts.filter((ap: any) => ap.size <= redmineConfig.maxAttachmentSize);

    if (attachmentsParts.length !== allowedAttachments.length) {
      await this.log(`El correo con asunto '${subject}' posee adjuntos que exceden el máximo permitido, se ignorarán`);
    }

    return this.getAttachmentsPartsData(message, allowedAttachments);
  }

  private async processMessages(messages: any): Promise<any> {
    let processed = [];
    for (const m of messages) {
      const id = m.attributes.uid;
      const header = await this.getHeader(m);
      const body = await this.getBody(m);
      const attachments = await this.getAttachments(header.subject, m);

      const p = {
        id,
        from: header.from,
        subject: header.subject,
        body,
        attachments
      }

      processed.push(p);
      this.commonLogger.log(`Extraido correo ${processed.length} / ${messages.length}`);
    }

    return processed;
  }

  async openBox(inboxName: string = 'INBOX'): Promise<void> {
    if (this.connection) return;
    this.connection = await imaps.connect(config);
    await this.connection.openBox(inboxName);
  };

  async search(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = { bodies: ['HEADER'], struct: true };

      let messages: any;
      const timeout = setTimeout(() => {
        if (messages) return;
        reject(new Error(`Tiempo excedido (${imapConfig.searchTimeout}s) para buscar correos`));
      }, imapConfig.searchTimeout * 1000);

      messages = await this.connection.search(searchCriteria, fetchOptions);
      resolve(messages);
    });
  }

  async findAll(): Promise<any[]> {
    await this.commonLogger.log('Abriendo INBOX');
    await this.openBox('INBOX');

    await this.log(`Consultando correos`);
    const messages = await this.search();
    const processed = await this.processMessages(messages);

    return processed;
  }

	async addFlag(id: string, flag: string): Promise<void> {
		await this.connection.addFlags(id, flag);
	}

	async moveMessageToBox(emailId: string, boxName: string): Promise<void> {
		await this.connection.moveMessage(emailId, boxName);
	}
}

@injectable()
export class Imap {
	public box: ImapServer = new ImapServer();
}