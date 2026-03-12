import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rerunFailedJobs } from '$lib/github';
import { getConfig } from '$lib/server/env';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { repo, runId } = await request.json();
	const { token, owner, repos } = getConfig(platform);

	if (!repos.includes(repo)) error(400, 'Invalid repo');
	if (!runId) error(400, 'Missing runId');

	try {
		await rerunFailedJobs(owner, repo, runId, token);
		return json({ success: true });
	} catch (e) {
		return json({ success: false, error: String(e) }, { status: 422 });
	}
};
