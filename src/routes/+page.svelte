<script lang="ts">
	import { onMount } from 'svelte';
	import InvoiceForm from './components/InvoiceForm.svelte';
	import InvoicePreview from './components/InvoicePreview.svelte';
	import StatePersistence from './components/StatePersistence.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import { generateZugferdXml } from '$lib/utils/zugferd';
	import { Printer, Download, Moon, Sun, FileText } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
	import { cn } from '$lib/utils/cn';

	let isDarkMode = $state(false);

	onMount(() => {
		// Check if dark mode is active after mount
		isDarkMode = document.documentElement.classList.contains('dark');

		// Watch for class changes
		const observer = new MutationObserver(() => {
			isDarkMode = document.documentElement.classList.contains('dark');
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		return () => observer.disconnect();
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

	function handleNewInvoice() {
		if (
			confirm(
				'Neue Rechnung erstellen? Die aktuellen Kundendaten und Positionen werden zurückgesetzt.'
			)
		) {
			invoiceState.createNewInvoice();
		}
	}
</script>

<StatePersistence>
	<div
		class="from-background via-background to-muted/20 flex min-h-screen flex-col bg-gradient-to-br"
	>
		<!-- Navbar -->
		<nav
			class="border-border/40 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur-xl print:hidden"
		>
			<div class="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 md:px-8">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/"
					class="hover:text-primary flex items-center gap-2 text-xl font-semibold tracking-tight transition-colors"
				>
					Rechnungs-Ersteller
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<div class="flex items-center gap-2">
					<button
						onclick={toggleMode}
						class={cn(
							'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95'
						)}
						aria-label="Toggle theme"
					>
						{#if isDarkMode}
							<Sun size={20} />
						{:else}
							<Moon size={20} />
						{/if}
					</button>
					<button
						onclick={handleNewInvoice}
						class={cn(
							'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all hover:scale-105 active:scale-95'
						)}
					>
						<FileText size={18} />
						<span class="hidden sm:inline">Neue Rechnung</span>
					</button>
					<button
						onclick={handlePrint}
						class={cn(
							'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium shadow-lg transition-all hover:scale-105 active:scale-95'
						)}
					>
						<Printer size={18} />
						<span class="hidden sm:inline">PDF Speichern</span>
					</button>
					<button
						onclick={handleDownloadXml}
						class={cn(
							'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all hover:scale-105 active:scale-95'
						)}
					>
						<Download size={18} />
						<span class="hidden sm:inline">XML (ZUGFeRD)</span>
					</button>
				</div>
			</div>
		</nav>

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
