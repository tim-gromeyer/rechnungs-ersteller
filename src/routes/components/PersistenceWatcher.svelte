<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';

	let { invoice } = invoiceState;
	let { children } = $props();

	// Auto-save sender data to localStorage whenever it changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('invoice-sender', JSON.stringify(invoice.sender));
		}
	});
</script>

{@render children()}
