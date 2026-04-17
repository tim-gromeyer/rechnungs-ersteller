import { json, type RequestHandler } from '@sveltejs/kit';
import { SplitInvoiceInputSchema, createSplitInvoices } from '$lib/utils/invoice-splitting';
import { generatePdf } from '$lib/pdf/generator';
import * as m from '$lib/paraglide/messages';
import JSZip from 'jszip';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		console.log('[API] Body parsed');
		const result = SplitInvoiceInputSchema.safeParse(body);

		if (!result.success) {
			return json({ error: 'Invalid input data', details: result.error.format() }, { status: 400 });
		}

		// Use utility for splitting logic
		const { invoice30, invoice70 } = createSplitInvoices(result.data);

		// Dynamic translations from Paraglide
		const t = {
			title: m.invoice_title(),
			subtotal: m.invoice_subtotal(),
			discount: m.invoice_discount(),
			net: m.invoice_net(),
			plusVat: m.invoice_plusVat({ rate: result.data.settings.vatRate }),
			gross: m.invoice_gross(),
			description: m.invoice_description(),
			price: m.invoice_price(),
			quantity: m.invoice_quantity(),
			amount: m.invoice_amount(),
			taxId: m.invoice_taxId(),
			date: m.invoice_date(),
			number: m.invoice_number(),
			serviceDate: m.invoice_serviceDate(),
			bank: m.invoice_bank(),
			iban: m.invoice_iban(),
			bic: m.invoice_bic()
		};

		// Generate PDFs in parallel
		const [pdf30, pdf70] = await Promise.all([
			generatePdf(invoice30, t),
			generatePdf(invoice70, t)
		]);

		// Package into ZIP
		const zip = new JSZip();
		zip.file(`Rechnung_${invoice30.number}.pdf`, pdf30);
		zip.file(`Rechnung_${invoice70.number}.pdf`, pdf70);

		const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

		return new Response(zipBuffer, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="Rechnungen_${result.data.project.id}.zip"`
			}
		});
	} catch (error) {
		console.error('API Error:', error);
		return json(
			{ error: 'Internal server error', message: (error as Error).message },
			{ status: 500 }
		);
	}
};
