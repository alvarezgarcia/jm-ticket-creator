const DISymbols = {
	ImapServer: Symbol.for('ImapServer'),
	RedmineServer: Symbol.for('RedmineServer'),

	EmailRepository: Symbol.for('EmailRepository'),
	EmailService: Symbol.for('EmailService'),

	IssueRepository: Symbol.for('IssueRepository'),
	IssueService: Symbol.for('IssueService'),

	CommonLogger: Symbol.for('CommonLogger'),
	TelegramLogger: Symbol.for('TelegramLogger'),
};

export { DISymbols };