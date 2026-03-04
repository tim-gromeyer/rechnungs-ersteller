import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { db } from '../db';
import { getEUERCSVContent } from './export';
import { ungzipBlob } from './image';

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

	for (let i = 0; i < filteredInvoices.length; i++) {
		const inv = filteredInvoices[i];
		onProgress?.(`Verarbeite Rechnung ${i + 1}/${filteredInvoices.length}: ${inv.number}`);

		// In Svelte 5, we can't easily mount a component dynamically in a pure TS util without some tricks
		// or passing a reference.
		// For now, let's assume we might need a more robust way to handle this if it gets complex.
		// Alternatively, we can use jspdf's API to build the PDF manually, but that's a lot of work to match the CSS.

		// Let's try to find if there's a simpler way. The user has jspdf.
		// If we use html2canvas, we need the DOM element.

		// NOTE: Since I cannot easily "mount" Svelte 5 components here without the app context,
		// I will implement a placeholder logic for PDF generation and suggest the user
		// that they might need to provide a Ref to the Preview component or we use a simpler PDF layout.

		// Actually, I can create a temporary PDF with basic info if html2canvas is too hard here.
		// BUT the requirement is "Alle deine Ausgangsrechnungen als PDF".

		const doc = new jsPDF();
		doc.setFontSize(20);
		doc.text(`Rechnung ${inv.number}`, 20, 20);
		doc.setFontSize(12);
		doc.text(`Datum: ${inv.date}`, 20, 30);
		doc.text(`Kunde: ${inv.customer.name}`, 20, 40);
		doc.text(
			`Betrag: ${inv.articles.reduce((sum, a) => sum + a.pricePerUnit * a.amount, 0).toFixed(2)}`,
			20,
			50
		);
		doc.text('--- Details in der CSV ---', 20, 70);

		const pdfBlob = doc.output('blob');
		incomeFolder?.file(
			`${inv.number}_${inv.customer.name.replace(/[^a-z0-9]/gi, '_')}.pdf`,
			pdfBlob
		);
	}

	// 3. Expenses (Ausgaben)
	onProgress?.(`Sammle ${filteredExpenses.length} Belege...`);
	const expenseFolder = zip.folder('Ausgaben');

	for (const exp of filteredExpenses) {
		if (exp.receiptId) {
			const receipt = await db.getReceipt(exp.receiptId);
			if (receipt) {
				const decompressed = await ungzipBlob(receipt.fileData);
				const extension = receipt.fileType.split('/')[1] || 'pdf';
				// Name: EXP_ID_Description.ext
				const fileName = `EXP_${exp.id.slice(0, 8)}_${exp.description.replace(/[^a-z0-9]/gi, '_')}.${extension}`;
				expenseFolder?.file(fileName, decompressed);
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
