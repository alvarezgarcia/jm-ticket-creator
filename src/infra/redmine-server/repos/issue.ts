import { inject, injectable } from 'inversify';

import { DISymbols } from '../../../di/symbols';
import { Redmine } from '../redmine';
import { Issue } from '../../../domain/issue'

interface IIssueRepository {
	createIssue(issue: Issue): Promise<Issue>
}

@injectable()
export class IssueRepository implements IIssueRepository {
	@inject(DISymbols.RedmineServer) private _redmine!: Redmine;

	async createIssue(issue: Issue): Promise<Issue> {
		console.log(`Creando tarea para '${issue.subject}'`);
		await this._redmine.server.createIssue(issue);
		console.log(`Tarea creada '${issue.subject}'`);

		return issue;
	}

	async updateIssue(issue: Issue): Promise<Issue> {
		console.log(`Actualizando tarea '${issue.parentTask}'`);
		const taskFound = await this._redmine.server.getIssue(issue.parentTask!);
		if (!taskFound) {
			console.log(`Tarea '${issue.parentTask}' no encontrada, creando...`);
			return await this.createIssue(issue);
		}

		await this._redmine.server.updateIssue(issue);
		console.log(`Tarea actualizada '${issue.parentTask}'`);
		return issue;
	}
}