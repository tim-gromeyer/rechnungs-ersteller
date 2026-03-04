<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { ArrowLeft, Download, Upload, Server, Database } from 'lucide-svelte';
	import { exportDatabase, importDatabase } from '$lib/utils/backup';
	import * as m from '$lib/paraglide/messages';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/db';
	import { getStorageEstimate, formatBytes } from '$lib/utils/storage';
	import { onMount } from 'svelte';

	let fileInput: HTMLInputElement;
	let isImporting = $state(false);

	let importConfirmOpen = $state(false);
	let pendingImportFile = $state<File | null>(null);

	let infoDialogOpen = $state(false);
	let infoTitle = $state('');
	let infoDescription = $state('');

	let storageInfo = $state<{ usage: number; quota: number; percentage: number } | null>(null);
	let storeSizes = $state<Record<string, number>>({});

	onMount(async () => {
		storageInfo = await getStorageEstimate();
		storeSizes = await db.getStoreSizes();
	});

	function showInfo(title: string, description: string) {
		infoTitle = title;
		infoDescription = description;
		infoDialogOpen = true;
	}

	async function handleExport() {
		try {
			await exportDatabase();
			showInfo(m.settings_backup_title(), m.settings_backup_success());
		} catch (e) {
			console.error('Export failed:', e);
			showInfo(m.settings_backup_title(), m.settings_backup_error());
		}
	}

	function triggerImport(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		pendingImportFile = target.files[0];
		importConfirmOpen = true;
		target.value = ''; // Reset input to allow same file import again
	}

	async function executeImport() {
		if (!pendingImportFile) return;

		isImporting = true;
		try {
			await importDatabase(pendingImportFile);
			// For success, maybe we don't even need a dialog if it reloads,
			// but let's show it before reloading or just reload if it's crucial.
			// The user said they wanted a way to know it was successful.
			showInfo(m.settings_import_title(), m.settings_import_success());
			setTimeout(() => window.location.reload(), 1500);
		} catch (e) {
			console.error('Import failed:', e);
			showInfo(m.settings_import_title(), m.settings_import_error());
		} finally {
			isImporting = false;
			pendingImportFile = null;
		}
	}
</script>

<div class="container mx-auto max-w-3xl p-8">
	<div class="mb-8 flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/">
			<ArrowLeft size={24} />
		</Button>
		<h1 class="text-3xl font-bold">{m.form_general()}</h1>
	</div>

	<div class="grid gap-6">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Server size={20} />
					{m.settings_data_management()}
				</CardTitle>
				<CardDescription>
					{m.settings_data_management_description()}
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-6">
				<div
					class="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h3 class="font-medium">{m.settings_backup_title()}</h3>
						<p class="text-muted-foreground text-sm">{m.settings_backup_description()}</p>
					</div>
					<Button onclick={handleExport} class="w-full md:w-auto">
						<Download size={16} class="mr-2" />
						{m.common_export()}
					</Button>
				</div>

				<div
					class="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
				>
					<div>
						<h3 class="font-medium">{m.settings_import_title()}</h3>
						<p class="text-muted-foreground text-sm">
							{m.settings_import_description()}
						</p>
					</div>
					<div>
						<input
							type="file"
							accept=".json"
							class="hidden"
							bind:this={fileInput}
							onchange={triggerImport}
						/>
						<Button
							variant="outline"
							onclick={() => fileInput.click()}
							disabled={isImporting}
							class="w-full md:w-auto"
						>
							<Upload size={16} class="mr-2" />
							{isImporting ? m.common_importing() : m.common_import()}
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Database size={20} />
					{m.settings_storage_title()}
				</CardTitle>
				<CardDescription>
					{m.settings_storage_description()}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if storageInfo}
					<div class="space-y-4">
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span
									>{m.settings_storage_used({
										used: formatBytes(storageInfo.usage),
										total: formatBytes(storageInfo.quota)
									})}</span
								>
								<span>{storageInfo.percentage.toFixed(1)}%</span>
							</div>
							<div class="bg-secondary h-2 overflow-hidden rounded-full">
								<div
									class="bg-primary h-full transition-all duration-500"
									style="width: {storageInfo.percentage}%"
								></div>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<div class="flex items-center justify-between rounded-md border p-2 text-xs">
								<span class="text-muted-foreground">{m.settings_storage_invoices()}</span>
								<span class="font-medium">{formatBytes(storeSizes['invoices'] || 0)}</span>
							</div>
							<div class="flex items-center justify-between rounded-md border p-2 text-xs">
								<span class="text-muted-foreground">{m.settings_storage_expenses()}</span>
								<span class="font-medium">{formatBytes(storeSizes['expenses'] || 0)}</span>
							</div>
							<div
								class="flex items-center justify-between rounded-md border p-2 text-xs sm:col-span-2"
							>
								<span class="text-muted-foreground">{m.settings_storage_receipts()}</span>
								<span class="font-medium">{formatBytes(storeSizes['receipts'] || 0)}</span>
							</div>
							<div class="flex items-center justify-between rounded-md border p-2 text-xs">
								<span class="text-muted-foreground">{m.settings_storage_overhead()}</span>
								<span class="font-medium">
									{formatBytes(
										Math.max(
											0,
											storageInfo.usage - Object.values(storeSizes).reduce((a, b) => a + b, 0)
										)
									)}
								</span>
							</div>
						</div>
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">Abfrage des Speicherstatus nicht möglich.</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<ConfirmDialog
	bind:open={importConfirmOpen}
	title={m.settings_import_title()}
	description={m.settings_import_confirm()}
	confirmText={m.common_import()}
	confirmVariant="default"
	onConfirm={executeImport}
	onCancel={() => (importConfirmOpen = false)}
/>

<Dialog.Root bind:open={infoDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{infoTitle}</Dialog.Title>
			<Dialog.Description>{infoDescription}</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button onclick={() => (infoDialogOpen = false)}>OK</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
