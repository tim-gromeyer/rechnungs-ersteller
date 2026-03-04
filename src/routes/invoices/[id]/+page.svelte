<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import InvoiceForm from '../../components/InvoiceForm.svelte';
	import InvoicePreview from '../../components/InvoicePreview.svelte';
	import StatePersistence from '../../components/StatePersistence.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import { generateZugferdXml } from '$lib/utils/zugferd';
	import { Printer, Download, ArrowLeft } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { db } from '$lib/db';
	import { goto } from '$app/navigation';
	import * as Button from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	let id = $derived($page.params.id);
	let loading = $state(true);

	onMount(async () => {
		if (id) {
			const invoice = await db.getInvoice(id);
			if (invoice) {
				// Merge with default to ensure structure
				// We need to be careful here. If we just assign, we might lose reactivity if not handled correctly in state.svelte
				// But invoiceState.invoice is a setter.
				invoiceState.invoice = invoice;
			} else {
				// Invoice not found, maybe redirect to dashboard?
				// For now, let's just load default but maybe warn?
				// Or redirect to dashboard
				console.warn('Invoice not found, redirecting to dashboard');
				goto('/dashboard');
			}
		}
		loading = false;
	});

	function handlePrint() {
		window.print();
	}

	function handleDownloadXml() {
		const xml = generateZugferdXml(invoiceState.invoice);
		const blob = new Blob([xml], { type: 'application/xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `invoice-${invoiceState.invoice.number}.xml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

{#if loading}
	<div class="flex h-screen items-center justify-center">
		<div
			class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
		></div>
	</div>
{:else}
	<StatePersistence>
		<div class="bg-background flex min-h-screen flex-col">
			<!-- Editor Header -->
			<header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md print:hidden">
				<div class="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 md:px-8">
					<div class="flex items-center gap-4">
						<Button.Root variant="ghost" size="icon" href="/dashboard" class="shrink-0">
							<ArrowLeft size={24} />
						</Button.Root>
						<h1 class="hidden text-xl font-bold tracking-tight sm:block">
							{id === 'new' ? 'Neue Rechnung' : `Rechnung bearbeiten`}
						</h1>
					</div>

					<div class="flex items-center gap-2">
						<button
							onclick={handleDownloadXml}
							class={cn(
								'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all active:scale-95'
							)}
						>
							<Download size={16} />
							<span class="hidden md:inline">{m.preview_downloadXml()}</span>
						</button>
						<button
							onclick={handlePrint}
							class={cn(
								'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-md transition-all active:scale-95'
							)}
						>
							<Printer size={16} />
							<span>{m.preview_savePdf()}</span>
						</button>
					</div>
				</div>
			</header>

			<!-- Main Content -->
			<main
				class="mx-auto flex w-full max-w-[1800px] flex-grow flex-col items-start gap-8 p-4 md:p-8 lg:flex-row"
			>
				<!-- Editor Column -->
				<div class="w-full lg:w-1/2 xl:w-5/12 print:hidden">
					<InvoiceForm />
				</div>

				<!-- Preview Column -->
				<div
					class="sticky top-24 max-h-[calc(100vh-8rem)] w-full overflow-auto lg:w-1/2 xl:w-7/12 print:static print:max-h-none print:w-full"
				>
					<div
						class="bg-muted/30 min-w-full rounded-xl p-4 backdrop-blur-sm print:bg-white print:p-0"
					>
						<div class="mx-auto w-[210mm] max-w-full lg:max-w-none">
							<InvoicePreview />
						</div>
					</div>
				</div>
			</main>
		</div>
	</StatePersistence>
{/if}

<style>
	@media print {
		@page {
			margin: 0;
			size: A4 portrait;
		}

		:global(body) {
			background-color: white !important;
			margin: 0 !important;
			padding: 0 !important;
		}

		:global(html) {
			background-color: white !important;
		}
	}
</style>
