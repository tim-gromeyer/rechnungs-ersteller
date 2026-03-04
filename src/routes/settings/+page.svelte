<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import {
		ArrowLeft,
		Download,
		Upload,
		Server,
		Database,
		Cloud,
		CloudOff,
		RefreshCw,
		LogOut
	} from 'lucide-svelte';
	import { exportDatabase, importDatabase } from '$lib/utils/backup';
	import * as m from '$lib/paraglide/messages';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { db } from '$lib/db';
	import { getStorageEstimate, formatBytes } from '$lib/utils/storage';
	import { onMount } from 'svelte';
	import { Trash2, AlertTriangle } from 'lucide-svelte';
	import { googleDriveSync } from '$lib/utils/googleDrive';
	import { cn } from '$lib/utils';

	let fileInput: HTMLInputElement;
	let isImporting = $state(false);

	let importConfirmOpen = $state(false);
	let pendingImportFile = $state<File | null>(null);

	let deleteConfirmOpen = $state(false);

	let infoDialogOpen = $state(false);
	let infoTitle = $state('');
	let infoDescription = $state('');

	let storageInfo = $state<{ usage: number; quota: number; percentage: number } | null>(null);
	let storeSizes = $state<Record<string, number>>({});

	let isDriveLoggedIn = $state(false);
	let isSyncing = $state(false);
	let lastCloudSync = $state<string | null>(null);

	onMount(async () => {
		await refreshStorageInfo();
		const token = await googleDriveSync.getValidToken();
		isDriveLoggedIn = !!token;
		lastCloudSync = localStorage.getItem('gdrive_last_sync');
	});

	async function refreshStorageInfo() {
		storageInfo = await getStorageEstimate();
		storeSizes = await db.getStoreSizes();
	}

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

	async function handleDeleteAll() {
		try {
			await db.clearAllData();
			await refreshStorageInfo();
			showInfo(m.settings_delete_all_title(), m.settings_delete_all_success());
		} catch (e) {
			console.error('Delete all failed:', e);
			showInfo(m.settings_delete_all_title(), 'Fehler beim Löschen der Daten.');
		} finally {
			deleteConfirmOpen = false;
		}
	}

	async function handleGoogleLogin() {
		try {
			await googleDriveSync.login();
			isDriveLoggedIn = true;
			showInfo('Cloud Sync', 'Erfolgreich mit Google Drive verbunden!');
		} catch (e) {
			console.error('Google login failed:', e);
			showInfo('Cloud Sync', 'Anmeldung fehlgeschlagen.');
		}
	}

	async function handleGoogleLogout() {
		await googleDriveSync.logout();
		isDriveLoggedIn = false;
		showInfo('Cloud Sync', 'Abgemeldet.');
	}

	async function handleCloudSync() {
		isSyncing = true;
		try {
			await googleDriveSync.syncToCloud();
			lastCloudSync = new Date().toISOString();
			showInfo('Cloud Sync', 'Synchronisierung erfolgreich!');
		} catch (e) {
			console.error('Sync failed:', e);
			showInfo('Cloud Sync', 'Fehler bei der Synchronisierung.');
		} finally {
			isSyncing = false;
		}
	}

	async function handleCloudRestore() {
		isSyncing = true;
		try {
			const success = await googleDriveSync.syncFromCloud();
			if (success) {
				showInfo(
					'Cloud Restore',
					'Daten erfolgreich aus der Cloud geladen. Die Seite wird neu geladen.'
				);
				setTimeout(() => window.location.reload(), 1500);
			} else {
				showInfo('Cloud Restore', 'Kein Backup in der Cloud gefunden.');
			}
		} catch (e) {
			console.error('Restore failed:', e);
			showInfo('Cloud Restore', 'Fehler beim Laden der Daten.');
		} finally {
			isSyncing = false;
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
					<Cloud size={20} />
					Cloud-Synchronisierung
				</CardTitle>
				<CardDescription>
					Sichere deine Daten automatisch in deinem Google Drive (AppData).
				</CardDescription>
			</CardHeader>
			<CardContent class="grid gap-6">
				{#if !isDriveLoggedIn}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<CloudOff size={48} class="text-muted-foreground mb-4 opacity-20" />
						<p class="text-muted-foreground mb-6 max-w-xs text-sm">
							Verbinde dein Google-Konto, um Backups in der Cloud zu speichern und zwischen Geräten
							zu synchronisieren.
						</p>
						<Button onclick={handleGoogleLogin} class="bg-[#4285F4] text-white hover:bg-[#357ae8]">
							<Cloud size={18} class="mr-2" />
							Mit Google Drive verbinden
						</Button>
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="flex items-center gap-3">
								<div class="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30">
									<Cloud size={20} />
								</div>
								<div>
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium">Status: Verbunden</span>
										<span
											class="rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase"
											>Google Drive</span
										>
									</div>
									<p class="text-muted-foreground mt-0.5 text-xs">
										{lastCloudSync
											? `Letzter Sync: ${new Date(lastCloudSync).toLocaleString()}`
											: 'Noch nie synchronisiert'}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={handleGoogleLogout}
								class="text-muted-foreground h-8 px-2"
							>
								<LogOut size={14} class="mr-1.5" /> Abmelden
							</Button>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<Button
								onclick={handleCloudSync}
								disabled={isSyncing}
								variant="outline"
								class="w-full"
							>
								<RefreshCw size={16} class={cn('mr-2', isSyncing && 'animate-spin')} />
								Jetzt Sichern
							</Button>
							<Button
								onclick={handleCloudRestore}
								disabled={isSyncing}
								variant="outline"
								class="w-full"
							>
								<Download size={16} class="mr-2" />
								Laden
							</Button>
						</div>
					</div>
				{/if}
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

		<!-- Danger Zone -->
		<Card class="border-destructive/50">
			<CardHeader>
				<CardTitle class="text-destructive flex items-center gap-2">
					<AlertTriangle size={20} />
					{m.settings_danger_zone()}
				</CardTitle>
				<CardDescription>
					{m.settings_delete_all_description()}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="destructive" onclick={() => (deleteConfirmOpen = true)}>
					<Trash2 size={16} class="mr-2" />
					{m.settings_delete_all_title()}
				</Button>
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

<ConfirmDialog
	bind:open={deleteConfirmOpen}
	title={m.settings_delete_all_title()}
	description={m.settings_delete_all_confirm()}
	confirmText={m.common_delete()}
	confirmVariant="destructive"
	onConfirm={handleDeleteAll}
	onCancel={() => (deleteConfirmOpen = false)}
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
