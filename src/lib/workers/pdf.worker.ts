import { generatePdf } from '../pdf/generator';

import type { Invoice } from '../types';

export interface PdfWorkerData {
	invoice: Invoice;
	translations: Record<string, string>;
	previewOnly?: boolean;
}

self.onmessage = async (e: MessageEvent<PdfWorkerData>) => {
	const { invoice, translations, previewOnly } = e.data;
	try {
		const pdfBuffer = await generatePdf(invoice, translations, previewOnly);
		self.postMessage({ success: true, pdfBuffer, previewOnly }, [pdfBuffer]);
	} catch (error) {
		self.postMessage({ success: false, error: (error as Error).message, previewOnly });
	}
};
