<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Download } from 'lucide-svelte';
	import { generateExportZip } from '$lib/utils/export-zip';
	import { cn } from '$lib/utils';

	let {
		year,
		variant = 'outline',
		class: className = '',
		children
	} = $props<{
		year: number;
		variant?: 'outline' | 'default' | 'secondary' | 'ghost' | 'link' | 'destructive';
		class?: string;
		children?: import('svelte').Snippet;
	}>();

	let isExporting = $state(false);
	let exportMessage = $state('');

	async function handleExport() {
		isExporting = true;
		try {
			await generateExportZip(year, (msg) => (exportMessage = msg));
		} catch (e) {
			console.error('Export failed:', e);
			alert('Export fehlgeschlagen.');
		} finally {
			isExporting = false;
			exportMessage = '';
		}
	}
</script>

<Button onclick={handleExport} {variant} class={cn('shadow-sm', className)} disabled={isExporting}>
	{#if isExporting}
		<span
			class="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
		></span>
		{exportMessage || 'Exportiere...'}
	{:else if children}
		{@render children()}
	{:else}
		<Download class="mr-2" size={18} />
		GoBD Export (ZIP)
	{/if}
</Button>
