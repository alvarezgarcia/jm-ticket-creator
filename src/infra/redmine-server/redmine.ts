import axios from 'axios';
import { injectable } from 'inversify';
import _ from 'lodash';

import { Attachment, Issue } from '../../domain/issue';

import { redmine as redmineConfig } from '../../config';

if (!redmineConfig.token || !redmineConfig.apiUrl) {
  throw new Error('Configuración para Redmine incompleta, verifique archivo .env');
}

type Upload = {
	token: string,
	filename: string,
	contentType: string,
};

const config: any = {
	headers: {
	}
};

class RedmineServer {
	private httpClient: any = undefined;
	private headers = {
		'X-Redmine-API-Key': redmineConfig.token, 
	}

	constructor(config: any) {
		this.httpClient = axios;
	}

	private getSize(content: Buffer) {
		return Buffer.byteLength(content);
	}

	private post(endpoint: string, data: any, customHeaders: any) {
		const redmineRestAPI = `${redmineConfig.apiUrl}/${endpoint}`;

		const config = {
			url: redmineRestAPI,
			method: 'POST',
			headers: {...this.headers, ...customHeaders},
			data
		};

		return this.httpClient(config);
	}

	private put(endpoint: string, data: any, customHeaders: any) {
		const redmineRestAPI = `${redmineConfig.apiUrl}/${endpoint}`;

		const config = {
			url: redmineRestAPI,
			method: 'PUT',
			headers: {...this.headers, ...customHeaders},
			data
		};

		return this.httpClient(config);
	}

	private async get(endpoint: string, customHeaders: any) {
		const redmineRestAPI = `${redmineConfig.apiUrl}/${endpoint}`;

		const config = {
			url: redmineRestAPI,
			method: 'GET',
			headers: {...this.headers, ...customHeaders},
		};

		const r = await this.httpClient(config);
		return r.data;
	}

	private async createAttachment(attachment: Attachment) {
		const endpoint = `uploads.json?${attachment.filename}`;
		const customHeaders = {
			'Content-Type': 'application/octet-stream',
		};

		if (this.getSize(attachment.content) >= redmineConfig.maxAttachmentSize) {
			throw new Error(`${attachment.filename} excede el size maximo para attachments de ${redmineConfig.maxAttachmentSize}`);
		}

		const { data } = await this.post(endpoint, attachment.content, customHeaders);
		const upload: Upload = {
			token: data.upload.token,
			filename: attachment.filename,
			contentType: attachment.contentType,
		};

		return upload;
	}

	private async uploadAttachments(attachments: Attachment[]) {
		const uploads = attachments.map(async (a) => {
			const u = await this.createAttachment(a);

			return ({
				token: u.token,
				filename: u.filename,
				content_type: u.contentType
			});
		});

		const rs = await Promise.allSettled(uploads);
		const [uploaded, failed] = rs.reduce((acc: any[any], r: any) => {
			if (r.status === 'rejected') {
				acc[1].push(r.reason.message);
			} else {
				acc[0].push(r.value);
			}

			return acc;
		}, [[],[]]);

		if (failed.length) {
			console.log(`${failed.length} archivos fallaron al ser subidos`);
			console.dir(failed);
		}

		return uploaded;
	}

	async getIssue(issueId: string) {
		const endpoint = `issues.json?issue_id=${issueId}`;
		const customHeaders = {
			'Content-Type': 'application/json',
		};

		const data = await this.get(endpoint, customHeaders);
		return data.issues[0];
	}

	async createIssue(issue: Issue) {
		const endpoint = 'issues.json';
		const customHeaders = {
			'Content-Type': 'application/json',
		};

		const toCreate: any = {
			issue: {
				project_id: issue.projectId,
				tracker_id: issue.trackerId,
				subject: issue.subject,
				description: issue.description,
				custom_fields: issue.customFields
			}
		};

		if (issue.attachments?.length) {
			console.log(`Subiendo ${issue.attachments.length} adjuntos`);
			toCreate.issue.uploads = await this.uploadAttachments(issue.attachments);
			console.log(`${toCreate.issue.uploads.length} archivos fueron subidos`);

			if (issue.attachments.length !== toCreate.issue.uploads.length) {
				throw new Error(`No fueron subidos todos los archivos`)
			}
		}

		return this.post(endpoint, JSON.stringify(toCreate), customHeaders);
	}

	async updateIssue(issue: Issue): Promise<Issue> {
		const endpoint = `issues/${issue.parentTask}.json`;
		const customHeaders = {
			'Content-Type': 'application/json',
		};

		const toUpdate: any = {
			issue: {
				notes: issue.description
			}
		};

		if (issue.attachments?.length) {
			console.log(`Subiendo ${issue.attachments.length} adjuntos`);
			toUpdate.issue.uploads = await this.uploadAttachments(issue.attachments);
			console.log(`${toUpdate.issue.uploads.length} archivos fueron subidos`);
			
			if (issue.attachments.length !== toUpdate.issue.uploads.length) {
				throw new Error(`No fueron subidos todos los archivos`)
			}
		}

		await this.put(endpoint, JSON.stringify(toUpdate), customHeaders);
		return issue;
	}
}

@injectable()
export class Redmine {
	public server: RedmineServer = new RedmineServer(config);
}