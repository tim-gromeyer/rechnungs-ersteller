<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/db';
	import { expenseState } from '$lib/state.svelte';
	import type { Expense, Receipt } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Table from '$lib/components/ui/table';
	import { ArrowLeft, Plus, FileText, Image as ImageIcon, Trash2, Edit } from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { compressImageToBlob, gzipBlob, ungzipBlob } from '$lib/utils/image';
	import ConfirmDialog from '../components/ConfirmDialog.svelte';
	import ExportButton from '../components/ExportButton.svelte';

	let allExpenses = $state<Expense[]>([]);
	let selectedYear = $state<number>(new Date().getFullYear());

	let expenses = $derived(
		allExpenses.filter((e) => new Date(e.date).getFullYear() === selectedYear)
	);

	let availableYears = $derived.by(() => {
		const years = new SvelteSet<number>();
		years.add(new Date().getFullYear());
		allExpenses.forEach((e) => years.add(new Date(e.date).getFullYear()));
		return Array.from(years).sort((a, b) => b - a);
	});
	let receiptsMap = $state<Record<string, Receipt>>({});
	let objectUrls = $state<Record<string, string>>({});

	let isAddDialogOpen = $state(false);
	let isEditing = $state(false);
	let newExpense = $state<Partial<Expense>>({
		date: new Date().toISOString().split('T')[0],
		amount: 0,
		description: '',
		category: ''
	});
	let selectedFile = $state<File | null>(null);
	let isUploading = $state(false);

	let deleteDialogOpen = $state(false);
	let expenseToDelete = $state<string | null>(null);

	let receiptToDelete = $state<boolean>(false); // Flag if the existing receipt should be deleted during edit

	let previewDialogOpen = $state(false);
	let previewReceipt = $state<Receipt | null>(null);

	onMount(() => {
		loadData();
		return () => {
			// Cleanup object URLs on unmount
			Object.values(objectUrls).forEach(URL.revokeObjectURL);
		};
	});

	async function getDisplayUrl(receipt: Receipt): Promise<string> {
		if (receipt.id in objectUrls) return objectUrls[receipt.id];

		if (receipt.fileData) {
			try {
				const decompressed = await ungzipBlob(receipt.fileData);
				const url = URL.createObjectURL(decompressed);
				objectUrls[receipt.id] = url;
				return url;
			} catch (e) {
				console.error('Error decompressing receipt:', e);
			}
		}
		return receipt.dataUrl || '';
	}

	async function loadData() {
		allExpenses = await db.getAllExpenses();
		allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		// Load receipts in parallel
		const receipts: Record<string, Receipt> = {};
		await Promise.all(
			expenses.map(async (expense) => {
				if (expense.receiptId) {
					const receipt = await db.getReceipt(expense.receiptId);
					if (receipt) {
						receipts[expense.receiptId] = receipt;
						await getDisplayUrl(receipt);
					}
				}
			})
		);
		receiptsMap = receipts;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			selectedFile = event.dataTransfer.files[0];
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function openPreview(receipt: Receipt) {
		previewReceipt = receipt;
		previewDialogOpen = true;
	}

	function editExpense(expense: Expense) {
		newExpense = { ...expense };
		isEditing = true;
		selectedFile = null;
		receiptToDelete = false;
		expenseState.resetValidation();
		isAddDialogOpen = true;
	}

	function removeCurrentReceipt() {
		receiptToDelete = true;
		selectedFile = null;
	}

	async function handleSaveExpense() {
		if (!expenseState.validateExpense(newExpense)) {
			return;
		}

		isUploading = true;
		try {
			let receiptId = newExpense.receiptId;

			// Handle removal of existing receipt
			if (isEditing && receiptToDelete && receiptId) {
				await db.deleteReceipt(receiptId);
				receiptId = undefined;
			}

			if (selectedFile) {
				// Delete old receipt if replacing during edit (if not already handled by receiptToDelete)
				if (isEditing && receiptId && !receiptToDelete) {
					await db.deleteReceipt(receiptId);
				}

				receiptId = crypto.randomUUID();
				let fileData: Blob;
				let fileType = selectedFile.type;

				if (selectedFile.type.startsWith('image/')) {
					fileData = await compressImageToBlob(selectedFile);
					fileType = 'image/jpeg'; // compressImageToBlob uses image/jpeg
				} else {
					fileData = selectedFile;
				}

				// Apply Gzip compression
				const compressedData = await gzipBlob(fileData);

				const receipt: Receipt = {
					id: receiptId,
					fileName: selectedFile.name,
					fileType: fileType,
					fileData: compressedData
				};
				await db.saveReceipt(receipt);

				// Update local map and create URL for preview
				receiptsMap[receiptId] = receipt;
				await getDisplayUrl(receipt);
			}

			const expense: Expense = {
				id: isEditing && newExpense.id ? newExpense.id : crypto.randomUUID(),
				date: (() => {
					const now = new Date();
					const selectedDate = newExpense.date!; // YYYY-MM-DD
					const todayStr = now.toISOString().split('T')[0];

					if (selectedDate === todayStr && !isEditing) {
						return now.toISOString();
					}

					// If editing and same day, keep old time if possible (not trivial here without full existing object)
					// For simplicity: if today, use full iso. If not today, use start of day.
					return new Date(selectedDate).toISOString();
				})(),
				amount: Number(newExpense.amount),
				description: newExpense.description!,
				category: newExpense.category!,
				receiptId
			};

			await db.saveExpense(expense);
			await loadData();

			// Reset form
			isAddDialogOpen = false;
			isEditing = false;
			receiptToDelete = false;
			newExpense = {
				date: new Date().toISOString().split('T')[0],
				amount: 0,
				description: '',
				category: ''
			};
			selectedFile = null;
		} catch (error) {
			console.error('Fehler beim Speichern der Ausgabe:', error);
			alert('Fehler beim Speichern der Ausgabe.');
		} finally {
			isUploading = false;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
	}

	function confirmDelete(id: string) {
		expenseToDelete = id;
		deleteDialogOpen = true;
	}

	async function handleDelete() {
		if (expenseToDelete) {
			const expense = expenses.find((e) => e.id === expenseToDelete);
			if (expense?.receiptId) {
				await db.deleteReceipt(expense.receiptId);
			}
			await db.deleteExpense(expenseToDelete);
			await loadData();
			expenseToDelete = null;
		}
	}
</script>

<div class="container mx-auto max-w-5xl p-8">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" href="/">
				<ArrowLeft size={24} />
			</Button>
			<h1 class="text-3xl font-bold">Ausgaben & Belege</h1>
		</div>
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
			<Button
				onclick={() => {
					isEditing = false;
					newExpense = {
						date: new Date().toISOString().split('T')[0],
						amount: 0,
						description: '',
						category: ''
					};
					expenseState.resetValidation();
					isAddDialogOpen = true;
				}}
				variant="default"
			>
				<Plus size={16} class="mr-2" /> Neue Ausgabe
			</Button>
		</div>
	</div>

	<Card>
		<CardContent class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Datum</Table.Head>
						<Table.Head>Beschreibung</Table.Head>
						<Table.Head>Kategorie</Table.Head>
						<Table.Head>Beleg</Table.Head>
						<Table.Head class="text-right">Betrag</Table.Head>
						<Table.Head class="w-[80px]"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if expenses.length === 0}
						<Table.Row>
							<Table.Cell colspan={6} class="text-muted-foreground py-8 text-center">
								Keine Ausgaben vorhanden.
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each expenses as expense (expense.id)}
							<Table.Row>
								<Table.Cell class="font-medium"
									>{new Date(expense.date).toLocaleDateString('de-DE')}</Table.Cell
								>
								<Table.Cell>{expense.description}</Table.Cell>
								<Table.Cell>{expense.category}</Table.Cell>
								<Table.Cell>
									{#if expense.receiptId && receiptsMap[expense.receiptId]}
										{#if receiptsMap[expense.receiptId].fileType.startsWith('image/')}
											<button
												onclick={() => openPreview(receiptsMap[expense.receiptId!])}
												class="flex items-center text-blue-500 transition-opacity hover:opacity-80"
											>
												<img
													src={objectUrls[expense.receiptId] ||
														receiptsMap[expense.receiptId].dataUrl}
													alt="Receipt"
													class="h-10 w-10 rounded border object-cover shadow-sm"
												/>
											</button>
										{:else}
											<button
												onclick={() => openPreview(receiptsMap[expense.receiptId!])}
												class="flex items-center gap-1 text-blue-500 hover:underline"
											>
												<FileText size={20} />
												<span class="max-w-[100px] truncate text-xs"
													>{receiptsMap[expense.receiptId].fileName}</span
												>
											</button>
										{/if}
									{:else}
										<span class="text-muted-foreground text-sm">-</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right font-medium text-red-600">
									-{formatCurrency(expense.amount)}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex justify-end gap-1">
										<Button
											variant="ghost"
											size="icon"
											class="text-muted-foreground hover:text-foreground"
											onclick={() => editExpense(expense)}
										>
											<Edit size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="text-destructive hover:text-destructive"
											onclick={() => confirmDelete(expense.id)}
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>

<!-- Add Expense Dialog -->
<Dialog.Root bind:open={isAddDialogOpen}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>{isEditing ? 'Ausgabe bearbeiten' : 'Neue Ausgabe erfassen'}</Dialog.Title>
			<Dialog.Description>
				Trage die Details der Ausgabe ein und lade eventuell einen neuen Beleg hoch.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="date">Datum *</Label>
					<Input
						id="date"
						type="date"
						bind:value={newExpense.date}
						class={expenseState.validationErrors?.date ? 'border-destructive' : ''}
					/>
					{#if expenseState.validationErrors?.date}
						<p class="text-destructive text-xs">{expenseState.validationErrors.date._errors[0]}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="amount">Betrag (Brutto) *</Label>
					<Input
						id="amount"
						type="number"
						step="0.01"
						min="0"
						bind:value={newExpense.amount}
						placeholder="0.00"
						class={expenseState.validationErrors?.amount ? 'border-destructive' : ''}
					/>
					{#if expenseState.validationErrors?.amount}
						<p class="text-destructive text-xs">
							{expenseState.validationErrors.amount._errors[0]}
						</p>
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="description">Beschreibung / Verwendungszweck *</Label>
				<Input
					id="description"
					bind:value={newExpense.description}
					placeholder="z.B. Software-Abo, Büromaterial"
					class={expenseState.validationErrors?.description ? 'border-destructive' : ''}
				/>
				{#if expenseState.validationErrors?.description}
					<p class="text-destructive text-xs">
						{expenseState.validationErrors.description._errors[0]}
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="category">Kategorie *</Label>
				<Input
					id="category"
					bind:value={newExpense.category}
					placeholder="z.B. IT-Kosten, Reisekosten"
					class={expenseState.validationErrors?.category ? 'border-destructive' : ''}
				/>
				{#if expenseState.validationErrors?.category}
					<p class="text-destructive text-xs">
						{expenseState.validationErrors.category._errors[0]}
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label>Beleg (Drag & Drop)</Label>
				<div
					role="button"
					tabindex="0"
					class="text-muted-foreground hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
					ondragover={handleDragOver}
					ondrop={handleDrop}
					onclick={() => document.getElementById('file-upload')?.click()}
					onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-upload')?.click()}
				>
					<Input
						id="file-upload"
						type="file"
						accept="image/*,application/pdf"
						class="hidden"
						onchange={handleFileSelect}
					/>
					{#if selectedFile}
						<div class="text-foreground flex items-center gap-2 font-medium">
							{#if selectedFile.type.startsWith('image/')}
								<ImageIcon size={20} />
							{:else}
								<FileText size={20} />
							{/if}
							<span>{selectedFile.name}</span>
						</div>
						<p class="mt-1 text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
					{:else if isEditing && newExpense.receiptId && receiptsMap[newExpense.receiptId] && !receiptToDelete}
						<!-- Show existing file info if editing and there's a file saved and not marked for deletion -->
						<div class="text-foreground flex flex-col items-center gap-4 font-medium">
							<div class="flex items-center gap-2">
								{#if receiptsMap[newExpense.receiptId].fileType.startsWith('image/')}
									<ImageIcon size={20} />
								{:else}
									<FileText size={20} />
								{/if}
								<span>{receiptsMap[newExpense.receiptId].fileName}</span>
							</div>
							<div class="flex gap-2">
								<Button
									variant="secondary"
									size="sm"
									onclick={(e) => {
										e.stopPropagation();
										document.getElementById('file-upload')?.click();
									}}
								>
									Ändern
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onclick={(e) => {
										e.stopPropagation();
										removeCurrentReceipt();
									}}
								>
									Entfernen
								</Button>
							</div>
						</div>
					{:else}
						<ImageIcon size={32} class="mb-2 opacity-50" />
						<p class="text-sm">Klicke oder ziehe eine Datei hierher</p>
						<p class="mt-1 text-xs">PNG, JPG oder PDF (Max. empfohlen: 5MB)</p>
					{/if}
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (isAddDialogOpen = false)} disabled={isUploading}
				>Abbrechen</Button
			>
			<Button onclick={handleSaveExpense} disabled={isUploading}>
				{isUploading ? 'Speichert...' : 'Speichern'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Ausgabe löschen"
	description="Bist du sicher, dass du diese Ausgabe inkl. Beleg löschen möchtest? Dies kann nicht rückgängig gemacht werden."
	onConfirm={handleDelete}
	onCancel={() => (deleteDialogOpen = false)}
/>

<!-- Preview Dialog -->
<Dialog.Root bind:open={previewDialogOpen}>
	<Dialog.Content class="flex flex-col sm:h-[80vh] sm:max-w-[800px]">
		<Dialog.Header>
			<Dialog.Title>{previewReceipt?.fileName}</Dialog.Title>
		</Dialog.Header>
		<div
			class="bg-muted/20 flex min-h-0 flex-grow items-center justify-center overflow-auto rounded-md p-4"
		>
			{#if previewReceipt}
				{#if previewReceipt.fileType.startsWith('image/')}
					<img
						src={objectUrls[previewReceipt.id] || previewReceipt.dataUrl}
						alt="Beleg Vorschau"
						class="max-h-full max-w-full object-contain drop-shadow-md"
					/>
				{:else if previewReceipt.fileType === 'application/pdf'}
					<iframe
						src={objectUrls[previewReceipt.id] || previewReceipt.dataUrl}
						title="Beleg Vorschau PDF"
						class="h-full min-h-[400px] w-full rounded border bg-white"
					></iframe>
				{:else}
					<p class="text-muted-foreground">Vorschau für diesen Dateityp nicht verfügbar.</p>
				{/if}
			{/if}
		</div>
		<Dialog.Footer class="flex flex-wrap gap-2">
			<Button variant="outline" onclick={() => (previewDialogOpen = false)}>Schließen</Button>
			{#if previewReceipt}
				<Button
					variant="secondary"
					onclick={() => {
						const url = objectUrls[previewReceipt!.id] || previewReceipt!.dataUrl;
						if (url) window.open(url, '_blank');
					}}
				>
					<ArrowLeft class="mr-2 rotate-180" size={16} /> In neuem Tab öffnen
				</Button>
				<Button
					onclick={() => {
						const a = document.createElement('a');
						a.href = objectUrls[previewReceipt!.id] || previewReceipt!.dataUrl || '';
						a.download = previewReceipt!.fileName;
						a.click();
					}}
					variant="default">Herunterladen</Button
				>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
