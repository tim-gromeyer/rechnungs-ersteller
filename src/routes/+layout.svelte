<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Invoice Creator - Rechnungs-Assistent</title>
	<meta name="description" content="Modern invoice generator with ZUGFeRD support" />
</svelte:head>

{@render children()}
