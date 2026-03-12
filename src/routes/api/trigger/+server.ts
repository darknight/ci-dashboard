import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triggerWorkflow } from '$lib/github';
import { getConfig } from '$lib/server/env';

export const POST: RequestHandler = async ({ request, platform }) => {
	const { repo, workflowId, ref = 'main' } = await request.json();
	const { token, owner, repos } = getConfig(platform);

	if (!repos.includes(repo)) error(400, 'Invalid repo');
	if (!workflowId) error(400, 'Missing workflowId');

	try {
		await triggerWorkflow(owner, repo, workflowId, token, ref);
		return json({ success: true });
	} catch (e) {
		return json({ success: false, error: String(e) }, { status: 422 });
	}
};
