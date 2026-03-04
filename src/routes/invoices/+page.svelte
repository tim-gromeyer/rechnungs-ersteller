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
		}
	}

	async function togglePaidStatus(invoice: Invoice) {
		const updated = { ...invoice, isPaid: !invoice.isPaid };
		await db.saveInvoice($state.snapshot(updated));
		await loadInvoices();
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
</script>

<div class="container mx-auto max-w-6xl p-4 sm:p-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/dashboard" class="shrink-0">
				<ArrowLeft size={24} />
			</Button>
			<div>
				<h1 class="text-3xl font-bold">{m.common_invoices()}</h1>
				<p class="text-muted-foreground text-sm">Verwalte deine Rechnungen und Zahlungsstatus</p>
			</div>
		</div>
		<Button href="/invoices/new" class="gap-2">
			<Plus size={18} />
			{m.dashboard_newInvoice()}
		</Button>
	</div>

	<div class="mb-6 flex flex-col gap-4 sm:flex-row">
		<div class="relative flex-grow">
			<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
			<input
				type="text"
				placeholder="Suchen nach Nummer, Kunde oder Titel..."
				bind:value={searchQuery}
				class="bg-card focus:ring-primary w-full rounded-md border py-2 pr-4 pl-10 transition-all outline-none focus:ring-2"
			/>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" size="icon" title="Filter (coming soon)">
				<Filter size={18} />
			</Button>
			<Button variant="outline" size="icon" title="Export CSV (coming soon)">
				<Download size={18} />
			</Button>
		</div>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
		</div>
	{:else if filteredInvoices.length === 0}
		<Card class="border-dashed py-20 text-center">
			<div class="flex flex-col items-center gap-4">
				<div class="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
					<FileText size={32} class="text-muted-foreground" />
				</div>
				<div>
					<h3 class="text-xl font-semibold">Keine Rechnungen gefunden</h3>
					<p class="text-muted-foreground">
						Erstelle deine erste Rechnung, um sie hier zu verwalten.
					</p>
				</div>
				<Button href="/" variant="outline">Jetzt Rechnung schreiben</Button>
			</div>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each filteredInvoices as invoice (invoice.id)}
				<Card class="hover:bg-muted/30 group transition-all">
					<CardContent
						class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex items-center gap-4">
							<div
								class={cn(
									'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
									invoice.isPaid
										? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
								)}
							>
								<FileText size={24} />
							</div>
							<div class="grid gap-0.5">
								<div class="flex items-center gap-2 text-lg font-bold">
									{invoice.number}
									{#if invoice.title}
										<span class="text-muted-foreground text-sm font-medium">• {invoice.title}</span>
									{/if}
								</div>
								<div class="text-muted-foreground flex items-center gap-2 text-sm">
									<span>{new Date(invoice.date).toLocaleDateString('de-DE')}</span>
									<span>•</span>
									<span class="text-foreground font-medium">{invoice.customer.name}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between gap-6 border-t pt-4 sm:border-0 sm:pt-0">
							<div class="flex items-center gap-3">
								<div class="flex flex-col items-end">
									<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
										>Status</span
									>
									<div class="flex items-center gap-2">
										<span
											class={cn(
												'text-xs font-medium',
												invoice.isPaid ? 'text-green-600' : 'text-blue-600'
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
								<div class="bg-border hidden h-8 w-px sm:block"></div>
								<div class="flex min-w-[120px] flex-col items-end">
									<span class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase"
										>Betrag</span
									>
									<div class="text-xl font-extrabold">
										{formatCurrency(calculateTotal(invoice))}
									</div>
								</div>
							</div>

							<div class="flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									onclick={() => handleEdit(invoice.id)}
									class="h-10 w-10"
								>
									<Edit size={18} />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => confirmDelete(invoice.id)}
									class="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10"
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
	title="Rechnung löschen?"
	description="Diese Aktion kann nicht rückgängig gemacht werden. Die Rechnung wird dauerhaft gelöscht."
	onConfirm={handleDelete}
	onCancel={() => (deleteDialogOpen = false)}
/>
