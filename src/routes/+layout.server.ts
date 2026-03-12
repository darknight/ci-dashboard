import type { LayoutServerLoad } from './$types';
import { getAllRepoDetails } from '$lib/github';
import { getConfig } from '$lib/server/env';

export const load: LayoutServerLoad = async ({ platform }) => {
	const { token, owner, repos: repoNames } = getConfig(platform);
	const repoDetails = await getAllRepoDetails(owner, repoNames, token);
	return { repoDetails };
};
