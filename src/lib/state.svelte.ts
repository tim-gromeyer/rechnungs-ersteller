import type { Invoice } from './types';
import { generateInvoiceNumber } from './utils/invoice-number';
import { browser } from '$app/environment';

function loadInvoice(): Invoice {
	const defaultInvoice = getDefaultInvoice();
	if (!browser) {
		return defaultInvoice;
	}

	const stored = localStorage.getItem('invoice-state');
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed === 'object' && 'articles' in parsed) {
				const merged: Invoice = {
					...defaultInvoice,
					...parsed,
					sender: {
						...defaultInvoice.sender,
						...parsed.sender
					},
					settings: {
						...defaultInvoice.settings,
						...parsed.settings
					}
				};
				return merged;
			}
		} catch {
			// Fallback to default if parsing fails
		}
	}
	return defaultInvoice;
}

function getDefaultInvoice(): Invoice {
	return {
		number: browser ? generateInvoiceNumber() : '2025-01-1',
		date: new Date().toISOString().split('T')[0],
		serviceDate: 'today',
		paymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		sender: {
			company: '',
			name: 'Max Mustermann',
			street: 'Musterstraße 123',
			zip: '12345',
			city: 'Musterstadt',
			email: 'max.mustermann@example.com',
			phone: '+49 123 456789',
			website: 'https://example.com',
			bankName: '',
			iban: 'DE1234567890',
			bic: 'BIC123456789',
			taxId: '123/456/7890',
			vatId: 'DE123456789'
		},
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
			locale: 'de-DE',
			vatRate: 0,
			currency: 'EUR',
			paymentDays: 14,
			invoiceNumberFormat: 'YYYY-MM-<number>',
			paymentText:
				'Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf das unten angegebene Konto.',
			taxNote: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
		},
		message: 'Vielen Dank für Ihren Auftrag!'
	};
}

function createInvoiceState() {
	let invoice = $state<Invoice>(loadInvoice());

	return {
		get invoice() {
			return invoice;
		},
		set invoice(v) {
			invoice = v;
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
		},
		createNewInvoice: () => {
			// Preserve sender information and settings
			const preservedSender = { ...invoice.sender };
			const preservedSettings = { ...invoice.settings };
			const preservedMessage = invoice.message || 'Vielen Dank für Ihren Auftrag!';

			// Generate new invoice number
			const newNumber = generateInvoiceNumber();
			console.log('Creating new invoice with number:', newNumber);

			// Reset invoice with new number and date
			const newInvoice: Invoice = {
				number: newNumber,
				date: new Date().toISOString().split('T')[0],
				serviceDate: 'today',
				paymentDate: new Date(
					Date.now() + (preservedSettings.paymentDays || 14) * 24 * 60 * 60 * 1000
				)
					.toISOString()
					.split('T')[0],
				sender: preservedSender,
				customer: {
					company: '',
					name: '',
					street: '',
					zip: '',
					city: ''
				},
				articles: [],
				discounts: [],
				settings: preservedSettings,
				message: preservedMessage
			};

			// Assign the new invoice object
			invoice = newInvoice;
			console.log('New invoice created:', invoice.number);
		}
	};
}

export const invoiceState = createInvoiceState();
