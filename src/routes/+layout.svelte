<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import WorkflowCard from '$lib/components/WorkflowCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { invalidateAll } from '$app/navigation';
	import { deriveHealth } from '$lib/github';
	import type { RepoDetail } from '$lib/github';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { repoDetails: RepoDetail[] }; children: Snippet } = $props();

	let activeRepo = $state(data.repoDetails[0]?.name ?? '');
	let refreshing = $state(false);

	const repos = $derived(
		data.repoDetails.map((d) => ({ name: d.name, health: deriveHealth(d.workflows) }))
	);

	const activeDetail = $derived(data.repoDetails.find((d) => d.name === activeRepo));

	function handleSelectRepo(name: string) {
		activeRepo = name;
	}

	async function handleRefresh() {
		refreshing = true;
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
			<Button variant="outline" size="sm" onclick={handleRefresh} disabled={refreshing}>
				{refreshing ? 'Refreshing...' : 'Refresh'}
			</Button>
		</header>

		<main class="flex-1 overflow-y-auto p-6">
			{#if activeDetail}
				{#if activeDetail.workflows.length === 0}
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
