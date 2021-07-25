import 'reflect-metadata';
import dotenv from 'dotenv';
import axios, { AxiosRequestConfig } from 'axios';
dotenv.config();

import { Issue } from './src/domain/issue';
import { Email } from './src/domain/email';

import { EmailService } from './src/app/email';
import { DISymbols } from './src/di/symbols';
import { IssueService } from 'src/app/issue';

import { container } from './src/di/container';
// import { container } from './src/di/mock-container';
import { telegram  as telegramConfig } from './src/config';


import {
	log,
	consoleLog,
	telegramLog,
	getUnseenEmails,
	waitFor,
} from './src/misc';

const debugAndSend = async (status: string) => {
	console.log(status);

	if (!telegramConfig.botKey || !telegramConfig.channelId) {
		console.log('Configuración para Telegram incompleta, verifique archivo .env');
		console.log('No se enviarán mensajes por Telegram');
		return;
	}

	const telegramApi = 'https://api.telegram.org';
	const sendMessageUrl = `${telegramApi}/bot${telegramConfig.botKey}/sendMessage`;

	const data = JSON.stringify({
		chat_id: telegramConfig.channelId,
		text: status,
	});
	
	const options: AxiosRequestConfig = {
		url: sendMessageUrl,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': data.length
		},
		data
	};

	return axios(options);
}

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

const end = async (exitCode: number) => {
	await log(`\u{1F44B} Finalizada conversión de mails en tareas`);
	process.exit(exitCode);
};

const start = async () => {
	await log('\u{1F44B} Iniciando ejecución');

	let emails: Email[] = [];
	try {
		emails = await getUnseenEmails();
		await log(`${emails.length} correos para ser convertidos en tareas`);
	} catch (e) {
		await log(e.message);
		return end(-1);
	}

	const status = {
		ok: 0,
		failed: 0,
	};

	let destInbox;
	for (const mail of emails) {
		await waitFor(1000);
		consoleLog('\n------------------ Cut Here ------------------');
		consoleLog(`Procesando ${mail.id}`);
		try {
			await createIssue(mail);
			destInbox = 'Procesados';
			status.ok++;

			consoleLog(`Procesado ${mail.id}`);
		} catch (e) {
			consoleLog(JSON.stringify(mail));

			destInbox = 'No Procesados';
			status.failed++;

			await log(`Imposibe procesar correctamente ${mail.id} - ${mail.subject}`.replace('#', ''));
		} finally {
			await moveMessage(mail.id, destInbox as string);
		}

		await consoleLog(`Progreso:\nOK = ${status.ok}, Fallidos = ${status.failed}, Acumulados = ${status.ok + status.failed}, Totales = ${emails.length}`);
	}

	consoleLog('\n------------------ Cut Here ------------------');

	const stats = `Finalizado:\nOK = ${status.ok}, Fallidos = ${status.failed}, Totales = ${emails.length}`;
	await log(stats);

	return end(0);
}

start();