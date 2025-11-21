<script lang="ts">
	// import { locale } from 'svelte-i18n'; // Removed
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Languages } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { class: className = undefined } = $props();

	function changeLanguage(newLocale: string) {
		const currentPathname = $page.url.pathname;
		const supportedLocales = ['en', 'de']; // Consider making this dynamic if possible

		let pathSegments = currentPathname.split('/').filter((s) => s !== ''); // Split and remove empty strings

		// Check if the first segment is a supported locale and remove it
		if (pathSegments.length > 0 && supportedLocales.includes(pathSegments[0])) {
			pathSegments.shift();
		}

		// Prepend the new locale
		pathSegments.unshift(newLocale);

		const newPath = `/${pathSegments.join('/')}`;
		goto(newPath);
		document.cookie = `lang=${newLocale}; max-age=${60 * 60 * 24 * 365}; path=/`;
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
		<DropdownMenu.Item onclick={() => changeLanguage('en')}>English</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => changeLanguage('de')}>Deutsch</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
