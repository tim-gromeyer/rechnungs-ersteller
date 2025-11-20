<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { browser } from '$app/environment';

	let { invoice } = invoiceState;
	let { children } = $props();

	// Auto-save the entire invoice state to localStorage, but only after a short delay
	$effect(() => {
		if (!browser) return;

		const handler = setTimeout(() => {
			localStorage.setItem('invoice-state', JSON.stringify(invoice));
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	});
</script>

{@render children()}