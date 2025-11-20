import type { Invoice } from '../types';
import {
	calculateArticleTotal,
	calculateNetTotal,
	calculateVat,
	calculateGrossTotal
} from './calculations';
import { js2xml } from 'xml-js';
import type { Element } from 'xml-js';

// Helper to create a simple element with text
const el = (name: string, text: string | number, attributes?: Record<string, string>): Element => ({
	type: 'element',
	name,
	attributes,
	elements: [{ type: 'text', text: String(text) }]
});

// Helper to create a container element with children
const container = (
	name: string,
	elements: (Element | undefined)[],
	attributes?: Record<string, string>
): Element => ({
	type: 'element',
	name,
	attributes,
	elements: elements.filter((e): e is Element => e !== undefined)
});

export function generateZugferdXml(invoice: Invoice): string {
	const { sender, customer, articles, discounts, settings, number, date, paymentDate, message } =
		invoice;

	const netTotal = calculateNetTotal(articles, discounts);
	const vatTotal = calculateVat(netTotal, settings.vatRate);
	const grossTotal = calculateGrossTotal(netTotal, vatTotal);

	const currency = settings.currency;
	const issueDateStr = date.replace(/-/g, '');
	const dueDateStr = paymentDate.replace(/-/g, '');

	const json: Element = container(
		'rsm:CrossIndustryInvoice',
		[
			container('rsm:ExchangedDocumentContext', [
				container('ram:GuidelineSpecifiedDocumentContextParameter', [
					el('ram:ID', 'urn:cen.eu:en16931:2017')
				])
			]),
			container('rsm:ExchangedDocument', [
				container('ram:IncludedNote', [el('ram:Content', message || '')]),
				el('ram:ID', number),
				el('ram:TypeCode', 380),
				container('ram:IssueDateTime', [el('udt:DateTimeString', issueDateStr, { format: '102' })])
			]),
			container('rsm:SupplyChainTradeTransaction', [
				container('ram:ApplicableHeaderTradeAgreement', [
					container('ram:SellerTradeParty', [
						el('ram:Name', sender.company || sender.name),
						container('ram:PostalTradeAddress', [
							el('ram:PostcodeCode', sender.zip),
							el('ram:LineOne', sender.street),
							el('ram:CityName', sender.city),
							el('ram:CountryID', sender.country || 'DE')
						]),
						sender.taxId
							? container('ram:SpecifiedTaxRegistration', [
									el('ram:ID', sender.taxId, { schemeID: 'FC' })
								])
							: undefined,
						sender.vatId
							? container('ram:SpecifiedTaxRegistration', [
									el('ram:ID', sender.vatId, { schemeID: 'VA' })
								])
							: undefined
					]),
					container('ram:BuyerTradeParty', [
						el('ram:Name', customer.company || customer.name),
						container('ram:PostalTradeAddress', [
							el('ram:PostcodeCode', customer.zip),
							el('ram:LineOne', customer.street),
							el('ram:CityName', customer.city),
							el('ram:CountryID', customer.country || 'DE')
						])
					])
				]),
				container('ram:ApplicableHeaderTradeSettlement', [
					el('ram:InvoiceCurrencyCode', currency),
					container('ram:ApplicableTradeTax', [
						el('ram:CalculatedAmount', vatTotal.toFixed(2)),
						el('ram:TypeCode', 'VAT'),
						el('ram:BasisAmount', netTotal.toFixed(2)),
						el('ram:CategoryCode', 'S'),
						el('ram:RateApplicablePercent', settings.vatRate)
					]),
					container('ram:SpecifiedTradeSettlementHeaderMonetarySummation', [
						el('ram:LineTotalAmount', netTotal.toFixed(2)), // Correct: Sum of line net amounts
						el('ram:ChargeTotalAmount', '0.00'),
						el('ram:AllowanceTotalAmount', '0.00'), // Note: Discounts are handled as negative lines
						el('ram:TaxBasisTotalAmount', netTotal.toFixed(2)),
						el('ram:TaxTotalAmount', vatTotal.toFixed(2), { currencyID: currency }),
						el('ram:GrandTotalAmount', grossTotal.toFixed(2)),
						el('ram:TotalPrepaidAmount', '0.00'),
						el('ram:DuePayableAmount', grossTotal.toFixed(2))
					]),
					container('ram:SpecifiedTradePaymentTerms', [
						container('ram:DueDateDateTime', [
							el('udt:DateTimeString', dueDateStr, { format: '102' })
						])
					])
				]),
				...articles.map((article, index) =>
					container('ram:IncludedSupplyChainTradeLineItem', [
						container('ram:AssociatedDocumentLineDocument', [el('ram:LineID', index + 1)]),
						container('ram:SpecifiedTradeProduct', [el('ram:Name', article.description)]),
						container('ram:SpecifiedLineTradeAgreement', [
							container('ram:NetPriceProductTradePrice', [
								el('ram:ChargeAmount', article.pricePerUnit.toFixed(4))
							])
						]),
						container('ram:SpecifiedLineTradeDelivery', [
							el('ram:BilledQuantity', article.amount, { unitCode: 'H87' })
						]),
						container('ram:SpecifiedLineTradeSettlement', [
							container('ram:ApplicableTradeTax', [
								el('ram:TypeCode', 'VAT'),
								el('ram:CategoryCode', 'S'),
								el('ram:RateApplicablePercent', settings.vatRate)
							]),
							container('ram:SpecifiedTradeSettlementLineMonetarySummation', [
								el('ram:LineTotalAmount', calculateArticleTotal(article).toFixed(2))
							])
						])
					])
				),
				...discounts.map((discount, index) =>
					container('ram:IncludedSupplyChainTradeLineItem', [
						container('ram:AssociatedDocumentLineDocument', [
							el('ram:LineID', articles.length + index + 1)
						]),
						container('ram:SpecifiedTradeProduct', [el('ram:Name', discount.description)]),
						container('ram:SpecifiedLineTradeAgreement', [
							// Represent discount as a negative charge on the net price
							container('ram:NetPriceProductTradePrice', [
								el('ram:ChargeAmount', (-discount.amount).toFixed(4))
							])
						]),
						container('ram:SpecifiedLineTradeDelivery', [
							el('ram:BilledQuantity', 1, { unitCode: 'H87' }) // Quantity is 1 for a discount line
						]),
						container('ram:SpecifiedLineTradeSettlement', [
							container('ram:ApplicableTradeTax', [
								el('ram:TypeCode', 'VAT'),
								el('ram:CategoryCode', 'S'),
								// Discounts usually have the same tax rate applied as the items
								el('ram:RateApplicablePercent', settings.vatRate)
							]),
							container('ram:SpecifiedTradeSettlementLineMonetarySummation', [
								el('ram:LineTotalAmount', (-discount.amount).toFixed(2))
							])
						])
					])
				)
			])
		],
		{
			'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
			'xmlns:qdt': 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
			'xmlns:ram':
				'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
			'xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
			'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100'
		}
	);

	return js2xml({ elements: [json] }, { compact: false, spaces: 2 });
}
