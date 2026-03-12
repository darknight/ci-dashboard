import { env } from '$env/dynamic/private';

export function getGitHubToken(platform?: App.Platform): string {
	const token = platform?.env?.GITHUB_TOKEN ?? env.GITHUB_TOKEN;
	if (!token) throw new Error('GITHUB_TOKEN not configured');
	return token;
}

export function getConfig(platform?: App.Platform) {
	const token = platform?.env?.GITHUB_TOKEN ?? env.GITHUB_TOKEN;
	const owner = platform?.env?.GITHUB_OWNER ?? env.GITHUB_OWNER;
	const reposStr = platform?.env?.GITHUB_REPOS ?? env.GITHUB_REPOS;

	if (!token) throw new Error('GITHUB_TOKEN not configured');
	if (!owner) throw new Error('GITHUB_OWNER not configured');
	if (!reposStr) throw new Error('GITHUB_REPOS not configured');

	return { token, owner, repos: reposStr.split(',').map((s) => s.trim()) };
}
