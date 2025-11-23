<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Languages } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { page } from '$app/stores';
	import { locales, getLocale } from '$lib/paraglide/runtime';
	import { i18n } from '$lib/i18n';

	let { class: className = undefined } = $props();

	function changeLanguage(newLocale: string) {
		if (newLocale === getLocale()) return;

		// Resolve the current path for the new locale
		const newPath = i18n.resolveRoute($page.url.pathname, newLocale);
		// Use window.location to force a full page reload and update the locale context
		window.location.href = newPath;
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(
			'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95',
			className
		)}
	>
		<Languages size={20} />
		<span class="sr-only">Toggle language</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#each locales as tag (tag)}
			<DropdownMenu.Item onclick={() => changeLanguage(tag)}>
				{tag === 'en' ? 'English' : 'Deutsch'}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
