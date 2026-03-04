import { db } from '../db';
import type { Invoice, Expense, Receipt } from '../types';

export interface BackupData {
	version: number;
	date: string;
	invoices: Invoice[];
	expenses: Expense[];
	receipts: Receipt[];
	// We could export settings too, but let's stick to the core data
}

export async function exportDatabase(): Promise<void> {
	const invoices = await db.getAllInvoices();
	const expenses = await db.getAllExpenses();

	// Fetch all receipts
	const receipts: Receipt[] = [];
	for (const expense of expenses) {
		if (expense.receiptId) {
			const receipt = await db.getReceipt(expense.receiptId);
			if (receipt) receipts.push(receipt);
		}
	}

	const backup: BackupData = {
		version: 1,
		date: new Date().toISOString(),
		invoices,
		expenses,
		receipts
	};

	const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
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
					for (const receipt of backup.receipts) {
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
