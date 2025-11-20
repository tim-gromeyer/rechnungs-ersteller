<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	// Auto-save the entire invoice state to localStorage, but only after a short delay
	$effect(() => {
		if (!browser) return;

		// Access invoiceState.invoice directly to maintain reactivity
		const currentInvoice = invoiceState.invoice;

		const handler = setTimeout(() => {
			localStorage.setItem('invoice-state', JSON.stringify(currentInvoice));
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	});
</script>

{@render children()}
