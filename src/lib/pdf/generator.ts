import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { PDFDocument } from 'pdf-lib';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Invoice } from '../types';
import {
    calculateSubtotal,
    calculateDiscountTotal,
    calculateNetTotal,
    calculateVat,
    calculateGrossTotal,
    calculateArticleTotal,
    formatCurrency,
    formatDate
} from '../utils/calculations';
import { generateZugferdXml } from '../utils/zugferd';

const pdfMakeInstance = (pdfMake as unknown as { default: any }).default || pdfMake;
const pdfFontsInstance =
    (pdfFonts as unknown as { pdfMake?: { vfs: any }; vfs?: any; default?: any }).pdfMake?.vfs ||
    (pdfFonts as any).vfs ||
    (pdfFonts as any).default ||
    pdfFonts;
pdfMakeInstance.vfs = pdfFontsInstance;

// Ensure fonts are mapped for Node.js environments if using vfs
pdfMakeInstance.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

/**
 * Ensures the input is converted to a clean ArrayBuffer.
 * Handles Uint8Array, Buffer (Node.js), and ArrayBuffer.
 */
function toArrayBuffer(input: any): ArrayBuffer {
    if (input instanceof ArrayBuffer) {
        return input;
    }
    if (ArrayBuffer.isView(input)) {
        return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    }
    // Fallback for Node.js Buffer or other array-likes
    return new Uint8Array(input).buffer;
}

export async function generatePdf(
    invoice: Invoice,
    t: Record<string, string>,
    previewOnly: boolean = false
): Promise<ArrayBuffer> {
    const subtotal = calculateSubtotal(invoice.articles);
    const discountTotal = calculateDiscountTotal(invoice.discounts);
    const netTotal = calculateNetTotal(invoice.articles, invoice.discounts);
    const vatTotal = calculateVat(netTotal, invoice.settings.vatRate);
    const grossTotal = calculateGrossTotal(netTotal, vatTotal);

    const isKleinunternehmer = invoice.settings.template === 'kleinunternehmer';
    const currency = invoice.settings.currency;
    const locale = invoice.settings.locale;

    const tableBody: any[][] = [
        [
            { text: t.description.toUpperCase(), style: 'tableHeader' },
            { text: t.price.toUpperCase(), style: 'tableHeader', alignment: 'right' },
            { text: t.quantity.toUpperCase(), style: 'tableHeader', alignment: 'right' },
            { text: t.amount.toUpperCase(), style: 'tableHeader', alignment: 'right' }
        ]
    ];

    invoice.articles.forEach((article) => {
        tableBody.push([
            {
                stack: [
                    { text: article.description, color: '#111827', fontSize: 9, bold: true },
                    ...(article.summary
                        ? [{ text: article.summary, color: '#4b5563', fontSize: 8, margin: [0, 1, 0, 0] }]
                        : [])
                ],
                margin: [0, 4]
            },
            {
                text: formatCurrency(article.pricePerUnit, currency, locale),
                alignment: 'right',
                color: '#374151',
                margin: [0, 4]
            },
            {
                text: article.amount.toString(),
                alignment: 'right',
                color: '#374151',
                margin: [0, 4]
            },
            {
                text: formatCurrency(calculateArticleTotal(article), currency, locale),
                alignment: 'right',
                color: '#111827',
                bold: true,
                margin: [0, 4]
            }
        ]);
    });

    invoice.discounts.forEach((discount) => {
        tableBody.push([
            { text: discount.description, color: '#166534', margin: [0, 3], italics: true, fontSize: 8 },
            { text: '-', alignment: 'right', color: '#9ca3af', margin: [0, 3] },
            { text: '-', alignment: 'right', color: '#9ca3af', margin: [0, 3] },
            {
                text: '-' + formatCurrency(discount.amount, currency, locale),
                alignment: 'right',
                color: '#166534',
                bold: true,
                margin: [0, 3],
                fontSize: 8
            }
        ]);
    });

    const senderReturnAddress = `${invoice.sender.company || invoice.sender.name} • ${invoice.sender.street} • ${invoice.sender.zip} ${invoice.sender.city}`;

    const content: any[] = [
        // SENDER HEADER
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        invoice.settings.logoPath
                            ? {
                                image: invoice.settings.logoPath,
                                width: 90,
                                margin: [0, 0, 0, 0]
                            }
                            : {
                                text: (invoice.sender.company || invoice.sender.name).toUpperCase(),
                                fontSize: 14,
                                bold: true,
                                color: '#0f172a',
                                characterSpacing: 0.8
                            }
                    ]
                },
                {
                    width: 'auto',
                    stack: [
                        {
                            text: invoice.sender.name,
                            bold: true,
                            fontSize: 9,
                            alignment: 'right',
                            color: '#0f172a'
                        },
                        {
                            text: [
                                invoice.sender.email ? { text: invoice.sender.email, color: '#2563eb' } : '',
                                invoice.sender.phone ? `  •  ${invoice.sender.phone}` : '',
                                invoice.sender.website
                                    ? `\n${invoice.sender.website.replace(/^https?:\/\//, '')}`
                                    : ''
                            ],
                            alignment: 'right',
                            fontSize: 8,
                            margin: [0, 2, 0, 0],
                            color: '#64748b',
                            lineHeight: 1.3
                        }
                    ]
                }
            ],
            margin: [0, 0, 0, 25]
        },
        // CUSTOMER & META
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: senderReturnAddress,
                            fontSize: 7,
                            color: '#94a3b8',
                            margin: [0, 0, 0, 10]
                        },
                        {
                            text: invoice.customer.company || '',
                            bold: true,
                            fontSize: 10,
                            color: '#0f172a',
                            margin: [0, 0, 0, 2]
                        },
                        { text: invoice.customer.name, fontSize: 9, margin: [0, 0, 0, 1] },
                        { text: invoice.customer.street, fontSize: 9, margin: [0, 0, 0, 1] },
                        { text: `${invoice.customer.zip} ${invoice.customer.city}`, fontSize: 9 }
                    ]
                },
                {
                    width: 140,
                    stack: [
                        {
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [
                                        { text: t.number, color: '#64748b', fontSize: 8.5, margin: [0, 1] },
                                        {
                                            text: invoice.number,
                                            fontSize: 8.5,
                                            alignment: 'right',
                                            bold: true,
                                            margin: [0, 1]
                                        }
                                    ],
                                    [
                                        { text: t.date, color: '#64748b', fontSize: 8.5, margin: [0, 1] },
                                        {
                                            text: formatDate(invoice.date, locale),
                                            fontSize: 8.5,
                                            alignment: 'right',
                                            margin: [0, 1]
                                        }
                                    ],
                                    [
                                        { text: t.serviceDate, color: '#64748b', fontSize: 8.5, margin: [0, 1] },
                                        {
                                            text: formatDate(invoice.serviceDate, locale),
                                            fontSize: 8.5,
                                            alignment: 'right',
                                            margin: [0, 1]
                                        }
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ],
                    margin: [0, 12, 0, 0]
                }
            ],
            margin: [0, 0, 0, 35]
        },
        // TITLE
        {
            text: t.title.toUpperCase(),
            fontSize: 18,
            bold: true,
            color: '#0f172a',
            margin: [0, 0, 0, 15],
            characterSpacing: 0.5
        }
    ];

    if (invoice.message) {
        content.push({
            text: invoice.message,
            fontSize: 9,
            color: '#334155',
            margin: [0, 0, 0, 20],
            lineHeight: 1.4
        });
    }

    content.push({
        table: {
            headerRows: 1,
            widths: ['*', 70, 40, 75],
            body: tableBody
        },
        layout: {
            hLineWidth: (i: number, node: any) =>
                i === 0 || i === 1 || i === (node.table?.body?.length ?? 0) ? 1 : 0.5,
            vLineWidth: () => 0,
            hLineColor: (i: number, node: any) =>
                i === 0 || i === 1 || i === (node.table?.body?.length ?? 0) ? '#0f172a' : '#f1f5f9',
            paddingTop: () => 5,
            paddingBottom: () => 5,
            fillColor: (i: number) => (i === 0 ? '#f8fafc' : null)
        },
        margin: [0, 0, 0, 12]
    });

    // TOTALS
    const totalsBody: any[][] = [
        [
            { text: t.subtotal, color: '#64748b', fontSize: 9 },
            { text: formatCurrency(subtotal, currency, locale), alignment: 'right', fontSize: 9 }
        ]
    ];

    if (discountTotal > 0) {
        totalsBody.push([
            { text: t.discount, color: '#64748b', fontSize: 8.5 },
            {
                text: '-' + formatCurrency(discountTotal, currency, locale),
                alignment: 'right',
                color: '#166534',
                fontSize: 8.5
            }
        ]);
    }

    if (!isKleinunternehmer) {
        totalsBody.push([
            { text: t.net, bold: true, fontSize: 9 },
            {
                text: formatCurrency(netTotal, currency, locale),
                alignment: 'right',
                bold: true,
                fontSize: 9
            }
        ]);
        totalsBody.push([
            { text: t.plusVat, color: '#64748b', fontSize: 8 },
            { text: formatCurrency(vatTotal, currency, locale), alignment: 'right', fontSize: 8 }
        ]);
    }

    totalsBody.push([
        {
            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#0f172a' }],
            colSpan: 2,
            margin: [0, 6, 0, 6]
        },
        {}
    ]);

    totalsBody.push([
        {
            text: t.gross,
            bold: true,
            fontSize: 11,
            color: '#0f172a'
        },
        {
            text: formatCurrency(grossTotal, currency, locale),
            alignment: 'right',
            bold: true,
            fontSize: 13,
            color: '#0f172a'
        }
    ]);

    content.push({
        columns: [
            { width: '*', text: '' },
            {
                width: 180,
                table: {
                    widths: ['*', 'auto'],
                    body: totalsBody
                },
                layout: 'noBorders',
                margin: [0, 5, 0, 25]
            }
        ]
    });

    const footerStack: any[] = [];
    if (invoice.settings.paymentText) {
        footerStack.push({
            text: invoice.settings.paymentText,
            margin: [0, 0, 0, 10],
            color: '#0f172a',
            fontSize: 9,
            lineHeight: 1.3
        });
    }
    if (isKleinunternehmer && invoice.settings.taxNote) {
        footerStack.push({
            text: invoice.settings.taxNote,
            italics: true,
            color: '#64748b',
            fontSize: 7.5,
            margin: [0, 0, 0, 12]
        });
    }
    footerStack.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#f1f5f9' }],
        margin: [0, 10, 0, 10]
    });
    footerStack.push({
        columns: [
            {
                width: '*',
                stack: [
                    {
                        text: t.bank.toUpperCase(),
                        fontSize: 6.5,
                        bold: true,
                        color: '#94a3b8',
                        margin: [0, 0, 0, 2]
                    },
                    { text: invoice.sender.bankName || '-', fontSize: 7.5, color: '#1e293b' }
                ]
            },
            {
                width: '*',
                stack: [
                    { text: 'IBAN', fontSize: 6.5, bold: true, color: '#94a3b8', margin: [0, 0, 0, 2] },
                    { text: invoice.sender.iban || '-', fontSize: 7.5, color: '#1e293b' }
                ]
            },
            {
                width: '*',
                stack: [
                    { text: 'BIC', fontSize: 6.5, bold: true, color: '#94a3b8', margin: [0, 0, 0, 2] },
                    { text: invoice.sender.bic || '-', fontSize: 7.5, color: '#1e293b' }
                ]
            },
            {
                width: '*',
                stack: [
                    {
                        text: t.taxId.toUpperCase(),
                        fontSize: 6.5,
                        bold: true,
                        color: '#94a3b8',
                        margin: [0, 0, 0, 2]
                    },
                    { text: invoice.sender.taxId || '-', fontSize: 7.5, color: '#1e293b' },
                    invoice.sender.vatId
                        ? {
                            text: `USt-Id: ${invoice.sender.vatId}`,
                            fontSize: 7.5,
                            color: '#1e293b',
                            margin: [0, 1, 0, 0]
                        }
                        : { text: '', fontSize: 0 }
                ]
            }
        ]
    });

    content.push({ stack: footerStack, margin: [0, 5, 0, 0] });

    const docDefinition: TDocumentDefinitions = {
        info: {
            title: `${t.title} ${invoice.number}`,
            author: invoice.sender.company || invoice.sender.name,
            creator: 'Rechnungs-Ersteller'
        },
        pageMargins: [45, 35, 45, 35],
        content: content,
        styles: {
            tableHeader: { bold: true, fontSize: 7.5, color: '#0f172a', margin: [0, 3, 0, 3] }
        },
        defaultStyle: { fontSize: 9, font: 'Roboto', color: '#1e293b', lineHeight: 1.2 }
    };

    const pdfDocGenerator = pdfMakeInstance.createPdf(docDefinition);
    let pdfMakeBuffer: ArrayBuffer;
    try {
        const generator = pdfDocGenerator as any;
        if (typeof generator.getBuffer === 'function') {
            const result = generator.getBuffer();
            if (result instanceof Promise) {
                pdfMakeBuffer = toArrayBuffer(await result);
            } else {
                pdfMakeBuffer = await new Promise((resolve, reject) => {
                    generator.getBuffer((buffer: any) => {
                        resolve(toArrayBuffer(buffer));
                    });
                    setTimeout(() => reject(new Error('PDF Buffer generation timeout (10s)')), 10000);
                });
            }
        } else if (typeof generator.getBlob === 'function') {
            const blob = await generator.getBlob();
            pdfMakeBuffer = await blob.arrayBuffer();
        } else {
            throw new Error('No supported buffer/blob method found on pdfDocGenerator');
        }
    } catch (error) {
        console.error(`[Generator] Error getting buffer for ${invoice.number}:`, error);
        throw error;
    }

    if (previewOnly) {
        return pdfMakeBuffer;
    }

    const pdfDoc = await PDFDocument.load(pdfMakeBuffer);
    const xmlString = generateZugferdXml(invoice);
    const xmlBytes = new TextEncoder().encode(xmlString);
    await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
        mimeType: 'text/xml',
        description: 'Factur-X Invoice',
        creationDate: new Date(),
        modificationDate: new Date()
    });
    const finalPdfBytes = await pdfDoc.save();
    return toArrayBuffer(finalPdfBytes);
}
