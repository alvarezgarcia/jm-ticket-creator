import { injectable, inject } from 'inversify';
import { DISymbols } from '../di/symbols';

import { Email } from '../domain/email';
import { EmailRepository } from '../infra/imap-server/repos/email';

@injectable()
export class EmailService {
	@inject(DISymbols.EmailRepository) private repository!: EmailRepository;

	private removeNotAllowed(emails: Email[]): Email[] {
		const notAllowedAddress = [
			'cortana@microsoft.com'
		];

		const clean = emails.filter((e) => {
      if (!notAllowedAddress.includes(e.from)) return e;
		});

		return clean;
	}

	private async addFlag(id: string, flag: string) {
		await this.repository.addFlag(id, flag)
	}

	public async findAll(): Promise<Email[]> {
		const allFound = await this.repository.findAll();
		return this.removeNotAllowed(allFound);
	}

	public async setAsSeen(id: string): Promise<void> {
		await this.addFlag(id, '\Seen');
	}

	public async moveToBox(emailId: string, boxName: string): Promise<void> {
		await this.repository.moveMessage(emailId, boxName);
	}
}