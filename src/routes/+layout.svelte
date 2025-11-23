<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';
	import { i18n } from '$lib/i18n';
	import * as m from '$lib/paraglide/messages';
	import { page } from '$app/stores';
	import { locales } from '$lib/paraglide/runtime';

	let { children } = $props();

	// Function to generate the full URL for a given locale
	function getHreflangUrl(locale: string) {
		// i18n.resolveRoute returns the path for the given locale
		const path = i18n.resolveRoute($page.url.pathname, locale);
		return `${$page.url.origin}${path}`;
	}
</script>

<svelte:head>
	<title>{m.meta_app_name()} - Rechnungs-Assistent</title>
	<meta name="description" content="Modern invoice generator with ZUGFeRD support" />

	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href={getHreflangUrl(locale)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={getHreflangUrl('en')} />
</svelte:head>

<ModeWatcher />

{@render children()}
