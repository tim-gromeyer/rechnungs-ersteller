<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';
	import { t } from 'svelte-i18n';
	import { page } from '$app/stores';

	let { children, data } = $props();
	const { lang } = data; // Correctly destructure lang from data

	// Define available locales
	const locales = ['en', 'de'];

	// Function to generate the full URL for a given locale
	function getHreflangUrl(locale: string) {
		// Get the current path without the language prefix
		const pathWithoutLang = $page.url.pathname.replace(`/${lang}`, '');
		// Construct the new URL with the desired locale
		return `${$page.url.origin}/${locale}${pathWithoutLang}${$page.url.search}`;
	}
</script>

<ModeWatcher />

<svelte:head>
	<title>{$t('meta.app_name')} - Rechnungs-Assistent</title>
	<meta name="description" content="Modern invoice generator with ZUGFeRD support" />

	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href={getHreflangUrl(locale)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={getHreflangUrl('en')} />
</svelte:head>

{@render children()}
