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
		const r = await this._redmine.server.createIssue(issue);
		return issue;
	}

	async updateIssue(issue: Issue): Promise<Issue> {
		const r = await this._redmine.server.updateIssue(issue);
		return issue;
	}
}