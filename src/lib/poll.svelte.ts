import type { RepoDetail } from '$lib/github';

const POLL_INTERVAL = 15_000;

export function hasActiveRuns(detail: RepoDetail): boolean {
	return detail.workflows.some((wf) =>
		wf.runs.some(
			(run) =>
				run.status === 'in_progress' || run.status === 'queued' || run.status === 'waiting'
		)
	);
}

export function createPoller() {
	let timers = $state<Map<string, ReturnType<typeof setInterval>>>(new Map());
	let updates = $state<Map<string, RepoDetail>>(new Map());

	async function pollRepo(repo: string) {
		try {
			const res = await fetch(`/api/poll/${repo}`);
			if (!res.ok) return;
			const detail: RepoDetail = await res.json();
			updates.set(repo, detail);
			updates = new Map(updates);

			if (!hasActiveRuns(detail)) {
				stopPolling(repo);
			}
		} catch {
			// Silently ignore network errors during polling
		}
	}

	function startPolling(repo: string) {
		if (timers.has(repo)) return;
		pollRepo(repo);
		const id = setInterval(() => pollRepo(repo), POLL_INTERVAL);
		timers.set(repo, id);
		timers = new Map(timers);
	}

	function stopPolling(repo: string) {
		const id = timers.get(repo);
		if (id) {
			clearInterval(id);
			timers.delete(repo);
			timers = new Map(timers);
		}
	}

	function stopAll() {
		for (const id of timers.values()) clearInterval(id);
		timers = new Map();
		updates = new Map();
	}

	function getUpdate(repo: string): RepoDetail | undefined {
		return updates.get(repo);
	}

	return {
		startPolling,
		stopPolling,
		stopAll,
		getUpdate,
		get activePolls() {
			return timers.size;
		}
	};
}

export type Poller = ReturnType<typeof createPoller>;
