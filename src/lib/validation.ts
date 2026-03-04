import { z } from 'zod';

// Basic regex for IBAN and BIC. For production, consider a more robust library
// that can validate based on country codes.
const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const phoneRegex = /^\+?[0-9][0-9\s.-]{6,20}$/; // More flexible international phone regex

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
		phone: z
			.string()
			.transform((val) => val.replace(/\s+/g, ''))
			.refine((val) => !val || phoneRegex.test(val), {
				message: m.validation_invalidPhone()
			})
			.optional()
			.or(z.literal('')),
		website: z.string().url(m.validation_invalidUrl()).optional().or(z.literal(''))
	});

	const bankDetailsSchema = z.object({
		bankName: z.string().optional(),
		iban: z
			.string()
			.transform((val) => val.replace(/\s+/g, ''))
			.refine((val) => !val || ibanRegex.test(val), {
				message: m.validation_invalidIban()
			})
			.optional()
			.or(z.literal('')),
		bic: z
			.string()
			.transform((val) => val.replace(/\s+/g, ''))
			.refine((val) => !val || bicRegex.test(val), {
				message: m.validation_invalidBic()
			})
			.optional()
			.or(z.literal('')),
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

export function createExpenseSchema() {
	const expenseSchema = z.object({
		id: z.string().optional(),
		date: z.string().min(1, m.validation_dateRequired()),
		amount: z.number().positive(m.validation_amountPositive()),
		description: z.string().min(1, m.validation_descriptionRequired()),
		category: z.string().min(1, m.validation_categoryRequired()),
		receiptIds: z.array(z.string()).optional()
	});

	return { expenseSchema };
}

// Type exports (using a dummy schema for type inference)
export type InvoiceValidation = z.infer<ReturnType<typeof createInvoiceSchema>['invoiceSchema']>;
export type SenderValidation = z.infer<ReturnType<typeof createInvoiceSchema>['senderSchema']>;
export type CustomerValidation = z.infer<ReturnType<typeof createInvoiceSchema>['addressSchema']>;
export type ExpenseValidation = z.infer<ReturnType<typeof createExpenseSchema>['expenseSchema']>;
