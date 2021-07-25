export interface ILogger {
	log(message: string): Promise<void>;
}