<script lang="ts">
	let { health }: { health: 'green' | 'red' | 'yellow' | 'unknown' } = $props();

	const colorMap: Record<string, string> = {
		green: 'bg-success',
		red: 'bg-destructive',
		yellow: 'bg-warning',
		unknown: 'bg-muted-foreground'
	};
</script>

<span class="relative flex h-3 w-3">
	{#if health === 'yellow'}
		<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75"></span>
	{/if}
	<span class="relative inline-flex h-3 w-3 rounded-full {colorMap[health]}"></span>
</span>
