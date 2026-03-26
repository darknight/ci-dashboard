<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import WorkflowCard from '$lib/components/WorkflowCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { invalidateAll } from '$app/navigation';
	import { deriveHealth } from '$lib/github';
	import type { RepoDetail } from '$lib/github';
	import type { Snippet } from 'svelte';
	import { setContext, onDestroy } from 'svelte';
	import { createPoller, hasActiveRuns } from '$lib/poll.svelte';

	let { data, children }: { data: { repoDetails: RepoDetail[] }; children: Snippet } = $props();

	let activeRepo = $state(data.repoDetails[0]?.name ?? '');
	let refreshing = $state(false);

	const poller = createPoller();
	setContext('poller', poller);

	const mergedRepoDetails = $derived(
		data.repoDetails.map((d) => poller.getUpdate(d.name) ?? d)
	);

	const repos = $derived(
		mergedRepoDetails.map((d) => ({ name: d.name, health: deriveHealth(d.workflows) }))
	);

	const activeDetail = $derived(mergedRepoDetails.find((d) => d.name === activeRepo));

	$effect(() => {
		for (const detail of mergedRepoDetails) {
			if (hasActiveRuns(detail)) {
				poller.startPolling(detail.name);
			}
		}
	});

	onDestroy(() => poller.stopAll());

	function handleSelectRepo(name: string) {
		activeRepo = name;
	}

	async function handleRefresh() {
		refreshing = true;
		poller.stopAll();
		await fetch('/api/refresh', { method: 'POST' });
		await invalidateAll();
		refreshing = false;
	}
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar {repos} {activeRepo} onSelect={handleSelectRepo} />

	<div class="flex flex-1 flex-col overflow-hidden">
		<header class="flex items-center justify-between border-b px-6 py-3">
			<h2 class="text-lg font-semibold">
				{activeRepo || 'Dashboard'}
			</h2>
			<div class="flex items-center gap-3">
				{#if poller.activePolls > 0}
					<span class="text-xs text-muted-foreground animate-pulse">
						Auto-refreshing {poller.activePolls} repo{poller.activePolls > 1 ? 's' : ''}
					</span>
				{/if}
				<Button variant="outline" size="sm" onclick={handleRefresh} disabled={refreshing}>
					{refreshing ? 'Refreshing...' : 'Refresh'}
				</Button>
			</div>
		</header>

		<main class="flex-1 overflow-y-auto p-6">
			{#if activeDetail}
				{#if activeDetail.error}
					<div class="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
						<p class="font-semibold">Failed to load workflows</p>
						<p class="mt-1 text-sm">{activeDetail.error}</p>
					</div>
				{:else if activeDetail.workflows.length === 0}
					<p class="text-muted-foreground">No active workflows found for this repo.</p>
				{:else}
					{#each activeDetail.workflows as workflow}
						<WorkflowCard {workflow} repo={activeDetail.name} />
					{/each}
				{/if}
			{/if}
		</main>
	</div>
</div>
