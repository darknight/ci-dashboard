export interface WorkflowRun {
	id: number;
	name: string;
	status: 'completed' | 'in_progress' | 'queued' | 'waiting';
	conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null;
	html_url: string;
	created_at: string;
	updated_at: string;
	head_branch: string;
	run_number: number;
	event: string;
	workflow_id: number;
	run_started_at: string;
}

export interface Workflow {
	id: number;
	name: string;
	path: string;
	state: string;
}

export interface WorkflowWithRuns extends Workflow {
	runs: WorkflowRun[];
}

export interface RepoSummary {
	name: string;
	health: 'green' | 'red' | 'yellow' | 'unknown';
}

export interface RepoDetail {
	name: string;
	workflows: WorkflowWithRuns[];
	error?: string;
}

class GitHubAPIError extends Error {
	constructor(
		public status: number,
		public statusText: string,
		public body: string
	) {
		super(`GitHub API error: ${status} ${statusText}`);
	}
}

async function githubFetch(path: string, token: string, options?: RequestInit): Promise<Response> {
	const res = await fetch(`https://api.github.com${path}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			...options?.headers
		}
	});

	if (!res.ok) {
		const body = await res.text();
		throw new GitHubAPIError(res.status, res.statusText, body);
	}

	return res;
}

async function listWorkflows(owner: string, repo: string, token: string): Promise<Workflow[]> {
	const res = await githubFetch(`/repos/${owner}/${repo}/actions/workflows`, token);
	const data = await res.json();
	return data.workflows;
}

async function listWorkflowRuns(
	owner: string,
	repo: string,
	workflowId: number,
	token: string,
	perPage: number = 5
): Promise<WorkflowRun[]> {
	const res = await githubFetch(
		`/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=${perPage}`,
		token
	);
	const data = await res.json();
	return data.workflow_runs;
}

export async function triggerWorkflow(
	owner: string,
	repo: string,
	workflowId: number,
	token: string,
	ref: string = 'main'
): Promise<void> {
	await githubFetch(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, token, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ref })
	});
}

export async function rerunFailedJobs(
	owner: string,
	repo: string,
	runId: number,
	token: string
): Promise<void> {
	await githubFetch(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`, token, {
		method: 'POST'
	});
}

export function deriveHealth(workflows: WorkflowWithRuns[]): RepoSummary['health'] {
	for (const wf of workflows) {
		for (const run of wf.runs) {
			if (run.status === 'in_progress' || run.status === 'queued') return 'yellow';
		}
	}
	for (const wf of workflows) {
		if (wf.runs.length > 0) {
			const latest = wf.runs[0];
			if (latest.conclusion === 'failure') return 'red';
		}
	}
	return 'green';
}

export async function getRepoDetail(
	owner: string,
	repo: string,
	token: string
): Promise<RepoDetail> {
	const workflows = await listWorkflows(owner, repo, token);
	const workflowsWithRuns = await Promise.all(
		workflows
			.filter((wf) => wf.state === 'active')
			.map(async (wf) => {
				const runs = await listWorkflowRuns(owner, repo, wf.id, token, 5);
				return { ...wf, runs };
			})
	);
	return { name: repo, workflows: workflowsWithRuns };
}

let cache: { data: RepoDetail[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export async function getAllRepoDetails(
	owner: string,
	repos: string[],
	token: string
): Promise<RepoDetail[]> {
	if (cache && Date.now() - cache.timestamp < CACHE_TTL) return cache.data;

	const results = await Promise.allSettled(
		repos.map((repo) => getRepoDetail(owner, repo, token))
	);

	const data = results.map((result, i) => {
		if (result.status === 'fulfilled') return result.value;
		const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
		return { name: repos[i], workflows: [], error: errorMsg };
	});

	cache = { data, timestamp: Date.now() };
	return data;
}

export function clearCache() {
	cache = null;
}
