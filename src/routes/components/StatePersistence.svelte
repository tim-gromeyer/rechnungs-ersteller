<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { browser } from '$app/environment';
	import { db } from '$lib/db';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Load the last active invoice on mount
	onMount(async () => {
		if (!browser) return;
		try {
			const savedInvoice = await db.loadLastActiveInvoice();
			if (savedInvoice) {
				// Merge with default to ensure new fields are present if any
				invoiceState.invoice = {
					...invoiceState.invoice,
					...savedInvoice,
					sender: { ...invoiceState.invoice.sender, ...savedInvoice.sender },
					settings: { ...invoiceState.invoice.settings, ...savedInvoice.settings }
				};
			}
		} catch (e) {
			console.error('Failed to load invoice from DB:', e);
		}
	});

	// Auto-save the entire invoice state to IndexedDB, but only after a short delay
	$effect(() => {
		if (!browser) return;

		// Access invoiceState.invoice directly to maintain reactivity
		// Serialize synchronously to track all deep dependencies (implicitly by accessing properties)
		const currentInvoice = $state.snapshot(invoiceState.invoice);

		const handler = setTimeout(() => {
			db.saveInvoice(currentInvoice).catch((e) => console.error('Failed to save invoice:', e));
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	});
</script>

{@render children()}
