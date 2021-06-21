import axios from 'axios';
import { injectable } from 'inversify';
import _ from 'lodash';

import { Attachment, Issue } from '../../domain/issue';

import { redmine as redmineConfig } from '../../config';

if (!redmineConfig.token || !redmineConfig.apiUrl) {
  throw new Error('Incomplete Redmine configuration please check .env file');
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

	private async createAttachment(attachment: Attachment) {
		const endpoint = `uploads.json?${attachment.filename}`;
		const customHeaders = {
			'Content-Type': 'application/octet-stream',
		};

		const { data } = await this.post(endpoint, attachment.content, customHeaders);
		const upload: Upload = {
			token: data.upload.token,
			filename: attachment.filename,
			contentType: attachment.contentType,
		};

		return upload;
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

		if (issue.attachments) {
			const uploaded = await this.createAttachment(issue.attachments[0]);

			toCreate.issue.uploads = [
				{
					token: uploaded.token,
					filename: uploaded.filename,
					content_type: uploaded.contentType
				}
			];
		}

		return this.post(endpoint, JSON.stringify(toCreate), customHeaders);
	}

	async updateIssue(issue: Issue) {
		const endpoint = `issues/${issue.parentTask}.json`;
		const customHeaders = {
			'Content-Type': 'application/json',
		};

		const toUpdate: any = {
			issue: {
				notes: issue.description
			}
		};

		if (issue.attachments) {
			const uploaded = await this.createAttachment(issue.attachments[0]);

			toUpdate.issue.uploads = [
				{
					token: uploaded.token,
					filename: uploaded.filename,
					content_type: uploaded.contentType
				}
			];
		}

		console.log('updateIssue', toUpdate)
		return this.put(endpoint, JSON.stringify(toUpdate), customHeaders);
	}
}

@injectable()
export class Redmine {
	public server: RedmineServer = new RedmineServer(config);
}