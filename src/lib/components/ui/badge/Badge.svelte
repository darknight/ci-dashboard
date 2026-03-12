<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { BadgeVariant } from './index';

	let { variant = 'default', class: className, children }: { variant?: BadgeVariant; class?: string; children?: Snippet } = $props();

	const variantClasses: Record<string, string> = {
		default: 'border-transparent bg-primary text-primary-foreground',
		secondary: 'border-transparent bg-secondary text-secondary-foreground',
		destructive: 'border-transparent bg-destructive text-destructive-foreground',
		outline: 'text-foreground'
	};
</script>

<div
	class={cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
		variantClasses[variant],
		className
	)}
>
	{@render children?.()}
</div>
