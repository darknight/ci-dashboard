<script lang="ts">
	import type { RepoSummary } from '$lib/github';
	import StatusDot from './StatusDot.svelte';

	let { repos, activeRepo, onSelect }: { repos: RepoSummary[]; activeRepo: string; onSelect: (name: string) => void } = $props();
</script>

<aside class="flex w-64 flex-col border-r bg-muted/30">
	<div class="border-b px-6 py-4">
		<h1 class="text-lg font-bold tracking-tight">CI Dashboard</h1>
	</div>
	<nav class="flex-1 space-y-1 p-3">
		{#each repos as repo}
			<button
				onclick={() => onSelect(repo.name)}
				class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors {repo.name === activeRepo
					? 'bg-accent font-medium text-accent-foreground'
					: 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}"
			>
				<StatusDot health={repo.health} />
				<span class="truncate">{repo.name}</span>
			</button>
		{/each}
	</nav>
</aside>
