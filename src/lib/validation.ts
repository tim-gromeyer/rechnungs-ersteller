import { z } from 'zod';

// Basic regex for IBAN and BIC. For production, consider a more robust library
// that can validate based on country codes.
const ibanRegex = /^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/;
const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/; // Basic phone number regex

import * as m from '$lib/paraglide/messages';

// Factory function to create schemas with localized error messages
export function createInvoiceSchema() {
	const addressSchema = z.object({
		company: z.string().optional(),
		name: z.string().min(1, m.validation_nameRequired()),
		street: z.string().min(1, m.validation_streetRequired()),
		zip: z.string().min(1, m.validation_zipRequired()),
		city: z.string().min(1, m.validation_cityRequired()),
		country: z.string().optional()
	});

	const contactInfoSchema = z.object({
		email: z.string().email(m.validation_invalidEmail()).optional().or(z.literal('')),
		phone: z.string().regex(phoneRegex, m.validation_invalidPhone()).optional().or(z.literal('')),
		website: z.string().url(m.validation_invalidUrl()).optional().or(z.literal(''))
	});

	const bankDetailsSchema = z.object({
		bankName: z.string().optional(),
		iban: z.string().regex(ibanRegex, m.validation_invalidIban()).optional().or(z.literal('')),
		bic: z.string().regex(bicRegex, m.validation_invalidBic()).optional().or(z.literal('')),
		taxId: z.string().optional(),
		vatId: z.string().optional()
	});

	const senderSchema = addressSchema.merge(contactInfoSchema).merge(bankDetailsSchema);

	const invoiceSettingsSchema = z.object({
		locale: z.string().min(1, m.validation_localeRequired()),
		vatRate: z.number().min(0, m.validation_vatRateNonNegative()),
		currency: z.string().min(1, m.validation_currencyRequired()),
		paymentDays: z.number().int().min(0, m.validation_paymentDaysNonNegative()),
		invoiceNumberFormat: z.string().min(1, m.validation_invoiceNumberFormatRequired()),
		logoPath: z.string().optional(),
		paymentText: z.string().optional(),
		taxNote: z.string().optional()
	});

	const articleSchema = z.object({
		id: z.string(),
		description: z.string().min(1, m.validation_articleDescriptionRequired()),
		pricePerUnit: z.number().min(0, m.validation_priceNonNegative()),
		amount: z.number().min(1, m.validation_amountMinOne()),
		summary: z.string().optional()
	});

	const discountSchema = z.object({
		id: z.string(),
		description: z.string().min(1, m.validation_discountDescriptionRequired()),
		amount: z.number().min(0, m.validation_discountAmountNonNegative())
	});

	const invoiceSchema = z.object({
		number: z.string().min(1, m.validation_invoiceNumberRequired()),
		date: z.string().min(1, m.validation_dateRequired()),
		serviceDate: z.string().min(1, m.validation_serviceDateRequired()),
		paymentDate: z.string().min(1, m.validation_paymentDateRequired()),

		sender: senderSchema,
		customer: addressSchema,

		articles: z.array(articleSchema),
		discounts: z.array(discountSchema),

		settings: invoiceSettingsSchema,

		message: z.string().optional()
	});

	return {
		invoiceSchema,
		addressSchema,
		senderSchema,
		contactInfoSchema,
		bankDetailsSchema,
		invoiceSettingsSchema,
		articleSchema,
		discountSchema
	};
}

// Type exports (using a dummy schema for type inference)
export type InvoiceValidation = z.infer<ReturnType<typeof createInvoiceSchema>['invoiceSchema']>;
export type SenderValidation = z.infer<ReturnType<typeof createInvoiceSchema>['senderSchema']>;
export type CustomerValidation = z.infer<ReturnType<typeof createInvoiceSchema>['addressSchema']>;
