<script lang="ts">
	import { onMount } from 'svelte';
	import InvoiceForm from './components/InvoiceForm.svelte';
	import InvoicePreview from './components/InvoicePreview.svelte';
	import PersistenceWatcher from './components/PersistenceWatcher.svelte';
	import { invoiceState } from '$lib/state.svelte';
	import { generateZugferdXml } from '$lib/utils/zugferd';
	import { Printer, Download, Moon, Sun } from 'lucide-svelte';
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
</script>

<PersistenceWatcher>
	<div
		class="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20"
	>
		<!-- Navbar -->
		<nav
			class="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 print:hidden"
		>
			<div class="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 md:px-8">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/"
					class="flex items-center gap-2 text-xl font-semibold tracking-tight transition-colors hover:text-primary"
				>
					Invoice Creator
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<div class="flex items-center gap-2">
					<button
						onclick={toggleMode}
						class={cn(
							'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground active:scale-95'
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
						onclick={handlePrint}
						class={cn(
							'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95'
						)}
					>
						<Printer size={18} />
						<span class="hidden sm:inline">PDF Speichern</span>
					</button>
					<button
						onclick={handleDownloadXml}
						class={cn(
							'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground active:scale-95'
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
					class="flex justify-center rounded-xl bg-muted/30 p-4 backdrop-blur-sm print:bg-white print:p-0"
				>
					<InvoicePreview />
				</div>
			</div>
		</main>
	</div>
</PersistenceWatcher>

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
			height: auto !important;
			overflow: hidden !important;
		}

		/* Ensure invoice fits on one page */
		:global(.invoice-preview) {
			page-break-after: avoid !important;
			break-after: avoid !important;
			height: auto !important;
			max-height: 297mm !important;
			overflow: hidden !important;
		}
	}
</style>
