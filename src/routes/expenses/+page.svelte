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

<div class="container mx-auto max-w-6xl p-4 sm:p-8">
	<div class="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-5">
			<Button variant="outline" size="icon" href="/" class="shrink-0 rounded-full shadow-sm">
				<ArrowLeft size={20} />
			</Button>
			<div>
				<h1 class="text-4xl font-extrabold tracking-tight">Ausgaben & Belege</h1>
				<p class="text-muted-foreground mt-1 text-sm font-medium">
					Verwalte deine Geschäftsausgaben und Belege GoBD-konform
				</p>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div
				class="bg-card border-input flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm"
			>
				<span class="text-muted-foreground text-[10px] font-bold tracking-widest uppercase"
					>Jahr</span
				>
				<select bind:value={selectedYear} class="bg-transparent text-sm font-semibold outline-none">
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
				class="h-10 px-5 font-semibold shadow-md active:scale-95"
			>
				<Plus size={18} class="mr-2" /> Neue Ausgabe
			</Button>
		</div>
	</div>

	<Card
		class="overflow-hidden border-none ring-1 shadow-xl ring-black/[0.05] dark:ring-white/[0.05]"
	>
		<CardContent class="p-0">
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header class="bg-muted/50">
						<Table.Row class="hover:bg-transparent">
							<Table.Head
								class="text-muted-foreground w-[120px] pl-6 text-[10px] font-medium tracking-widest uppercase"
								>Datum</Table.Head
							>
							<Table.Head
								class="text-muted-foreground text-[10px] font-medium tracking-widest uppercase"
								>Beschreibung</Table.Head
							>
							<Table.Head
								class="text-muted-foreground text-[10px] font-medium tracking-widest uppercase"
								>Kategorie</Table.Head
							>
							<Table.Head
								class="text-muted-foreground text-[10px] font-medium tracking-widest uppercase"
								>Belege</Table.Head
							>
							<Table.Head
								class="text-muted-foreground pr-6 text-right text-[10px] font-medium tracking-widest uppercase"
								>Betrag</Table.Head
							>
							<Table.Head class="w-[100px]"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#if expenses.length === 0}
							<Table.Row>
								<Table.Cell colspan={6} class="py-24 text-center">
									<div class="flex flex-col items-center gap-3 opacity-30">
										<FileText size={48} />
										<p class="text-lg font-medium tracking-tight">
											Keine Ausgaben im Jahr {selectedYear} gefunden.
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{:else}
							{#each expenses as expense (expense.id)}
								<Table.Row
									class="hover:bg-muted/50 group border-b transition-all duration-200 last:border-0"
								>
									<Table.Cell class="text-muted-foreground pl-6 font-medium">
										<div class="flex flex-col">
											<span class="text-foreground"
												>{new Date(expense.date).toLocaleDateString('de-DE', {
													day: '2-digit',
													month: '2-digit',
													year: 'numeric'
												})}</span
											>
											<span
												class="text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
											>
												{new Date(expense.date).toLocaleDateString('de-DE', { weekday: 'short' })}
											</span>
										</div>
									</Table.Cell>
									<Table.Cell class="max-w-[300px]">
										<div class="text-foreground truncate font-medium tracking-tight">
											{expense.description}
										</div>
									</Table.Cell>
									<Table.Cell>
										<span
											class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20"
										>
											{expense.category}
										</span>
									</Table.Cell>
									<Table.Cell>
										<div class="flex -space-x-2 overflow-hidden py-1">
											{#if expense.receiptIds && expense.receiptIds.length > 0}
												{#each expense.receiptIds as rid, i (rid)}
													{#if receiptsMap[rid]}
														<button
															onclick={() => openPreview(receiptsMap[rid])}
															class="relative z-[i] inline-block h-9 w-9 overflow-hidden rounded-lg border-2 border-white bg-gray-100 shadow-sm transition-transform hover:z-10 hover:-translate-y-1 hover:scale-110 dark:border-gray-900"
															title={receiptsMap[rid].fileName}
														>
															{#if receiptsMap[rid].fileType.startsWith('image/')}
																<img
																	src={objectUrls[rid] || receiptsMap[rid].dataUrl}
																	alt="Receipt"
																	class="h-full w-full object-cover"
																/>
															{:else}
																<div
																	class="flex h-full w-full items-center justify-center bg-blue-50 text-blue-500"
																>
																	<FileText size={18} />
																</div>
															{/if}
														</button>
													{/if}
												{/each}
											{:else}
												<span class="text-muted-foreground text-xs font-medium">Kein Beleg</span>
											{/if}
										</div>
									</Table.Cell>
									<Table.Cell class="pr-6 text-right">
										<div
											class="text-lg font-semibold tracking-tight text-rose-600 dark:text-rose-500"
										>
											-{formatCurrency(expense.amount)}
										</div>
									</Table.Cell>
									<Table.Cell class="pr-6 text-right">
										<div
											class="flex justify-end gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100"
										>
											<Button
												variant="secondary"
												size="icon"
												class="hover:bg-primary hover:text-primary-foreground h-8 w-8 rounded-full shadow-sm"
												onclick={() => editExpense(expense)}
											>
												<Edit size={14} />
											</Button>
											<Button
												variant="secondary"
												size="icon"
												class="text-destructive hover:bg-destructive h-8 w-8 rounded-full shadow-sm hover:text-white"
												onclick={() => confirmDelete(expense.id)}
											>
												<Trash2 size={14} />
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
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
