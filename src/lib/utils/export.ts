import type { Invoice, Expense } from '../types';

export function getEUERCSVContent(invoices: Invoice[], expenses: Expense[], year: number) {
	// Filter paid invoices and expenses by year
	const filteredInvoices = invoices.filter(
		(i) => i.isPaid && new Date(i.date).getFullYear() === year
	);

	const filteredExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === year);

	// Calculate invoice totals
	const calculateTotal = (invoice: Invoice) => {
		const subtotal = invoice.articles.reduce(
			(sum, article) => sum + article.pricePerUnit * article.amount,
			0
		);
		const discountTotal = invoice.discounts.reduce((sum, discount) => sum + discount.amount, 0);
		const totalBeforeTax = subtotal - discountTotal;
		const tax = totalBeforeTax * (invoice.settings.vatRate / 100);
		return totalBeforeTax + tax;
	};

	// CSV Header
	let csvContent = 'Datum;Typ;Belegnummer;Beschreibung;Kategorie;Betrag (EUR)\n';

	// Einnahmen
	filteredInvoices.forEach((inv) => {
		const amount = calculateTotal(inv);
		csvContent += `${new Date(inv.date).toLocaleDateString('de-DE')};Einnahme;${inv.number};${inv.customer.company || inv.customer.name};Umsatzerlöse;${amount.toFixed(2).replace('.', ',')}\n`;
	});

	// Ausgaben
	filteredExpenses.forEach((exp) => {
		csvContent += `${new Date(exp.date).toLocaleDateString('de-DE')};Ausgabe;${exp.receiptId ? exp.id : '-'};${exp.description};${exp.category};-${exp.amount.toFixed(2).replace('.', ',')}\n`;
	});

	return csvContent;
}

export function generateEUERCSV(invoices: Invoice[], expenses: Expense[], year: number) {
	const csvContent = getEUERCSVContent(invoices, expenses, year);

	// Download
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `EUER_Export_${year}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
