import { db } from '../db';
import type { Invoice, Expense, Receipt } from '../types';

export interface BackupData {
	version: number;
	date: string;
	invoices: Invoice[];
	expenses: Expense[];
	receipts: (Omit<Receipt, 'fileData'> & { fileData?: string })[]; // Store Blob as base64 string
}

async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function base64ToBlob(base64: string): Promise<Blob> {
	const res = await fetch(base64);
	return await res.blob();
}

export async function exportDatabase(): Promise<void> {
	const invoices = await db.getAllInvoices();
	const expenses = await db.getAllExpenses();

	// Fetch all receipts and convert Blobs to base64
	const receipts: (Omit<Receipt, 'fileData'> & { fileData?: string })[] = [];
	const allReceiptIds = new Set<string>();
	expenses.forEach((e) => e.receiptIds?.forEach((id) => allReceiptIds.add(id)));

	for (const receiptId of Array.from(allReceiptIds)) {
		const receipt = await db.getReceipt(receiptId);
		if (receipt) {
			const { fileData, ...rest } = receipt;
			receipts.push({
				...rest,
				fileData: fileData ? await blobToBase64(fileData) : undefined
			});
		}
	}

	const backup: BackupData = {
		version: 2, // Increment version
		date: new Date().toISOString(),
		invoices,
		expenses,
		receipts
	};

	const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `RechnungsErsteller_Backup_${new Date().toISOString().split('T')[0]}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export async function importDatabase(file: File): Promise<void> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (e) => {
			try {
				const content = e.target?.result as string;
				const backup: BackupData = JSON.parse(content);

				if (!backup.invoices || !backup.expenses) {
					throw new Error('Ungültiges Backup-Format');
				}

				// Import data
				for (const invoice of backup.invoices) {
					await db.saveInvoice(invoice);
				}
				for (const expense of backup.expenses) {
					await db.saveExpense(expense);
				}
				if (backup.receipts) {
					for (const r of backup.receipts) {
						const receipt: Receipt = {
							...r,
							fileData: r.fileData ? await base64ToBlob(r.fileData) : new Blob()
						};
						await db.saveReceipt(receipt);
					}
				}

				resolve();
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
		reader.readAsText(file);
	});
}
