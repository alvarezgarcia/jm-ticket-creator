import { injectable } from 'inversify';
import axios, { AxiosRequestConfig } from 'axios';

import { ILogger } from '../../common/logger';
import { telegram  as telegramConfig } from '../../config';

@injectable()
export class TelegramLogger implements ILogger {
	public async log(message: string) {
		if (!telegramConfig.botKey || !telegramConfig.channelId) {
			console.log('Configuración para Telegram incompleta, verifique archivo .env');
			console.log('No se enviarán mensajes por Telegram');
			return;
		}

		const telegramApi = 'https://api.telegram.org';
		const sendMessageUrl = `${telegramApi}/bot${telegramConfig.botKey}/sendMessage`;

		const data = JSON.stringify({
			chat_id: telegramConfig.channelId,
			text: message,
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

		await axios(options);
	}
}