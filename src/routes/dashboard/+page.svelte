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

<div class="container mx-auto max-w-6xl space-y-10 p-4 sm:p-8">
	<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-4xl font-extrabold tracking-tight">{m.dashboard_title()}</h1>
			<p class="text-muted-foreground mt-1 text-sm font-medium">
				Dein finanzieller Überblick in Echtzeit
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div
				class="bg-card border-input flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm"
			>
				<span class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Jahr</span>
				<select bind:value={selectedYear} class="bg-transparent text-sm font-bold outline-none">
					{#each availableYears as year (year)}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>
			<ExportButton year={selectedYear} />
			<Button
				onclick={handleCreateNew}
				variant="default"
				class="h-10 px-5 font-bold shadow-md active:scale-95"
			>
				<Plus class="mr-2" size={18} />
				{m.dashboard_newInvoice()}
			</Button>
		</div>
	</div>

	<!-- EÜR Metrics -->
	<div class="grid gap-6 md:grid-cols-4">
		<Card
			class="relative overflow-hidden border-none ring-1 shadow-xl ring-black/[0.05] dark:ring-white/[0.05]"
		>
			<div class="absolute inset-x-0 top-0 h-1 bg-green-500"></div>
			<CardHeader class="pb-2">
				<CardTitle
					class="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60"
					>Einnahmen (bezahlt)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black tracking-tighter text-green-600 dark:text-green-400">
					{formatCurrency(totalIncome)}
				</div>
			</CardContent>
		</Card>

		<Card
			class="relative overflow-hidden border-none ring-1 shadow-xl ring-black/[0.05] dark:ring-white/[0.05]"
		>
			<div class="absolute inset-x-0 top-0 h-1 bg-red-500"></div>
			<CardHeader class="pb-2">
				<CardTitle
					class="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60"
					>Gesamtausgaben</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-black tracking-tighter text-rose-600 dark:text-rose-400">
					{formatCurrency(totalExpenses)}
				</div>
			</CardContent>
		</Card>

		<Card
			class="relative overflow-hidden border-none ring-1 shadow-xl ring-black/[0.05] dark:ring-white/[0.05]"
		>
			<div class="absolute inset-x-0 top-0 h-1 bg-blue-500"></div>
			<CardHeader class="pb-2">
				<CardTitle
					class="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-60"
					>Gewinn (EÜR)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div
					class="text-3xl font-bold tracking-tighter {estimatedProfit >= 0
						? 'text-green-600 dark:text-green-400'
						: 'text-rose-600 dark:text-rose-400'}"
				>
					{formatCurrency(estimatedProfit)}
				</div>
			</CardContent>
		</Card>

		<Card
			class="relative overflow-hidden border-none ring-1 shadow-xl ring-black/[0.05] dark:ring-white/[0.05]"
		>
			<div class="absolute inset-x-0 top-0 h-1 bg-orange-500"></div>
			<CardHeader class="pb-2">
				<CardTitle
					class="text-muted-foreground text-[10px] font-bold tracking-widest uppercase opacity-60"
					>Steuerrücklage (25%)</CardTitle
				>
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-bold tracking-tighter text-orange-600 dark:text-orange-400">
					{formatCurrency(taxReserve)}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Tabs View -->
	<div class="space-y-6">
		<div class="bg-muted/50 inline-flex w-full rounded-xl p-1.5 shadow-inner sm:w-auto">
			<button
				onclick={() => {
					activeTab = 'journal';
				}}
				class={cn(
					'flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 sm:flex-none',
					activeTab === 'journal'
						? 'bg-background text-foreground shadow-md'
						: 'text-muted-foreground hover:bg-muted-foreground/10'
				)}
			>
				<LayoutDashboard size={18} />
				{m.dashboard_tab_journal()}
			</button>
			<button
				onclick={() => {
					activeTab = 'invoices';
				}}
				class={cn(
					'flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 sm:flex-none',
					activeTab === 'invoices'
						? 'bg-background text-foreground shadow-md'
						: 'text-muted-foreground hover:bg-muted-foreground/10'
				)}
			>
				<FileText size={18} />
				{m.dashboard_tab_invoices()}
			</button>
			<button
				onclick={() => {
					activeTab = 'expenses';
				}}
				class={cn(
					'flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 sm:flex-none',
					activeTab === 'expenses'
						? 'bg-background text-foreground shadow-md'
						: 'text-muted-foreground hover:bg-muted-foreground/10'
				)}
			>
				<Receipt size={18} />
				{m.dashboard_tab_expenses()}
			</button>
		</div>

		<div class="grid gap-4">
			{#if activeTab === 'journal'}
				{#if journalItems.length === 0}
					<Card class="border-dashed bg-transparent py-24 text-center shadow-none">
						<CardContent class="text-muted-foreground flex flex-col items-center justify-center">
							<div
								class="bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full opacity-30"
							>
								<FileText size={40} />
							</div>
							<p class="mb-6 text-lg font-bold tracking-tight">
								Keine Einträge für {selectedYear} gefunden.
							</p>
							<Button onclick={handleCreateNew} variant="outline" class="font-bold">
								<Plus class="mr-2" size={18} />
								{m.dashboard_newInvoice()}
							</Button>
						</CardContent>
					</Card>
				{:else}
					{#each journalItems as item (item.id)}
						<Card
							class="hover:bg-muted/40 group overflow-hidden border-none ring-1 shadow-md ring-black/[0.05] transition-all duration-300 dark:ring-white/[0.05]"
						>
							<CardContent class="flex items-center justify-between p-5">
								<div class="flex items-center gap-5">
									<div
										class={cn(
											'flex h-12 w-12 items-center justify-center rounded-xl shadow-inner transition-all duration-300',
											item.type === 'invoice'
												? item.isPaid
													? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
													: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
												: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
										)}
									>
										{#if item.type === 'invoice'}
											{#if item.isPaid}
												<ArrowUpRight size={22} class="stroke-[3]" />
											{:else}
												<FileText size={22} />
											{/if}
										{:else}
											<ArrowDownLeft size={22} class="stroke-[3]" />
										{/if}
									</div>
									<div class="grid gap-0.5">
										<div class="text-lg font-semibold tracking-tight">{item.title}</div>
										<div
											class="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase"
										>
											<span class="bg-muted text-foreground rounded px-2 py-0.5"
												>{new Date(item.date).toLocaleDateString('de-DE')}</span
											>
											<span class="opacity-30">•</span>
											<span class="font-medium">{item.subtitle}</span>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-8">
									<div
										class={cn(
											'min-w-[120px] text-right text-xl font-semibold tracking-tighter',
											item.amount >= 0
												? 'text-green-600 dark:text-green-400'
												: 'text-rose-600 dark:text-rose-400'
										)}
									>
										{item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
									</div>
									<div
										class="flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100"
									>
										<Button
											variant="secondary"
											size="icon"
											class="hover:bg-primary hover:text-primary-foreground h-9 w-9 rounded-full shadow-sm"
											onclick={() => handleEdit(item, item.type)}
										>
											<Edit size={16} />
										</Button>
										<Button
											variant="secondary"
											size="icon"
											class="text-destructive hover:bg-destructive h-9 w-9 rounded-full shadow-sm hover:text-white"
											onclick={() => confirmDelete(item.id, item.type)}
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				{/if}
			{:else if activeTab === 'invoices'}
				<div class="grid gap-4">
					{#each filteredInvoices as invoice (invoice.id)}
						<Card
							class="hover:bg-muted/40 group overflow-hidden border-none ring-1 shadow-md ring-black/[0.05] transition-all duration-300 dark:ring-white/[0.05]"
						>
							<CardContent class="flex items-center justify-between p-5">
								<div class="flex items-center gap-5">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-inner dark:bg-blue-900/40 dark:text-blue-400"
									>
										<FileText size={22} />
									</div>
									<div class="grid gap-0.5">
										<div class="text-lg font-semibold tracking-tight">
											{invoice.title || invoice.number || m.dashboard_draft()}
										</div>
										<div
											class="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase"
										>
											<span class="bg-muted text-foreground rounded px-2 py-0.5"
												>{new Date(invoice.date).toLocaleDateString('de-DE')}</span
											>
											<span class="opacity-30">•</span>
											<span class="font-medium">{invoice.customer.name}</span>
										</div>
									</div>
								</div>
								<div class="flex items-center gap-8">
									<div class="flex items-center gap-4">
										<span
											class="text-muted-foreground hidden text-[10px] font-semibold tracking-widest uppercase opacity-40 sm:inline"
											>Bezahlt</span
										>
										<Switch
											checked={invoice.isPaid}
											onCheckedChange={() => togglePaidStatus(invoice)}
										/>
									</div>
									<div class="min-w-[120px] text-right text-xl font-semibold tracking-tighter">
										{formatCurrency(calculateTotal(invoice))}
									</div>
									<div
										class="flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100"
									>
										<Button
											variant="secondary"
											size="icon"
											class="hover:bg-primary hover:text-primary-foreground h-9 w-9 rounded-full shadow-sm"
											onclick={() => handleEdit(invoice, 'invoice')}><Edit size={16} /></Button
										>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{:else if activeTab === 'expenses'}
				<div class="grid gap-4">
					{#each filteredExpenses as expense (expense.id)}
						<Card
							class="hover:bg-muted/40 group overflow-hidden border-none ring-1 shadow-md ring-black/[0.05] transition-all duration-300 dark:ring-white/[0.05]"
						>
							<CardContent class="flex items-center justify-between p-5">
								<div class="flex items-center gap-5">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-inner dark:bg-rose-900/40 dark:text-rose-400"
									>
										<Receipt size={22} />
									</div>
									<div class="grid gap-0.5">
										<div class="text-lg font-semibold tracking-tight">{expense.description}</div>
										<div
											class="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase"
										>
											<span class="bg-muted text-foreground rounded px-2 py-0.5"
												>{new Date(expense.date).toLocaleDateString('de-DE')}</span
											>
											<span class="opacity-30">•</span>
											<span class="font-medium">{expense.category}</span>
										</div>
									</div>
								</div>
								<div class="flex items-center gap-8">
									<div
										class="min-w-[120px] text-right text-xl font-semibold tracking-tighter text-rose-600 dark:text-rose-400"
									>
										-{formatCurrency(expense.amount)}
									</div>
									<div
										class="flex gap-1 opacity-0 transition-all duration-300 group-hover:opacity-100"
									>
										<Button
											variant="secondary"
											size="icon"
											class="hover:bg-primary hover:text-primary-foreground h-9 w-9 rounded-full shadow-sm"
											onclick={() => goto('/expenses')}><Edit size={16} /></Button
										>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
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
