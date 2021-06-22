import { injectable } from 'inversify';
import imaps, { ImapSimpleOptions } from 'imap-simple';
import _ from 'lodash';
import mailparser from 'mailparser';

import { imap as imapConfig } from '../../config';

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

  async openBox(inboxName: string = 'INBOX'): Promise<void> {
    if (this.connection) return;
    this.connection = await imaps.connect(config);
    await this.connection.openBox(inboxName);
  };

  async search(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true };

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
    await this.openBox('INBOX');

    const messages = await this.search();
		const ops = messages.map((m: any) => {
			const all = _.find(m.parts, { "which": "" })
      const id = m.attributes.uid;
      const idHeader = `Imap-Id: ${id}\r\n`;

			return simpleParser(`${idHeader}${all.body}`);
		});

		return Promise.all(ops);
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