const {
	REDMINE_API_URL,
	REDMINE_TOKEN,
	REDMINE_PROJECT_ID,
	REDMINE_TRACKER_ID,
	REDMINE_MAX_ATTACHMENT_SIZE,
} = process.env;

export default {
	apiUrl: REDMINE_API_URL,
	token: REDMINE_TOKEN,
	projectId: parseInt(REDMINE_PROJECT_ID as string, 10) || 1,
	trackerId: parseInt(REDMINE_TRACKER_ID as string, 10) || 4,
	maxAttachmentSize: parseInt(REDMINE_MAX_ATTACHMENT_SIZE as string, 10) || 4718592, // 4,5 Mbs
};