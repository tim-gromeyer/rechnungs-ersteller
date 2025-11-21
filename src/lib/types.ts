export interface Address {
	company?: string;
	name: string;
	street: string;
	zip: string;
	city: string;
	country?: string;
}

export interface ContactInfo {
	email?: string;
	phone?: string;
	website?: string;
}

export interface BankDetails {
	bankName?: string;
	iban?: string;
	bic?: string;
	taxId?: string; // Steuernummer
	vatId?: string; // USt-IdNr.
}

export interface Sender extends Address, ContactInfo, BankDetails {
	// Combined interface for the sender (user)
}

// These were incorrectly removed by a previous replace operation
export interface Article {
	id: string; // Unique ID for UI handling
	description: string;
	pricePerUnit: number;
	amount: number;
	summary?: string; // Optional detailed description
}

export interface Discount {
	id: string;
	description: string;
	amount: number; // Fixed amount in currency
}

export interface InvoiceSettings {
	locale: string; // e.g. 'de-DE'
	vatRate: number; // e.g. 19.0
	currency: string; // e.g. "EUR"
	paymentDays: number; // Default 14
	invoiceNumberFormat: string; // e.g. "YYYY-MM-<number>"
	logoPath?: string;
	paymentText?: string; // Customizable payment instruction text
	taxNote?: string; // Customizable tax note (e.g., §19 UStG)
}

export interface Invoice {
	id: string;
	number: string;
	date: string; // ISO date string
	serviceDate: string; // ISO date string or "today"
	paymentDate: string; // Calculated or manual

	sender: Sender;
	customer: Address; // Corrected to use Address directly

	articles: Article[];
	discounts: Discount[];

	settings: InvoiceSettings;

	message?: string; // Custom message/note
}
