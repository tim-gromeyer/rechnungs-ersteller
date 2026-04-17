import { z } from 'zod';
import { parseGermanCurrency } from './calculations';
import type { Invoice, Article } from '../types';

export const PositionSchema = z.object({
	desc: z.string(),
	price: z.string()
});

export const SplitInvoiceInputSchema = z.object({
	sender: z.object({
		company: z.string().optional(),
		name: z.string(),
		street: z.string(),
		zip: z.string(),
		city: z.string(),
		country: z.string().optional(),
		email: z.string().optional(),
		phone: z.string().optional(),
		website: z.string().optional(),
		bankName: z.string().optional(),
		iban: z.string().optional(),
		bic: z.string().optional(),
		taxId: z.string().optional(),
		vatId: z.string().optional(),
		logoPath: z.string().optional()
	}),
	customer: z.object({
		company: z.string().optional(),
		name: z.string(),
		street: z.string(),
		zip: z.string(),
		city: z.string(),
		country: z.string().optional()
	}),
	project: z.object({
		id: z.string(),
		name: z.string(),
		date: z.string(),
		positions: z.array(PositionSchema)
	}),
	settings: z.object({
		vatRate: z.number().default(19.0),
		currency: z.string().default('EUR'),
		locale: z.string().default('de-DE'),
		paymentDays: z.number().default(14),
		baseInvoiceNumber: z.string()
	})
});

export type SplitInvoiceInput = z.infer<typeof SplitInvoiceInputSchema>;

export function createSplitInvoices(data: SplitInvoiceInput): {
	invoice30: Invoice;
	invoice70: Invoice;
} {
	const articles: Article[] = data.project.positions.map((p, index) => ({
		id: `pos-${index}`,
		description: p.desc,
		pricePerUnit: parseGermanCurrency(p.price),
		amount: 1
	}));

	const totalNet = articles.reduce((sum, a) => sum + a.pricePerUnit * a.amount, 0);

	const commonInvoice: Omit<
		Invoice,
		'id' | 'number' | 'date' | 'serviceDate' | 'paymentDate' | 'articles' | 'title'
	> = {
		sender: data.sender as unknown as Invoice['sender'],
		customer: data.customer as unknown as Invoice['customer'],
		discounts: [],
		settings: {
			locale: data.settings.locale,
			vatRate: data.settings.vatRate,
			currency: data.settings.currency,
			paymentDays: data.settings.paymentDays,
			invoiceNumberFormat: 'YYYY-MM-<number>',
			template: 'default'
		},
		isPaid: false
	};

	const today = new Date().toISOString().split('T')[0];
	const paymentDate = (days: number) => {
		const d = new Date();
		d.setDate(d.getDate() + days);
		return d.toISOString().split('T')[0];
	};

	const invoice30: Invoice = {
		...commonInvoice,
		id: globalThis.crypto.randomUUID(),
		number: `${data.settings.baseInvoiceNumber}-A`,
		date: today,
		serviceDate: data.project.date,
		paymentDate: paymentDate(data.settings.paymentDays),
		title: `Akonto-Rechnung / Anzahlung (30%) - ${data.project.name}`,
		articles: [
			{
				id: 'anzahlung-30',
				description: `Anzahlung (30%) für: ${data.project.name}`,
				pricePerUnit: totalNet * 0.3,
				amount: 1,
				summary: `Basierend auf Projekt: ${data.project.name} (${data.project.id})`
			}
		]
	};

	const invoice70: Invoice = {
		...commonInvoice,
		id: globalThis.crypto.randomUUID(),
		number: `${data.settings.baseInvoiceNumber}-R`,
		date: today,
		serviceDate: data.project.date,
		paymentDate: paymentDate(data.settings.paymentDays),
		title: `Schlussrechnung - ${data.project.name}`,
		articles: articles,
		discounts: [
			{
				id: 'paid-downpayment',
				description: `Bereits geleistete Anzahlung (30%)`,
				amount: totalNet * 0.3
			}
		]
	};

	return { invoice30, invoice70 };
}
