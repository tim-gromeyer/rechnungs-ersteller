<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import type { Invoice } from '$lib/types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ArrowLeft, Trash2, Edit } from 'lucide-svelte';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import * as m from '$lib/paraglide/messages';

	let invoices = $state<Invoice[]>([]);
	let deleteDialogOpen = $state(false);
	let invoiceToDelete = $state<string | null>(null);

	onMount(async () => {
		await loadInvoices();
	});

	async function loadInvoices() {
		try {
			invoices = await db.getAllInvoices();
			// Sort by date desc
			invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		} catch (e) {
			console.error('Failed to load invoices:', e);
		}
	}

	function handleEdit(invoice: Invoice) {
		// We don't strictly need to set state here as the page will load it,
		// but it makes the transition smoother if we do (optional).
		// invoiceState.invoice = invoice;
		goto(`/invoices/${invoice.id}`);
	}

	async function handleCreateNew() {
		console.log('handleCreateNew called');
		try {
			// Create a new invoice in state (which generates ID)
			invoiceState.createNewInvoice();
			console.log('Invoice created in state:', invoiceState.invoice.id);

			// Save it immediately so it exists when we navigate
			// Use snapshot to ensure we have a plain object, not a proxy
			const invoiceToSave = $state.snapshot(invoiceState.invoice);
			await db.saveInvoice(invoiceToSave);
			console.log('Invoice saved to DB');

			const url = `/invoices/${invoiceState.invoice.id}`;
			console.log('Navigating to:', url);
			await goto(url);
		} catch (e) {
			console.error('Error in handleCreateNew:', e);
		}
	}

	function confirmDelete(id: string) {
		invoiceToDelete = id;
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (invoiceToDelete) {
			await db.deleteInvoice(invoiceToDelete);
			await loadInvoices();
			invoiceToDelete = null;
		}
	}

	function formatCurrency(amount: number, currency: string) {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
	}

	function calculateTotal(invoice: Invoice) {
		const subtotal = invoice.articles.reduce(
			(sum, article) => sum + article.pricePerUnit * article.amount,
			0
		);
		const discountTotal = invoice.discounts.reduce((sum, discount) => sum + discount.amount, 0);
		const totalBeforeTax = subtotal - discountTotal;
		const tax = totalBeforeTax * (invoice.settings.vatRate / 100);
		return totalBeforeTax + tax;
	}
</script>

<div class="container mx-auto max-w-5xl p-8">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/">
				<ArrowLeft size={24} />
			</Button>
			<h1 class="text-3xl font-bold">{m.dashboard_title()}</h1>
		</div>
		<Button onclick={handleCreateNew} variant="default">{m.dashboard_newInvoice()}</Button>
	</div>

	<div class="grid gap-4">
		{#if invoices.length === 0}
			<Card>
				<CardContent class="text-muted-foreground flex flex-col items-center justify-center py-12">
					<p>{m.dashboard_noInvoicesFound()}</p>
					<Button variant="link" onclick={handleCreateNew}
						>{m.dashboard_createFirstInvoice()}</Button
					>
				</CardContent>
			</Card>
		{:else}
			{#each invoices as invoice (invoice.id)}
				<Card class="hover:bg-muted/50 transition-colors">
					<CardContent class="flex items-center justify-between p-6">
						<div class="grid gap-1">
							<div class="font-semibold">
								{invoice.number || m.dashboard_draft()}
								<span class="text-muted-foreground ml-2 font-normal">
									{new Date(invoice.date).toLocaleDateString('de-DE')}
								</span>
							</div>
							<div class="text-muted-foreground text-sm">
								{invoice.customer.company || invoice.customer.name || m.dashboard_unknownCustomer()}
							</div>
						</div>

						<div class="flex items-center gap-6">
							<div class="text-right font-medium">
								{formatCurrency(calculateTotal(invoice), invoice.settings.currency)}
							</div>
							<div class="flex gap-2">
								<Button variant="ghost" size="icon" onclick={() => handleEdit(invoice)}>
									<Edit size={18} />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive hover:text-destructive"
									onclick={() => confirmDelete(invoice.id)}
								>
									<Trash2 size={18} />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={m.dashboard_deleteInvoice()}
	description={m.dashboard_confirmDeleteDescription()}
	onConfirm={handleDelete}
	onCancel={() => (deleteDialogOpen = false)}
/>
