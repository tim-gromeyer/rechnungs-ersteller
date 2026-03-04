<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import type { Invoice, Expense } from '$lib/types';
	import { goto, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import * as m from '$lib/paraglide/messages';

	import {
		LayoutDashboard,
		FileText,
		Receipt,
		ArrowUpRight,
		ArrowDownLeft,
		Trash2,
		Edit,
		Plus
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import ExportButton from '../components/ExportButton.svelte';

	let invoices = $state<Invoice[]>([]);
	let expenses = $state<Expense[]>([]);
	let deleteDialogOpen = $state(false);
	let itemToDelete = $state<{ id: string; type: 'invoice' | 'expense' } | null>(null);

	let selectedYear = $state<number>(new Date().getFullYear());
	let activeTab = $state<'invoices' | 'expenses' | 'journal'>('journal');
	let isMounted = $state(false);

	onMount(async () => {
		await loadData();

		// Handle tab selection via URL parameter using browser API for stability in Svelte 5 script
		const urlParams = new URLSearchParams(window.location.search);
		const tab = urlParams.get('tab');
		if (tab === 'invoices' || tab === 'expenses' || tab === 'journal') {
			activeTab = tab as 'invoices' | 'expenses' | 'journal';
		}

		isMounted = true;
	});

	// Synchronize tab changes with URL (optional but helpful for navigation)
	$effect(() => {
		if (browser && isMounted) {
			const url = new URL(window.location.href);
			if (activeTab === 'journal') {
				url.searchParams.delete('tab');
			} else {
				url.searchParams.set('tab', activeTab);
			}
			replaceState(url.toString(), {});
		}
	});

	async function loadData() {
		try {
			invoices = await db.getAllInvoices();
			expenses = await db.getAllExpenses();
		} catch (e) {
			console.error('Failed to load data:', e);
		}
	}

	function handleEdit(item: { id: string }, type: 'invoice' | 'expense') {
		if (type === 'invoice') {
			goto(`/invoices/${item.id}`);
		} else {
			goto('/expenses'); // Could be more specific if expense editing is on the page
		}
	}

	async function handleCreateNew() {
		try {
			invoiceState.createNewInvoice();
			const invoiceToSave = $state.snapshot(invoiceState.invoice);
			await db.saveInvoice(invoiceToSave);
			await goto(`/invoices/${invoiceState.invoice.id}`);
		} catch (e) {
			console.error('Error in handleCreateNew:', e);
		}
	}

	function confirmDelete(id: string, type: 'invoice' | 'expense') {
		itemToDelete = { id, type };
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (itemToDelete) {
			if (itemToDelete.type === 'invoice') {
				await db.deleteInvoice(itemToDelete.id);
			} else {
				await db.deleteExpense(itemToDelete.id);
			}
			await loadData();
			itemToDelete = null;
		}
	}

	function formatCurrency(amount: number, currency = 'EUR') {
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

	async function togglePaidStatus(invoice: Invoice) {
		invoice.isPaid = !invoice.isPaid;
		await db.saveInvoice($state.snapshot(invoice));
		invoices = [...invoices];
	}

	// Derived metrics based on selected year
	let filteredInvoices = $derived(
		invoices.filter((i) => new Date(i.date).getFullYear() === selectedYear)
	);
	let filteredExpenses = $derived(
		expenses.filter((e) => new Date(e.date).getFullYear() === selectedYear)
	);

	let totalIncome = $derived(
		filteredInvoices.filter((i) => i.isPaid).reduce((sum, inv) => sum + calculateTotal(inv), 0)
	);
	let totalExpenses = $derived(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0));
	let estimatedProfit = $derived(totalIncome - totalExpenses);
	let taxReserve = $derived(Math.max(0, estimatedProfit * 0.25));

	// Combined Journal
	let journalItems = $derived(
		[
			...filteredInvoices.map((inv) => ({
				id: inv.id,
				date: inv.date,
				title: inv.title || inv.number || m.dashboard_draft(),
				subtitle: inv.customer.company || inv.customer.name || m.dashboard_unknownCustomer(),
				amount: calculateTotal(inv),
				type: 'invoice' as const,
				isPaid: inv.isPaid
			})),
			...filteredExpenses.map((exp) => ({
				id: exp.id,
				date: exp.date,
				title: exp.description,
				subtitle: exp.category,
				amount: -exp.amount,
				type: 'expense' as const,
				isPaid: true
			}))
		].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
	);

	let availableYears = $derived(
		Array.from(
			new Set([
				...invoices.map((i) => new Date(i.date).getFullYear()),
				...expenses.map((e) => new Date(e.date).getFullYear()),
				new Date().getFullYear()
			])
		).sort((a, b) => b - a)
	);
</script>

<div class="container mx-auto max-w-5xl space-y-8 py-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">{m.dashboard_title()}</h1>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm font-medium">Jahr:</span>
				<select
					bind:value={selectedYear}
					class="border-input bg-background focus:ring-ring rounded-md border px-3 py-1.5 text-sm shadow-sm outline-none focus:ring-2"
				>
					{#each availableYears as year (year)}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>
			<ExportButton year={selectedYear} />
			<Button onclick={handleCreateNew} variant="default" class="shadow-sm">
				<Plus class="mr-2" size={18} />
				{m.dashboard_newInvoice()}
			</Button>
		</div>
	</div>

	<!-- EÜR Metrics -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card class="border-l-4 border-l-green-500 shadow-sm">
			<CardHeader class="pb-2">
				<CardTitle class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Einnahmen (bezahlt)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
			</CardContent>
		</Card>
		<Card class="border-l-4 border-l-red-500 shadow-sm">
			<CardHeader class="pb-2">
				<CardTitle class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Ausgaben</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
			</CardContent>
		</Card>
		<Card class="border-l-4 border-l-blue-500 shadow-sm">
			<CardHeader class="pb-2">
				<CardTitle class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Gewinn (EÜR)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold {estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
					{formatCurrency(estimatedProfit)}
				</div>
			</CardContent>
		</Card>
		<Card class="border-l-4 border-l-orange-500 shadow-sm">
			<CardHeader class="pb-2">
				<CardTitle class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Steuerrücklage (25%)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-orange-600">{formatCurrency(taxReserve)}</div>
			</CardContent>
		</Card>
	</div>

	<!-- Tabs View -->
	<div class="space-y-4">
		<div class="bg-muted/50 inline-flex rounded-lg p-1 shadow-inner">
			<button
				onclick={() => (activeTab = 'journal')}
				class={cn(
					'flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all',
					activeTab === 'journal'
						? 'bg-background shadow-sm'
						: 'hover:bg-muted-foreground/10 text-muted-foreground'
				)}
			>
				<LayoutDashboard size={16} />
				{m.dashboard_tab_journal()}
			</button>
			<button
				onclick={() => (activeTab = 'invoices')}
				class={cn(
					'flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all',
					activeTab === 'invoices'
						? 'bg-background shadow-sm'
						: 'hover:bg-muted-foreground/10 text-muted-foreground'
				)}
			>
				<FileText size={16} />
				{m.dashboard_tab_invoices()}
			</button>
			<button
				onclick={() => (activeTab = 'expenses')}
				class={cn(
					'flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all',
					activeTab === 'expenses'
						? 'bg-background shadow-sm'
						: 'hover:bg-muted-foreground/10 text-muted-foreground'
				)}
			>
				<Receipt size={16} />
				{m.dashboard_tab_expenses()}
			</button>
		</div>

		<div class="grid gap-4">
			{#if activeTab === 'journal'}
				{#if journalItems.length === 0}
					<Card class="bg-muted/20 border-dashed shadow-none">
						<CardContent
							class="text-muted-foreground flex flex-col items-center justify-center py-16"
						>
							<p>Keine Einträge für {selectedYear} gefunden.</p>
						</CardContent>
					</Card>
				{:else}
					{#each journalItems as item (item.id)}
						<Card class="hover:bg-muted/30 group transition-all">
							<CardContent class="flex items-center justify-between p-5">
								<div class="flex items-center gap-4">
									<div
										class={cn(
											'flex h-10 w-10 items-center justify-center rounded-full shadow-sm',
											item.type === 'invoice'
												? item.isPaid
													? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
													: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
												: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
										)}
									>
										{#if item.type === 'invoice'}
											{#if item.isPaid}
												<ArrowUpRight size={20} />
											{:else}
												<FileText size={20} />
											{/if}
										{:else}
											<ArrowDownLeft size={20} />
										{/if}
									</div>
									<div class="grid gap-0.5">
										<div class="font-semibold">{item.title}</div>
										<div class="text-muted-foreground flex items-center gap-2 text-xs">
											<span>{new Date(item.date).toLocaleDateString('de-DE')}</span>
											<span class="opacity-30">•</span>
											<span>{item.subtitle}</span>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-6">
									<div
										class={cn(
											'min-w-[100px] text-right font-bold',
											item.amount >= 0 ? 'text-green-600' : 'text-red-600'
										)}
									>
										{item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
									</div>
									<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8"
											onclick={() => handleEdit(item, item.type)}
										>
											<Edit size={14} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:text-destructive h-8 w-8"
											onclick={() => confirmDelete(item.id, item.type)}
										>
											<Trash2 size={14} />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				{/if}
			{:else if activeTab === 'invoices'}
				{#each filteredInvoices as invoice (invoice.id)}
					<!-- Redered similarly to journal but with invoice-specific features -->
					<Card class="hover:bg-muted/30 group transition-all">
						<CardContent class="flex items-center justify-between p-5">
							<div class="flex items-center gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
								>
									<FileText size={20} />
								</div>
								<div class="grid gap-0.5">
									<div class="font-semibold">
										{invoice.title || invoice.number || m.dashboard_draft()}
									</div>
									<div class="text-muted-foreground text-xs">
										{new Date(invoice.date).toLocaleDateString('de-DE')} • {invoice.customer.name}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground text-xs tracking-tighter uppercase"
										>Bezahlt</span
									>
									<Switch
										checked={invoice.isPaid}
										onCheckedChange={() => togglePaidStatus(invoice)}
									/>
								</div>
								<div class="min-w-[100px] text-right font-bold">
									{formatCurrency(calculateTotal(invoice))}
								</div>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => handleEdit(invoice, 'invoice')}><Edit size={14} /></Button
								>
							</div>
						</CardContent>
					</Card>
				{/each}
			{:else if activeTab === 'expenses'}
				{#each filteredExpenses as expense (expense.id)}
					<Card class="hover:bg-muted/30 group transition-all">
						<CardContent class="flex items-center justify-between p-5">
							<div class="flex items-center gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
								>
									<Receipt size={20} />
								</div>
								<div class="grid gap-0.5">
									<div class="font-semibold">{expense.description}</div>
									<div class="text-muted-foreground text-xs">
										{new Date(expense.date).toLocaleDateString('de-DE')} • {expense.category}
									</div>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<div class="min-w-[100px] text-right font-bold text-red-600">
									-{formatCurrency(expense.amount)}
								</div>
								<Button
									variant="ghost"
									size="icon"
									class="h-8 w-8"
									onclick={() => goto('/expenses')}><Edit size={14} /></Button
								>
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</div>
	</div>
</div>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title={itemToDelete?.type === 'invoice' ? m.dashboard_deleteInvoice() : 'Ausgabe löschen'}
	description={m.dashboard_confirmDeleteDescription()}
	onConfirm={handleDelete}
	onCancel={() => (deleteDialogOpen = false)}
/>
