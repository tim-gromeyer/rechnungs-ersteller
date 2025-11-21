<script lang="ts">
	import { toggleMode } from 'mode-watcher';
	import { cn } from '$lib/utils/cn';
	import { Moon, Sun, FileText } from 'lucide-svelte';

	import type { Snippet } from 'svelte';
	let { children }: { children?: Snippet } = $props();
	let isDarkMode = $state(false);

	// We can't easily access document in script module context or during SSR,
	// but mode-watcher handles the actual toggling.
	// For the icon state, we might need to rely on a store or just let it be client-side.
	// Since this is a simple extraction, I'll keep the structure but simplify the dark mode check if needed.
	// Actually, mode-watcher provides a store `mode` we could use, but let's stick to the working implementation or improve it.

	// Re-implementing the observer logic from the original page for now to ensure it works the same.
	import { onMount } from 'svelte';

	onMount(() => {
		isDarkMode = document.documentElement.classList.contains('dark');
		const observer = new MutationObserver(() => {
			isDarkMode = document.documentElement.classList.contains('dark');
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	});
</script>

<nav
	class="border-border/40 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur-xl print:hidden"
>
	<div class="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 md:px-8">
		<a
			href="/"
			class="hover:text-primary flex items-center gap-2 text-xl font-semibold tracking-tight transition-colors"
		>
			Rechnungs-Ersteller
		</a>
		<div class="flex items-center gap-2">
			<button
				onclick={toggleMode}
				class={cn(
					'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95'
				)}
				aria-label="Toggle theme"
			>
				{#if isDarkMode}
					<Sun size={20} />
				{:else}
					<Moon size={20} />
				{/if}
			</button>

			<a
				href="/dashboard"
				class={cn(
					'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all hover:scale-105 active:scale-95'
				)}
			>
				<FileText size={18} />
				<span class="hidden sm:inline">Übersicht</span>
			</a>

			{@render children?.()}
		</div>
	</div>
</nav>
