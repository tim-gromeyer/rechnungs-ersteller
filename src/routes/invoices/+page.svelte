<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import type { Invoice } from '$lib/types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { FileText, Plus, ArrowLeft, Edit, Trash2, Search, Filter, Download } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { cn } from '$lib/utils';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import { googleDriveSync } from '$lib/utils/googleDrive';

	let invoices = $state<Invoice[]>([]);
	let searchQuery = $state('');
	let deleteDialogOpen = $state(false);
	let invoiceToDelete = $state<string | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		await loadInvoices();
	});

	async function loadInvoices() {
		isLoading = true;
		try {
			invoices = await db.getAllInvoices();
			// Sort by date descending
			invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		} catch (e) {
			console.error('Error loading invoices:', e);
		} finally {
			isLoading = false;
		}
	}

	let filteredInvoices = $derived(
		invoices.filter(
			(inv) =>
				inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
				inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(inv.title && inv.title.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);

	function handleEdit(id: string) {
		goto(`/invoices/${id}`);
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

			// Auto-sync to cloud if logged in
			googleDriveSync.getValidToken().then((token) => {
				if (token)
					googleDriveSync.syncToCloud().catch((err) => console.error('Cloud sync failed:', err));
			});
		}
	}

	async function togglePaidStatus(invoice: Invoice) {
		const updatedInvoice = { ...invoice, isPaid: !invoice.isPaid };
		await db.saveInvoice($state.snapshot(updatedInvoice));
		await loadInvoices();

		// Auto-sync to cloud if logged in
		googleDriveSync.getValidToken().then((token) => {
			if (token)
				googleDriveSync.syncToCloud().catch((err) => console.error('Cloud sync failed:', err));
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
	}

	function calculateTotal(invoice: Invoice) {
		const subtotal = invoice.articles.reduce((sum, art) => sum + art.pricePerUnit * art.amount, 0);
		const discountTotal = invoice.discounts.reduce((sum, d) => sum + d.amount, 0);
		const totalVat = (subtotal - discountTotal) * (invoice.settings.vatRate / 100);
		return subtotal - discountTotal + totalVat;
	}

	async function handleCreateNew() {
		try {
			const { invoiceState } = await import('$lib/state.svelte');
			invoiceState.createNewInvoice();
			const invoiceToSave = $state.snapshot(invoiceState.invoice);
			await db.saveInvoice(invoiceToSave);
			await goto(`/invoices/${invoiceState.invoice.id}`);
		} catch (e) {
			console.error('Error creating new invoice:', e);
		}
	}
</script>

<div class="container mx-auto max-w-6xl p-4 sm:p-8">
	<div class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-5">
			<Button
				variant="outline"
				size="icon"
				href="/dashboard"
				class="shrink-0 rounded-full shadow-sm"
			>
				<ArrowLeft size={20} />
			</Button>
			<div>
				<h1 class="text-4xl font-extrabold tracking-tight">{m.common_invoices()}</h1>
				<p class="text-muted-foreground mt-1 text-sm font-medium">
					Verwalte deine Rechnungen und Zahlungsstatus professionell
				</p>
			</div>
		</div>
		<Button onclick={handleCreateNew} class="h-10 px-5 font-semibold shadow-md active:scale-95">
			<Plus size={18} class="mr-2" />
			{m.dashboard_newInvoice()}
		</Button>
	</div>

	<div class="mb-8 grid gap-4 sm:flex">
		<div class="relative flex-grow">
			<Search class="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
			<input
				type="text"
				placeholder="Suchen nach Nummer, Kunde oder Titel..."
				bind:value={searchQuery}
				class="bg-card focus:ring-primary h-11 w-full rounded-xl border px-4 pl-11 shadow-sm transition-all outline-none focus:ring-2"
			/>
		</div>
		<div class="flex gap-2">
			<Button
				variant="outline"
				size="icon"
				class="h-11 w-11 rounded-xl shadow-sm"
				title="Filter (coming soon)"
			>
				<Filter size={18} />
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="h-11 w-11 rounded-xl shadow-sm"
				title="Export CSV (coming soon)"
			>
				<Download size={18} />
			</Button>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="border-primary h-10 w-10 animate-spin rounded-full border-b-2"></div>
		</div>
	{:else if filteredInvoices.length === 0}
		<Card class="border-dashed bg-transparent py-24 text-center shadow-none">
			<CardContent class="flex flex-col items-center gap-4 opacity-30">
				<FileText size={64} />
				<div>
					<h3 class="text-2xl font-bold tracking-tight">Keine Rechnungen gefunden</h3>
					<p class="text-muted-foreground mx-auto max-w-sm">
						Erstelle deine erste Rechnung, um sie hier professionell zu verwalten.
					</p>
				</div>
				<Button onclick={handleCreateNew} variant="outline" class="mt-4 font-bold"
					>Jetzt Rechnung schreiben</Button
				>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each filteredInvoices as invoice (invoice.id)}
				<Card
					class="hover:bg-muted/40 group overflow-hidden border-none ring-1 shadow-lg ring-black/[0.05] transition-all duration-300 dark:ring-white/[0.05]"
				>
					<CardContent
						class="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex items-center gap-5">
							<div
								class={cn(
									'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-300',
									invoice.isPaid
										? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
										: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
								)}
							>
								<FileText size={24} />
							</div>
							<div class="grid gap-1">
								<div class="flex items-center gap-3">
									<span class="text-xl font-semibold tracking-tight">{invoice.number}</span>
									{#if invoice.title}
										<span class="text-muted-foreground hidden text-sm font-medium sm:inline"
											>• {invoice.title}</span
										>
									{/if}
								</div>
								<div
									class="text-muted-foreground flex items-center gap-2 text-[11px] font-medium tracking-wider uppercase"
								>
									<span class="bg-muted text-foreground rounded px-2 py-0.5"
										>{new Date(invoice.date).toLocaleDateString('de-DE')}</span
									>
									<span class="opacity-30">•</span>
									<span class="text-foreground font-medium">{invoice.customer.name}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between gap-8 border-t pt-4 sm:border-0 sm:pt-0">
							<div class="flex items-center gap-8">
								<div class="flex flex-col items-end">
									<span
										class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase opacity-50"
										>Zahlungsstatus</span
									>
									<div class="mt-1 flex items-center gap-3">
										<span
											class={cn(
												'text-xs font-semibold tracking-tight uppercase',
												invoice.isPaid
													? 'text-green-600 dark:text-green-400'
													: 'text-blue-600 dark:text-blue-400'
											)}
										>
											{invoice.isPaid ? 'Bezahlt' : 'Offen'}
										</span>
										<Switch
											checked={invoice.isPaid}
											onCheckedChange={() => togglePaidStatus(invoice)}
										/>
									</div>
								</div>
								<div class="bg-border hidden h-10 w-px sm:block"></div>
								<div class="flex min-w-[140px] flex-col items-end">
									<span
										class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase opacity-50"
										>Bruttobetrag</span
									>
									<div class="text-2xl font-semibold tracking-tighter">
										{formatCurrency(calculateTotal(invoice))}
									</div>
								</div>
							</div>

							<div class="flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
								<Button
									variant="secondary"
									size="icon"
									onclick={() => handleEdit(invoice.id)}
									class="hover:bg-primary hover:text-primary-foreground h-10 w-10 rounded-full shadow-sm"
								>
									<Edit size={18} />
								</Button>
								<Button
									variant="secondary"
									size="icon"
									onclick={() => confirmDelete(invoice.id)}
									class="text-destructive hover:bg-destructive h-10 w-10 rounded-full shadow-sm hover:text-white"
								>
									<Trash2 size={18} />
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={m.dashboard_deleteInvoice()}
	description={m.dashboard_confirmDeleteDescription()}
	onConfirm={handleDelete}
	onCancel={() => (deleteDialogOpen = false)}
/>
