<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { WorkflowRun } from '$lib/github';

	let { run }: { run: WorkflowRun } = $props();

	function getLabel(run: WorkflowRun): string {
		if (run.status === 'in_progress') return 'in progress';
		if (run.status === 'queued') return 'queued';
		return run.conclusion ?? 'unknown';
	}

	function getVariant(run: WorkflowRun): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (run.status === 'in_progress' || run.status === 'queued') return 'secondary';
		if (run.conclusion === 'success') return 'default';
		if (run.conclusion === 'failure') return 'destructive';
		return 'outline';
	}

	function getExtraClass(run: WorkflowRun): string {
		if (run.conclusion === 'success') return 'bg-success text-white';
		if (run.status === 'in_progress') return 'bg-warning text-white';
		return '';
	}
</script>

<Badge variant={getVariant(run)} class={getExtraClass(run)}>
	{getLabel(run)}
</Badge>
