<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />

<svelte:head>
	<title>Rechnungs-Ersteller - Rechnungs-Assistent</title>
	<meta name="description" content="Modern invoice generator with ZUGFeRD support" />
</svelte:head>

{@render children()}
