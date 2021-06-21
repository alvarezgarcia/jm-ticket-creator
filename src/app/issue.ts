import { inject, injectable } from 'inversify';
import { DISymbols } from '../di/symbols';

import { IssueRepository } from '../infra/redmine-server/repos/issue';
import { Issue } from '../domain/issue';

@injectable()
export class IssueService {
	@inject(DISymbols.IssueRepository) private repository!: IssueRepository;

	public create(issue: Issue): Promise<Issue> {
		if (issue.parentTask) {
			return this.repository.updateIssue(issue);
		}

		return this.repository.createIssue(issue);
	}
}