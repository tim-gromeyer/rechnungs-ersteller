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
		allExpenses.filter((e) => new Date(e.date).getFullYear() === Number(selectedYear))
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
		category: '',
		receiptIds: []
	});
	let selectedFiles = $state<File[]>([]);
	let isUploading = $state(false);

	let deleteDialogOpen = $state(false);
	let expenseToDelete = $state<string | null>(null);

	let receiptsToDelete = $state<string[]>([]); // List of receipt IDs to delete during edit

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
		const data = await db.getAllExpenses();
		allExpenses = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	// Reaktiv die Belege laden, wenn sich die gefilterten Ausgaben ändern
	$effect(() => {
		expenses.forEach(async (expense) => {
			if (expense.receiptIds) {
				for (const rid of expense.receiptIds) {
					if (!receiptsMap[rid]) {
						const receipt = await db.getReceipt(rid);
						if (receipt) {
							receiptsMap[rid] = receipt;
							await getDisplayUrl(receipt);
						}
					}
				}
			}
		});
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFiles = [...selectedFiles, ...Array.from(target.files)];
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			selectedFiles = [...selectedFiles, ...Array.from(event.dataTransfer.files)];
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
		selectedFiles = [];
		receiptsToDelete = [];
		expenseState.resetValidation();
		isAddDialogOpen = true;
	}

	function removeExistingReceipt(receiptId: string) {
		receiptsToDelete = [...receiptsToDelete, receiptId];
	}

	function removeSelectedFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	async function handleSaveExpense() {
		if (!expenseState.validateExpense(newExpense)) {
			return;
		}

		isUploading = true;
		try {
			let currentReceiptIds = [...(newExpense.receiptIds || [])];

			// Handle removal of existing receipts marked for deletion
			if (isEditing && receiptsToDelete.length > 0) {
				for (const id of receiptsToDelete) {
					await db.deleteReceipt(id);
					currentReceiptIds = currentReceiptIds.filter((rid) => rid !== id);
				}
			}

			// Handle new files
			if (selectedFiles.length > 0) {
				for (const file of selectedFiles) {
					const receiptId = crypto.randomUUID();
					let fileData: Blob;
					let fileType = file.type;

					if (file.type.startsWith('image/')) {
						fileData = await compressImageToBlob(file);
						fileType = 'image/jpeg';
					} else {
						fileData = file;
					}

					const compressedData = await gzipBlob(fileData);
					const receipt: Receipt = {
						id: receiptId,
						fileName: file.name,
						fileType: fileType,
						fileData: compressedData
					};
					await db.saveReceipt(receipt);
					currentReceiptIds.push(receiptId);

					// Update local map and create URL for preview
					receiptsMap[receiptId] = receipt;
					await getDisplayUrl(receipt);
				}
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

					return new Date(selectedDate).toISOString();
				})(),
				amount: Number(newExpense.amount),
				description: newExpense.description!,
				category: newExpense.category!,
				receiptIds: currentReceiptIds
			};

			await db.saveExpense(expense);
			await loadData();

			// Reset form
			isAddDialogOpen = false;
			isEditing = false;
			receiptsToDelete = [];
			newExpense = {
				date: new Date().toISOString().split('T')[0],
				amount: 0,
				description: '',
				category: '',
				receiptIds: []
			};
			selectedFiles = [];
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
			const expense = allExpenses.find((e) => e.id === expenseToDelete);
			if (expense?.receiptIds) {
				for (const id of expense.receiptIds) {
					await db.deleteReceipt(id);
				}
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
									<div class="flex flex-wrap gap-2">
										{#if expense.receiptIds && expense.receiptIds.length > 0}
											{#each expense.receiptIds as rid (rid)}
												{#if receiptsMap[rid]}
													{#if receiptsMap[rid].fileType.startsWith('image/')}
														<button
															onclick={() => openPreview(receiptsMap[rid])}
															class="flex items-center text-blue-500 transition-opacity hover:opacity-80"
															title={receiptsMap[rid].fileName}
														>
															<img
																src={objectUrls[rid] || receiptsMap[rid].dataUrl}
																alt="Receipt"
																class="h-10 w-10 rounded border object-cover shadow-sm"
															/>
														</button>
													{:else}
														<button
															onclick={() => openPreview(receiptsMap[rid])}
															class="flex items-center gap-1 text-blue-500 hover:underline"
															title={receiptsMap[rid].fileName}
														>
															<FileText size={20} />
														</button>
													{/if}
												{/if}
											{/each}
										{:else}
											<span class="text-muted-foreground text-sm">-</span>
										{/if}
									</div>
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
				<Label>Belege (Drag & Drop)</Label>
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
						multiple
						class="hidden"
						onchange={handleFileSelect}
					/>
					<ImageIcon size={32} class="mb-2 opacity-50" />
					<p class="text-sm">Klicke oder ziehe Dateien hierher</p>
					<p class="mt-1 text-xs">PNG, JPG oder PDF (Max. empfohlen: 5MB)</p>
				</div>

				<!-- List of already uploaded and newly selected files -->
				<div class="mt-4 space-y-2">
					<!-- Existing files -->
					{#if isEditing && newExpense.receiptIds}
						{#each newExpense.receiptIds as rid (rid)}
							{#if !receiptsToDelete.includes(rid) && receiptsMap[rid]}
								<div class="bg-muted/30 flex items-center justify-between rounded-md p-2 text-sm">
									<div class="flex items-center gap-2 truncate">
										{#if receiptsMap[rid].fileType.startsWith('image/')}
											<ImageIcon size={16} class="shrink-0" />
										{:else}
											<FileText size={16} class="shrink-0" />
										{/if}
										<span class="truncate">{receiptsMap[rid].fileName}</span>
									</div>
									<Button
										variant="ghost"
										size="icon"
										class="text-destructive h-8 w-8"
										onclick={(e) => {
											e.stopPropagation();
											removeExistingReceipt(rid);
										}}
									>
										<Trash2 size={14} />
									</Button>
								</div>
							{/if}
						{/each}
					{/if}

					<!-- Newly selected files -->
					{#each selectedFiles as file, index (index)}
						<div
							class="flex items-center justify-between rounded-md bg-blue-50 p-2 text-sm dark:bg-blue-900/20"
						>
							<div class="flex items-center gap-2 truncate">
								{#if file.type.startsWith('image/')}
									<ImageIcon size={16} class="shrink-0" />
								{:else}
									<FileText size={16} class="shrink-0" />
								{/if}
								<span class="truncate">{file.name}</span>
								<span class="text-muted-foreground text-xs">
									({(file.size / 1024 / 1024).toFixed(2)} MB)
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon"
								class="text-destructive h-8 w-8"
								onclick={(e) => {
									e.stopPropagation();
									removeSelectedFile(index);
								}}
							>
								<Trash2 size={14} />
							</Button>
						</div>
					{/each}
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
