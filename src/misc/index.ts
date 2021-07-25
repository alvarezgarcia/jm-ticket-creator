import 'reflect-metadata';
import { EmailService } from 'src/app/email';

import { container } from '../di/container';
import { DISymbols } from '../di/symbols';

import { CommonLogger } from '../infra/logger/common-logger';
import { TelegramLogger } from '../infra/logger/telegram-logger';

const common = container.get<CommonLogger>(DISymbols.CommonLogger);
const telegram = container.get<TelegramLogger>(DISymbols.TelegramLogger);
const emailService = container.get<EmailService>(DISymbols.EmailService);

export const consoleLog = async (message: string): Promise<void> => common.log(message);
export const telegramLog = async (message: string): Promise<void> => telegram.log(message);

export const log = async (message: string): Promise<void> => {
	await Promise.all([
		consoleLog(message),
		telegramLog(message),
	]);
};

export const getUnseenEmails = () => {
	return emailService.findAll();
};

export const waitFor = (ms: number) => {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => {
			return resolve();
		}, ms);
	})
}