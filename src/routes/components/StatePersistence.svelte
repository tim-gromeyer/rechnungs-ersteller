<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	// Auto-save the entire invoice state to localStorage, but only after a short delay
	$effect(() => {
		if (!browser) return;

		// Access invoiceState.invoice directly to maintain reactivity
		// Serialize synchronously to track all deep dependencies
		const serialized = JSON.stringify(invoiceState.invoice);

		const handler = setTimeout(() => {
			localStorage.setItem('invoice-state', serialized);
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	});
</script>

{@render children()}
