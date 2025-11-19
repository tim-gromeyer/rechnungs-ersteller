import type { Invoice, Sender } from './types';
import { generateInvoiceNumber } from './utils/invoice-number';

// Load sender data from localStorage
function loadSenderData(): Sender {
	if (typeof window === 'undefined') {
		return getDefaultSender();
	}

	const stored = localStorage.getItem('invoice-sender');
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch {
			return getDefaultSender();
		}
	}
	return getDefaultSender();
}

function getDefaultSender(): Sender {
	return {
		name: 'Max Mustermann',
		street: 'Musterstraße 123',
		zip: '12345',
		city: 'Berlin',
		email: 'max@beispiel.de',
		phone: '+49 123 456789',
		website: 'www.beispiel.de',
		iban: 'DE12 3456 7890 1234 5678 90',
		bic: 'ABCDEFGH',
		taxId: '123/456/7890'
	};
}

// Save sender data to localStorage
function saveSenderData(sender: Sender) {
	if (typeof window === 'undefined') return;
	localStorage.setItem('invoice-sender', JSON.stringify(sender));
}

function createInvoiceState() {
	let invoice = $state<Invoice>({
		number: typeof window !== 'undefined' ? generateInvoiceNumber() : '2025-01-1',
		date: new Date().toISOString().split('T')[0],
		serviceDate: 'today',
		paymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		sender: loadSenderData(),
		customer: {
			company: 'Musterfirma GmbH',
			name: 'Erika Mustermann',
			street: 'Beispielstraße 456',
			zip: '54321',
			city: 'München'
		},
		articles: [
			{ id: crypto.randomUUID(), description: 'Webentwicklung', pricePerUnit: 800, amount: 1 },
			{ id: crypto.randomUUID(), description: 'Hosting (1 Jahr)', pricePerUnit: 120, amount: 1 }
		],
		discounts: [],
		settings: {
			vatRate: 0,
			currency: 'EUR',
			paymentDays: 14,
			invoiceNumberFormat: 'YYYY-MM-<number>',
			paymentText:
				'Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf das unten angegebene Konto.',
			taxNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
		},
		message: 'Vielen Dank für Ihren Auftrag!'
	});

	return {
		get invoice() {
			return invoice;
		},
		set invoice(v) {
			invoice = v;
		},

		// Save sender data whenever it changes
		updateSender: (sender: Sender) => {
			invoice.sender = sender;
			saveSenderData(sender);
		},

		addArticle: () => {
			invoice.articles.push({
				id: crypto.randomUUID(),
				description: 'New Item',
				pricePerUnit: 0,
				amount: 1
			});
		},
		removeArticle: (id: string) => {
			invoice.articles = invoice.articles.filter((a) => a.id !== id);
		},
		addDiscount: () => {
			invoice.discounts.push({
				id: crypto.randomUUID(),
				description: 'Discount',
				amount: 0
			});
		},
		removeDiscount: (id: string) => {
			invoice.discounts = invoice.discounts.filter((d) => d.id !== id);
		}
	};
}

export const invoiceState = createInvoiceState();
