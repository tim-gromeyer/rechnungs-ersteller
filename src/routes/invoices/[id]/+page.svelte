<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import InvoiceForm from '../../components/InvoiceForm.svelte';
	import InvoicePreview from '../../components/InvoicePreview.svelte';
	import StatePersistence from '../../components/StatePersistence.svelte';
	import Navbar from '../../components/Navbar.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import { generateZugferdXml } from '$lib/utils/zugferd';
	import { Printer, Download } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { db } from '$lib/db';
	import { goto } from '$app/navigation';
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
		<div
			class="from-background via-background to-muted/20 flex min-h-screen flex-col bg-gradient-to-br"
		>
			<Navbar>
				<button
					onclick={handlePrint}
					class={cn(
						'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-lg transition-all hover:scale-105 active:scale-95'
					)}
				>
					<Printer size={18} />
					<span class="hidden sm:inline">{m.preview_savePdf()}</span>
				</button>
				<button
					onclick={handleDownloadXml}
					class={cn(
						'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all hover:scale-105 active:scale-95'
					)}
				>
					<Download size={18} />
					<span class="hidden sm:inline">{m.preview_downloadXml()}</span>
				</button>
			</Navbar>

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
					class="sticky top-24 max-h-[calc(100vh-7rem)] w-full overflow-auto lg:w-1/2 xl:w-7/12 print:static print:max-h-none print:w-full"
				>
					<div
						class="bg-muted/30 flex justify-center rounded-xl p-4 backdrop-blur-sm print:bg-white print:p-0"
					>
						<InvoicePreview />
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
