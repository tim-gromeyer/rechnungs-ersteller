<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import InvoiceForm from '../../components/InvoiceForm.svelte';
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

	// Multi-threading for Live Review
	let pdfWorker: Worker | null = null;
	let currentPdfUrl: string | null = $state(null);
	let isGenerating = $state(false);
	let pdfError: string | null = $state(null);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Create a stable reference to invoice to trigger reactions
	let invoice = $derived(invoiceState.invoice);

	onMount(async () => {
		if (id) {
			if (id === 'new') {
				invoiceState.createNewInvoice();
				loading = false;
				return;
			}
			const loadedInvoice = await db.getInvoice(id);
			if (loadedInvoice) {
				invoiceState.invoice = loadedInvoice;
			} else {
				console.warn('Invoice not found, redirecting to dashboard');
				goto('/dashboard');
				return;
			}
		}

		// Initialize the worker correctly for Vite
		const PdfWorkerDef = await import('$lib/workers/pdf.worker.ts?worker');
		pdfWorker = new PdfWorkerDef.default();

		pdfWorker.onmessage = (e) => {
			console.log('[Svelte Page] Received message from worker:', Object.keys(e.data));
			isGenerating = false;
			if (e.data.success) {
				console.log('[Svelte Page] Generating blob URL from PDF buffer...');
				pdfError = null;
				if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);

				const blob = new Blob([e.data.pdfBuffer], { type: 'application/pdf' });
				currentPdfUrl = URL.createObjectURL(blob);
				console.log('[Svelte Page] Updated currentPdfUrl:', currentPdfUrl);
			} else {
				console.error('[Svelte Page] PDF Generation failed based on worker:', e.data.error);
				pdfError = e.data.error || 'Unknown error occurred during PDF generation.';
			}
		};

		loading = false;
	});

	onDestroy(() => {
		if (pdfWorker) pdfWorker.terminate();
		if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
		if (debounceTimer) clearTimeout(debounceTimer);
	});

	// Trigger PDF regeneration whenever invoice changes
	$effect(() => {
		// Create a deep dependency by accessing the state
		const data = invoiceState.invoice;
		// stringify is a reliable deep tracking method for reactive objects
		void JSON.stringify(data);

		if (!loading && pdfWorker) {
			isGenerating = true;
			if (debounceTimer) clearTimeout(debounceTimer);

			debounceTimer = setTimeout(() => {
				requestPdfGeneration(data, true);
			}, 400); // 400ms debounce
		}
	});

	function requestPdfGeneration(invoiceData: any, previewOnly: boolean = false) {
		if (!pdfWorker) return;

		isGenerating = true;

		const translations = {
			title: m.invoice_title(),
			subtotal: m.invoice_subtotal(),
			discount: m.invoice_discount(),
			net: m.invoice_net(),
			plusVat: m.invoice_plusVat({ rate: invoiceData.settings.vatRate }),
			gross: m.invoice_gross(),
			description: m.invoice_description(),
			price: m.invoice_price(),
			quantity: m.invoice_quantity(),
			amount: m.invoice_amount(),
			taxId: m.invoice_taxId(),
			date: m.invoice_date(),
			number: m.invoice_number(),
			serviceDate: m.invoice_serviceDate(),
			bank: m.invoice_bank(),
			iban: m.invoice_iban(),
			bic: m.invoice_bic(),
			phone: m.form_phone ? m.form_phone() : 'Phone',
			email: m.form_email ? m.form_email() : 'Email',
			website: m.form_website ? m.form_website() : 'Website'
		};

		pdfWorker.postMessage({
			invoice: $state.snapshot(invoiceData),
			translations,
			previewOnly
		});
	}

	async function handleSavePdf() {
		isGenerating = true;

		// Create a specific one-time message handler or just use a promise
		// For simplicity, we'll just request a non-preview and wait for the generic handler
		// But to make it perfect, we can wrap it in a promise
		const fullPdfBlob = await new Promise<Blob>((resolve, reject) => {
			if (!pdfWorker) return reject('No worker');

			const handler = (e: MessageEvent) => {
				if (!e.data.previewOnly) {
					pdfWorker?.removeEventListener('message', handler);
					if (e.data.success) {
						resolve(new Blob([e.data.pdfBuffer], { type: 'application/pdf' }));
					} else {
						reject(e.data.error);
					}
				}
			};
			pdfWorker.addEventListener('message', handler);
			requestPdfGeneration(invoiceState.invoice, false);
		});

		const url = URL.createObjectURL(fullPdfBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Rechnung-${invoice.number}.pdf`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		isGenerating = false;
	}

	function handleDownloadXml() {
		const xml = generateZugferdXml(invoice);
		const blob = new Blob([xml], { type: 'application/xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `invoice-${invoice.number}.xml`;
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
			<header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
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
						{#if isGenerating}
							<div class="mr-2 flex items-center gap-2 text-sm text-gray-400">
								<div
									class="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
								></div>
								Preview updating...
							</div>
						{/if}
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
							onclick={handleSavePdf}
							disabled={!currentPdfUrl}
							class={cn(
								'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-md transition-all active:scale-95 disabled:opacity-50'
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
				<div class="w-full lg:w-1/2 xl:w-5/12">
					<InvoiceForm />
				</div>

				<!-- Preview Column (Live PDF Review) -->
				<div
					class="border-border bg-muted/30 sticky top-24 flex h-[calc(100vh-8rem)] w-full flex-col overflow-hidden rounded-xl border shadow-sm lg:w-1/2 xl:w-7/12"
				>
					<div class="bg-muted border-border flex items-center justify-between border-b px-4 py-2">
						<span class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							Live Review (PDF)
						</span>
					</div>

					<div class="relative h-full w-full flex-grow bg-white">
						{#if pdfError}
							<div
								class="text-destructive flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center"
							>
								<div class="bg-destructive/10 rounded-full p-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="lucide lucide-alert-triangle"
										><path
											d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
										/><path d="M12 9v4" /><path d="M12 17h.01" /></svg
									>
								</div>
								<div>
									<h3 class="mb-2 text-lg font-bold">PDF Generation Failed</h3>
									<p class="text-sm opacity-80">{pdfError}</p>
								</div>
							</div>
						{:else if currentPdfUrl}
							<iframe
								title="PDF Live Preview"
								src={currentPdfUrl}
								class="absolute inset-0 h-full w-full border-0"
							></iframe>
						{:else}
							<div
								class="flex h-full w-full flex-col items-center justify-center gap-4 text-gray-400"
							>
								<div
									class="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
								></div>
								<p>Generating high quality PDF...</p>
							</div>
						{/if}
					</div>
				</div>
			</main>
		</div>
	</StatePersistence>
{/if}
