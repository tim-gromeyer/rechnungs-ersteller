import { z } from 'zod';

// Basic regex for IBAN and BIC. For production, consider a more robust library
// that can validate based on country codes.
const ibanRegex = /^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/;
const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/; // Basic phone number regex

// Type for translation function
type TranslateFn = (key: string) => string;

// Factory function to create schemas with localized error messages
export function createInvoiceSchema(t: TranslateFn) {
	const addressSchema = z.object({
		company: z.string().optional(),
		name: z.string().min(1, t('validation.nameRequired')),
		street: z.string().min(1, t('validation.streetRequired')),
		zip: z.string().min(1, t('validation.zipRequired')),
		city: z.string().min(1, t('validation.cityRequired')),
		country: z.string().optional()
	});

	const contactInfoSchema = z.object({
		email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
		phone: z.string().regex(phoneRegex, t('validation.invalidPhone')).optional().or(z.literal('')),
		website: z.string().url(t('validation.invalidUrl')).optional().or(z.literal(''))
	});

	const bankDetailsSchema = z.object({
		bankName: z.string().optional(),
		iban: z.string().regex(ibanRegex, t('validation.invalidIban')).optional().or(z.literal('')),
		bic: z.string().regex(bicRegex, t('validation.invalidBic')).optional().or(z.literal('')),
		taxId: z.string().optional(),
		vatId: z.string().optional()
	});

	const senderSchema = addressSchema.merge(contactInfoSchema).merge(bankDetailsSchema);

	const invoiceSettingsSchema = z.object({
		locale: z.string().min(1, t('validation.localeRequired')),
		vatRate: z.number().min(0, t('validation.vatRateNonNegative')),
		currency: z.string().min(1, t('validation.currencyRequired')),
		paymentDays: z.number().int().min(0, t('validation.paymentDaysNonNegative')),
		invoiceNumberFormat: z.string().min(1, t('validation.invoiceNumberFormatRequired')),
		logoPath: z.string().optional(),
		paymentText: z.string().optional(),
		taxNote: z.string().optional()
	});

	const articleSchema = z.object({
		id: z.string(),
		description: z.string().min(1, t('validation.articleDescriptionRequired')),
		pricePerUnit: z.number().min(0, t('validation.priceNonNegative')),
		amount: z.number().min(1, t('validation.amountMinOne')),
		summary: z.string().optional()
	});

	const discountSchema = z.object({
		id: z.string(),
		description: z.string().min(1, t('validation.discountDescriptionRequired')),
		amount: z.number().min(0, t('validation.discountAmountNonNegative'))
	});

	const invoiceSchema = z.object({
		number: z.string().min(1, t('validation.invoiceNumberRequired')),
		date: z.string().min(1, t('validation.dateRequired')),
		serviceDate: z.string().min(1, t('validation.serviceDateRequired')),
		paymentDate: z.string().min(1, t('validation.paymentDateRequired')),

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
