import { redmine as redmineConfig } from '../config';

type CustomFields = {
	id: number
	value: string
};

export type Attachment = {
	filename: string
	content: Buffer
	contentType: string
}

type IssueParams = {
	subject: string
	description: string
	ownerEmail: string
	attachments?: Attachment[]
	parentTask?: number
}

interface IIsue {
	projectId: number
	trackerId: number
	subject: string
	description: string
	customFields: CustomFields[]
	attachments?: Attachment[]
	parentTask?: string 
};

export class Issue implements IIsue {
	protected props: IIsue;

	private constructor(props: IIsue) {
		this.props = props;
	}

	public static create(params: IssueParams) {
		const customFields: CustomFields = {
			id: 1,
			value: params.ownerEmail,
		};

		const props: IIsue = {
			projectId: redmineConfig.projectId,
			trackerId: redmineConfig.trackerId,
			subject: params.subject,
			description: params.description,
			customFields: [
				customFields
			]
		};

		if (params.attachments) {
			props.attachments = params.attachments
		}

		const subjectParts = params.subject.match(/(#\d{1,})/g);
		if (subjectParts && subjectParts.length) {
			const issueNumber = subjectParts[0].slice(1);
			props.parentTask = issueNumber;
		}

		const instance = new Issue(props);
		return instance;
	}

	get projectId(): number {
		return this.props.projectId;
	}

	get trackerId(): number {
		return this.props.trackerId;
	}

	get subject(): string {
		return this.props.subject;
	}

	get description(): string {
		return this.props.description;
	}

	get customFields(): CustomFields[] {
		return this.props.customFields;
	}

	get attachments(): Attachment[] | undefined {
		return this.props.attachments;
	}

	get parentTask(): string | undefined {
		return this.props.parentTask;
	}
}