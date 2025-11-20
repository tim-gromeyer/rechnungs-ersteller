import { z } from 'zod';

// Basic regex for IBAN and BIC. For production, consider a more robust library
// that can validate based on country codes.
const ibanRegex = /^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/;
const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/; // Basic phone number regex

export const addressSchema = z.object({
	company: z.string().optional(),
	name: z.string().min(1, 'Name ist erforderlich'),
	street: z.string().min(1, 'Straße ist erforderlich'),
	zip: z.string().min(1, 'Postleitzahl ist erforderlich'),
	city: z.string().min(1, 'Ort ist erforderlich'),
	country: z.string().optional()
});

export const contactInfoSchema = z.object({
	email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
	phone: z.string().regex(phoneRegex, 'Ungültige Telefonnummer').optional().or(z.literal('')),
	website: z.string().url('Ungültige URL').optional().or(z.literal(''))
});

export const bankDetailsSchema = z.object({
	bankName: z.string().optional(),
	iban: z.string().regex(ibanRegex, 'Ungültiges IBAN-Format').optional().or(z.literal('')),
	bic: z.string().regex(bicRegex, 'Ungültiges BIC-Format').optional().or(z.literal('')),
	taxId: z.string().optional(),
	vatId: z.string().optional()
});

export const senderSchema = addressSchema.merge(contactInfoSchema).merge(bankDetailsSchema);

export const invoiceSettingsSchema = z.object({
	locale: z.string().min(1, 'Sprachcode ist erforderlich'),
	vatRate: z.number().min(0, 'Mehrwertsteuersatz darf nicht negativ sein'),
	currency: z.string().min(1, 'Währung ist erforderlich'),
	paymentDays: z.number().int().min(0, 'Zahlungsziel muss eine nicht-negative ganze Zahl sein'),
	invoiceNumberFormat: z.string().min(1, 'Rechnungsnummernformat ist erforderlich'),
	logoPath: z.string().optional(),
	paymentText: z.string().optional(),
	taxNote: z.string().optional()
});

export const articleSchema = z.object({
	id: z.string(),
	description: z.string().min(1, 'Artikelbeschreibung ist erforderlich'),
	pricePerUnit: z.number().min(0, 'Preis pro Einheit darf nicht negativ sein'),
	amount: z.number().min(1, 'Menge muss mindestens 1 sein'),
	summary: z.string().optional()
});

export const discountSchema = z.object({
	id: z.string(),
	description: z.string().min(1, 'Rabattbeschreibung ist erforderlich'),
	amount: z.number().min(0, 'Rabattbetrag darf nicht negativ sein')
});

export const invoiceSchema = z.object({
	number: z.string().min(1, 'Rechnungsnummer ist erforderlich'),
	date: z.string().min(1, 'Datum ist erforderlich'),
	serviceDate: z.string().min(1, 'Leistungsdatum ist erforderlich'),
	paymentDate: z.string().min(1, 'Fälligkeitsdatum ist erforderlich'),

	sender: senderSchema,
	customer: addressSchema,

	articles: z.array(articleSchema),
	discounts: z.array(discountSchema),

	settings: invoiceSettingsSchema,

	message: z.string().optional()
});

export type InvoiceValidation = z.infer<typeof invoiceSchema>;
export type SenderValidation = z.infer<typeof senderSchema>;
export type CustomerValidation = z.infer<typeof addressSchema>;
