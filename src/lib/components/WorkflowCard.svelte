<script lang="ts">
	import type { WorkflowWithRuns } from '$lib/github';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import StatusBadge from './StatusBadge.svelte';
	import { invalidateAll } from '$app/navigation';

	let { workflow, repo }: { workflow: WorkflowWithRuns; repo: string } = $props();

	let triggering = $state(false);
	let triggerMessage = $state('');
	let rerunningId = $state<number | null>(null);

	function formatDuration(start: string, end: string): string {
		const ms = new Date(end).getTime() - new Date(start).getTime();
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (minutes === 0) return `${remainingSeconds}s`;
		return `${minutes}m ${remainingSeconds}s`;
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		const formatter = new Intl.DateTimeFormat('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timeZoneName: 'short'
		});
		const parts = formatter.formatToParts(date);
		const datetime = parts
			.filter((p) => p.type !== 'timeZoneName')
			.map((p) => p.value)
			.join('');
		const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		return `${datetime} ${tz}`.trim();
	}

	async function handleTrigger() {
		triggering = true;
		triggerMessage = '';
		try {
			const res = await fetch('/api/trigger', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ repo, workflowId: workflow.id })
			});
			const data = await res.json();
			if (data.success) {
				triggerMessage = 'Triggered! Refreshing...';
				setTimeout(() => invalidateAll(), 2000);
			} else {
				triggerMessage = 'Failed: ' + (data.error || 'Unknown error');
			}
		} catch {
			triggerMessage = 'Network error';
		} finally {
			triggering = false;
		}
	}

	async function handleRerun(runId: number) {
		rerunningId = runId;
		try {
			const res = await fetch('/api/rerun', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ repo, runId })
			});
			const data = await res.json();
			if (data.success) {
				setTimeout(() => invalidateAll(), 2000);
			}
		} finally {
			rerunningId = null;
		}
	}
</script>

<Card class="mb-4">
	<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
		<CardTitle class="text-base font-semibold">{workflow.name}</CardTitle>
		<Button variant="outline" size="sm" onclick={handleTrigger} disabled={triggering}>
			{triggering ? 'Triggering...' : 'Trigger'}
		</Button>
	</CardHeader>
	<CardContent>
		{#if triggerMessage}
			<p class="mb-3 text-sm text-muted-foreground">{triggerMessage}</p>
		{/if}

		{#if workflow.runs.length === 0}
			<p class="text-sm text-muted-foreground">No recent runs</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b text-left text-muted-foreground">
							<th class="pb-2 font-medium">Run</th>
							<th class="pb-2 font-medium">Status</th>
							<th class="pb-2 font-medium">Duration</th>
							<th class="pb-2 font-medium">Time</th>
							<th class="pb-2 font-medium"></th>
						</tr>
					</thead>
					<tbody>
						{#each workflow.runs as run}
							<tr class="border-b last:border-0">
								<td class="py-2">
									<a href={run.html_url} target="_blank" class="text-info hover:underline">
										#{run.run_number}
									</a>
								</td>
								<td class="py-2">
									<StatusBadge {run} />
								</td>
								<td class="py-2 text-muted-foreground">
									{#if run.status === 'completed'}
										{formatDuration(run.run_started_at, run.updated_at)}
									{:else}
										--
									{/if}
								</td>
								<td class="py-2 text-muted-foreground">
									{formatTime(run.created_at)}
								</td>
								<td class="py-2">
									{#if run.conclusion === 'failure'}
										<Button
											variant="ghost"
											size="sm"
											class="h-7 px-2 text-xs"
											onclick={() => handleRerun(run.id)}
											disabled={rerunningId === run.id}
										>
											{rerunningId === run.id ? '...' : 'Re-run'}
										</Button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</CardContent>
</Card>
