const {
	IMAP_USER,
	IMAP_PASSWORD,
	IMAP_HOST,
	IMAP_PORT,
	IMAP_SEARCH_TIMEOUT,
} = process.env;

export default {
	user: IMAP_USER!,
	password: IMAP_PASSWORD!,
	host: IMAP_HOST!,
	port: parseInt(IMAP_PORT as string, 10) || 993,
	searchTimeout: parseInt(IMAP_SEARCH_TIMEOUT as string, 10) || 45
};