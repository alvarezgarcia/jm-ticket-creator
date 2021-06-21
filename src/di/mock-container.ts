import 'reflect-metadata';
import { Container, injectable } from 'inversify'

import { DISymbols } from './symbols';

import { IImapServer } from '../infra/imap-server/imap';
import { Redmine } from '../infra/redmine-server/redmine';

import { EmailRepository  } from '../infra/imap-server/repos/email';
import { EmailService } from '../app/email';
import { IssueRepository } from '../infra/redmine-server/repos/issue';
import { IssueService } from '../app/issue';
import { isContinueStatement } from 'typescript';

class ImapServer implements IImapServer {
	openBox = (inboxName: string) => Promise.resolve();
	addFlag = (id: string, flag: string) => Promise.resolve();
	moveMessageToBox = (emailId: string, boxName: string) => Promise.resolve();

  async findAll() {
		const headers = new Map();
		headers.set('imap-id', 'fakeId');

		const emails = [
			{
				headers,
				from: {
					value: [
						{
							address: 'mail@server.com'
						}
					]
				},
				subject: '[Proyecto de Prueba - #329] Problemas en moodle',
				text: 'Probé cada uno de esos pasos y no tengo resultados positivos',
				attachments: [
					{
						filename: 'Imagen.jpg',
						contentType: 'image/jpeg',
						content: Buffer.alloc(256)
					}
				]
			}
		];

		return Promise.resolve(emails);
  }
}

@injectable()
class Imap {
	public box: ImapServer = new ImapServer();
}

const container = new Container();

container
  .bind(DISymbols.ImapServer)
  .to(Imap)
  .inSingletonScope();

container
  .bind(DISymbols.RedmineServer)
  .to(Redmine)
  .inSingletonScope();

container.bind(DISymbols.EmailRepository).to(EmailRepository);
container.bind(DISymbols.EmailService).to(EmailService);

container.bind(DISymbols.IssueRepository).to(IssueRepository);
container.bind(DISymbols.IssueService).to(IssueService);

export { container };