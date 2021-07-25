import { injectable, inject } from 'inversify'
import * as sanitizeHTML from 'sanitize-html';

import { DISymbols } from '../../../di/symbols';
import { Imap } from '../imap';
import { Email } from '../../../domain/email'

const sanitize = sanitizeHTML.default;

interface IEmailRepository {
	findAll(): Promise<Email[]>
}

@injectable()
export class EmailRepository implements IEmailRepository {
	@inject(DISymbols.ImapServer) private _imapServer!: Imap;

	async findAll(): Promise<Email[]> {
		const found = await this._imapServer.box.findAll();
		// console.dir(found, { depth: null })

		return found.map((f: any) => {
			const email: any = {
				id: f.id,
				from: f.from,
				subject: f.subject,
				body: sanitize(f.body),
			};

			if (f.attachments && f.attachments.length) {
				email.attachments = f.attachments.map((f: any) => {
					return ({
						filename: f.filename,
						contentType: f.contentType,
						content: f.content
					});
				});
			}

			return Email.create(email);
		});
	}

	async addFlag(id: string, flag: string) {
		await this._imapServer.box.addFlag(id, flag);
	}
	
	async moveMessage(emailId: string, boxName: string) {
		await this._imapServer.box.moveMessageToBox(emailId, boxName);
	}
}