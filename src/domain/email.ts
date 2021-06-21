type EmailAttachment = {
	filename: string
	contentType: string
	content: Buffer
};

interface IEmail {
	id: string
	from: string
	subject: string
	body?: string
	attachments?: EmailAttachment[]
}

export class Email implements IEmail {
	protected props: IEmail;

	private constructor(props: IEmail) {
		this.props = props;
	}

	public static create(props: IEmail): Email {
		const instance = new Email(props);
		return instance;
	}

	get id(): string {
		return this.props.id;
	}

	get from(): string {
		return this.props.from;
	}

	get subject(): string {
		return this.props.subject;
	}

	get body(): string | undefined {
		return this.props.body;
	}

	get attachments(): EmailAttachment[] | undefined {
		return this.props.attachments;
	}
}