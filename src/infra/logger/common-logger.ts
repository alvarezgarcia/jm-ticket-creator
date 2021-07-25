import { injectable } from 'inversify';
import { ILogger } from '../../common/logger';

@injectable()
export class CommonLogger implements ILogger {
	public async log(message: string) {
		console.log(message);
	}
}