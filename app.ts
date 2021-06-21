import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { Issue } from './src/domain/issue';
import { Email } from './src/domain/email';

import { EmailService } from './src/app/email';
import { DISymbols } from './src/di/symbols';
import { IssueService } from 'src/app/issue';

import { container } from './src/di/container';
// import { container } from './src/di/mock-container';

const getUnseenEmails = () => {
  const es = container.get<EmailService>(DISymbols.EmailService);
	return es.findAll();
};

const createIssue = (data: Email) => {
	const is = container.get<IssueService>(DISymbols.IssueService);

	const rawIssue: any = {
		subject: data.subject,
		description: data.body,
		ownerEmail: data.from,
	};

	if (data.attachments) {
		rawIssue.attachments = data.attachments;
	}

	const issue: Issue = Issue.create(rawIssue);
	return is.create(issue)
}

const setAsSeen = async (emailId: string) => {
	const es = container.get<EmailService>(DISymbols.EmailService);
	await es.setAsSeen(emailId);
}

const moveMessage = async (emailId: string, boxName: string) => {
	const es = container.get<EmailService>(DISymbols.EmailService);
	await es.moveToBox(emailId, boxName);
}

const start = async () => {
	console.log('Iniciando...');

	let emails: Email[] = [];
	try {
		emails = await getUnseenEmails();
		console.log(`Encontre ${emails.length} mails`);
	} catch (e) {
		console.log(e);
		process.exit(-1);
	}

	const status = {
		ok: 0,
		failed: 0,
	};

	let destInbox;
	for (const mail of emails) {
		try {
			await createIssue(mail);
			destInbox = 'Procesados';
			status.ok++;
		} catch (e) {
			const statusCode = e.response?.status;
			if (statusCode === 404) {
				console.log('Issue no encontrado en Redmine');
			} else {
				console.log('Error desconocido', e);
			}

			console.log(mail);

			destInbox = 'No Procesados';
			status.failed++;
		} finally {
			await moveMessage(mail.id, destInbox as string);
		}
	}

	console.log(`Mails = ${emails.length} (${status.ok} creados - ${status.failed} fallidos)`);
	process.exit(0);
}

start();