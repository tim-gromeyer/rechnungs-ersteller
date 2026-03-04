import JSZip from 'jszip';
import { db } from '../db';
import { getEUERCSVContent } from './export';
import { ungzipBlob } from './image';
import * as m from '$lib/paraglide/messages';

export async function generateExportZip(year: number, onProgress?: (msg: string) => void) {
	onProgress?.('Lade Daten...');
	const invoices = await db.getAllInvoices();
	const expenses = await db.getAllExpenses();

	const filteredInvoices = invoices.filter(
		(i) => i.isPaid && new Date(i.date).getFullYear() === year
	);
	const filteredExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === year);

	const zip = new JSZip();

	// 1. EÜR CSV
	onProgress?.('Generiere EÜR CSV...');
	const csvContent = getEUERCSVContent(invoices, expenses, year);
	zip.file(`EUER_${year}.csv`, csvContent);

	// 2. Invoices (Einnahmen)
	onProgress?.(`Generiere ${filteredInvoices.length} Rechnungs-PDFs...`);
	const incomeFolder = zip.folder('Einnahmen');

	// Initialize the worker correctly for Vite
	const PdfWorkerDef = await import('$lib/workers/pdf.worker.ts?worker');
	const pdfWorker = new PdfWorkerDef.default();

	for (let i = 0; i < filteredInvoices.length; i++) {
		const inv = filteredInvoices[i];
		onProgress?.(`Verarbeite Rechnung ${i + 1}/${filteredInvoices.length}: ${inv.number}`);

		// Build translations for the worker
		const translations = {
			title: m.invoice_title(),
			subtotal: m.invoice_subtotal(),
			discount: m.invoice_discount(),
			net: m.invoice_net(),
			plusVat: m.invoice_plusVat({ rate: inv.settings.vatRate }),
			gross: m.invoice_gross(),
			description: m.invoice_description(),
			price: m.invoice_price(),
			quantity: m.invoice_quantity(),
			amount: m.invoice_amount(),
			taxId: m.invoice_taxId(),
			date: m.invoice_date(),
			number: m.invoice_number(),
			serviceDate: m.invoice_serviceDate(),
			bank: m.invoice_bank(),
			iban: m.invoice_iban(),
			bic: m.invoice_bic()
		};

		// Request PDF generation from worker
		const pdfBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
			const handler = (e: MessageEvent) => {
				if (e.data.success) {
					pdfWorker.removeEventListener('message', handler);
					resolve(e.data.pdfBuffer);
				} else {
					pdfWorker.removeEventListener('message', handler);
					reject(e.data.error);
				}
			};
			pdfWorker.addEventListener('message', handler);
			pdfWorker.postMessage({ invoice: inv, translations, previewOnly: false });
		});

		incomeFolder?.file(
			`${inv.number}_${inv.customer.name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
			pdfBuffer
		);
	}

	pdfWorker.terminate();

	// 3. Expenses (Ausgaben)
	onProgress?.(`Sammle ${filteredExpenses.length} Belege...`);
	const expenseFolder = zip.folder('Ausgaben');

	for (const exp of filteredExpenses) {
		if (exp.receiptIds && exp.receiptIds.length > 0) {
			for (let i = 0; i < exp.receiptIds.length; i++) {
				const receiptId = exp.receiptIds[i];
				const receipt = await db.getReceipt(receiptId);
				if (receipt) {
					const decompressed = await ungzipBlob(receipt.fileData);
					const extension = receipt.fileType.split('/')[1] || 'pdf';
					// Name: EXP_ID_Description_Counter.ext
					const suffix = exp.receiptIds.length > 1 ? `_${i + 1}` : '';
					const fileName = `EXP_${exp.id.slice(0, 8)}_${exp.description.replace(/[^a-z0-9]/gi, '_')}${suffix}.${extension}`;
					expenseFolder?.file(fileName, decompressed);
				}
			}
		}
	}

	onProgress?.('Erstelle ZIP-Datei...');
	const content = await zip.generateAsync({ type: 'blob' });

	// Start download
	const url = URL.createObjectURL(content);
	const link = document.createElement('a');
	link.href = url;
	link.download = `Export_GoBD_${year}.zip`;
	link.click();
	URL.revokeObjectURL(url);

	onProgress?.('Export abgeschlossen!');
}
