import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoDetail } from '$lib/github';
import { getConfig } from '$lib/server/env';

export const GET: RequestHandler = async ({ params, platform }) => {
	const { token, owner, repos } = getConfig(platform);
	const repo = params.repo;

	if (!repos.includes(repo)) error(400, 'Invalid repo');

	try {
		const detail = await getRepoDetail(owner, repo, token);
		return json(detail);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return json({ name: repo, workflows: [], error: msg }, { status: 500 });
	}
};
