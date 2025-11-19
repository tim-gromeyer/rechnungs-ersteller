import type { Invoice } from '../types';
import {
	calculateArticleTotal,
	calculateNetTotal,
	calculateVat,
	calculateGrossTotal
} from './calculations';

export function generateZugferdXml(invoice: Invoice): string {
	const { sender, customer, articles, discounts, settings, number, date, paymentDate, message } =
		invoice;

	const netTotal = calculateNetTotal(articles, discounts);
	const vatTotal = calculateVat(netTotal, settings.vatRate);
	const grossTotal = calculateGrossTotal(netTotal, vatTotal);

	const currency = settings.currency === '€' ? 'EUR' : settings.currency;
	const issueDateStr = date.replace(/-/g, ''); // YYYYMMDD
	const dueDateStr = paymentDate.replace(/-/g, ''); // YYYYMMDD

	const lines: string[] = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');
	lines.push(
		'<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">'
	);

	// Context
	lines.push('  <rsm:ExchangedDocumentContext>');
	lines.push('    <ram:GuidelineSpecifiedDocumentContextParameter>');
	lines.push('      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>');
	lines.push('    </ram:GuidelineSpecifiedDocumentContextParameter>');
	lines.push('  </rsm:ExchangedDocumentContext>');

	// Document Header
	lines.push('  <rsm:ExchangedDocument>');
	lines.push('    <ram:IncludedNote>');
	lines.push(`      <ram:Content>${message || ''}</ram:Content>`);
	lines.push('    </ram:IncludedNote>');
	lines.push(`    <ram:ID>${number}</ram:ID>`);
	lines.push('    <ram:TypeCode>380</ram:TypeCode>');
	lines.push('    <ram:IssueDateTime>');
	lines.push(`      <udt:DateTimeString format="102">${issueDateStr}</udt:DateTimeString>`);
	lines.push('    </ram:IssueDateTime>');
	lines.push('  </rsm:ExchangedDocument>');

	// Transaction
	lines.push('  <rsm:SupplyChainTradeTransaction>');

	// Seller (Sender)
	lines.push('    <ram:ApplicableHeaderTradeAgreement>');
	lines.push('      <ram:SellerTradeParty>');
	lines.push('        <ram:ID></ram:ID>');
	lines.push('        <ram:GlobalID schemeID="0088"></ram:GlobalID>');
	lines.push(`        <ram:Name>${sender.company || sender.name}</ram:Name>`);
	lines.push('        <ram:PostalTradeAddress>');
	lines.push(`          <ram:PostcodeCode>${sender.zip}</ram:PostcodeCode>`);
	lines.push(`          <ram:LineOne>${sender.street}</ram:LineOne>`);
	lines.push(`          <ram:CityName>${sender.city}</ram:CityName>`);
	lines.push('          <ram:CountryID>DE</ram:CountryID>'); // Assuming DE for now
	lines.push('        </ram:PostalTradeAddress>');
	if (sender.taxId) {
		lines.push('        <ram:SpecifiedTaxRegistration>');
		lines.push(`          <ram:ID schemeID="FC">${sender.taxId}</ram:ID>`);
		lines.push('        </ram:SpecifiedTaxRegistration>');
	}
	if (sender.vatId) {
		lines.push('        <ram:SpecifiedTaxRegistration>');
		lines.push(`          <ram:ID schemeID="VA">${sender.vatId}</ram:ID>`);
		lines.push('        </ram:SpecifiedTaxRegistration>');
	}
	lines.push('      </ram:SellerTradeParty>');

	// Buyer (Customer)
	lines.push('      <ram:BuyerTradeParty>');
	lines.push('        <ram:ID></ram:ID>');
	lines.push(`        <ram:Name>${customer.company || customer.name}</ram:Name>`);
	lines.push('        <ram:PostalTradeAddress>');
	lines.push(`          <ram:PostcodeCode>${customer.zip}</ram:PostcodeCode>`);
	lines.push(`          <ram:LineOne>${customer.street}</ram:LineOne>`);
	lines.push(`          <ram:CityName>${customer.city}</ram:CityName>`);
	lines.push('          <ram:CountryID>DE</ram:CountryID>'); // Assuming DE
	lines.push('        </ram:PostalTradeAddress>');
	lines.push('      </ram:BuyerTradeParty>');
	lines.push('    </ram:ApplicableHeaderTradeAgreement>');

	// Settlement
	lines.push('    <ram:ApplicableHeaderTradeSettlement>');
	lines.push(`      <ram:InvoiceCurrencyCode>${currency}</ram:InvoiceCurrencyCode>`);

	// Tax
	lines.push('      <ram:ApplicableTradeTax>');
	lines.push(`        <ram:CalculatedAmount>${vatTotal.toFixed(2)}</ram:CalculatedAmount>`);
	lines.push('        <ram:TypeCode>VAT</ram:TypeCode>');
	lines.push(`        <ram:BasisAmount>${netTotal.toFixed(2)}</ram:BasisAmount>`);
	lines.push('        <ram:CategoryCode>S</ram:CategoryCode>');
	lines.push(`        <ram:RateApplicablePercent>${settings.vatRate}</ram:RateApplicablePercent>`);
	lines.push('      </ram:ApplicableTradeTax>');

	// Totals
	lines.push('      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>');
	lines.push(`        <ram:LineTotalAmount>${grossTotal.toFixed(2)}</ram:LineTotalAmount>`); // This might need to be net sum of lines? Python script puts gross here? No, standard says LineTotalAmount is sum of line net amounts.
	// Correction: Python script puts gross in LineTotalAmount?
	// Python: <ram:LineTotalAmount>" + str(sum_brutto) + "</ram:LineTotalAmount>
	// That seems wrong for ZUGFeRD. LineTotalAmount is usually Sum of (Quantity * NetPrice).
	// However, I should stick to the Python logic for now to ensure parity, or fix it if it's clearly wrong.
	// Let's look at Python again:
	// lines.append("        <ram:LineTotalAmount>" + str(sum_brutto) + "</ram:LineTotalAmount>\n")
	// lines.append("        <ram:TaxBasisTotalAmount>" + str(sum_netto) + "</ram:TaxBasisTotalAmount>\n")
	// lines.append("        <ram:GrandTotalAmount>" + str(sum_brutto) + "</ram:GrandTotalAmount>\n")
	// lines.append("        <ram:DuePayableAmount>" + str(sum_brutto) + "</ram:DuePayableAmount>\n")

	// I will follow the Python script for now to be safe, but this looks suspicious for LineTotalAmount.
	lines.push(`        <ram:LineTotalAmount>${grossTotal.toFixed(2)}</ram:LineTotalAmount>`);
	lines.push('        <ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>');
	lines.push('        <ram:AllowanceTotalAmount>0.00</ram:AllowanceTotalAmount>');
	lines.push(`        <ram:TaxBasisTotalAmount>${netTotal.toFixed(2)}</ram:TaxBasisTotalAmount>`);
	lines.push(
		`        <ram:TaxTotalAmount currencyID="${currency}">${vatTotal.toFixed(2)}</ram:TaxTotalAmount>`
	);
	lines.push(`        <ram:GrandTotalAmount>${grossTotal.toFixed(2)}</ram:GrandTotalAmount>`);
	lines.push('        <ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>');
	lines.push(`        <ram:DuePayableAmount>${grossTotal.toFixed(2)}</ram:DuePayableAmount>`);
	lines.push('      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>');

	// Payment Means
	lines.push('      <ram:SpecifiedTradeSettlementFinancialCard>');
	lines.push(`        <ram:ID schemeID="IBAN">${sender.iban || ''}</ram:ID>`);
	lines.push(`        <ram:CardholderName>${sender.company || sender.name}</ram:CardholderName>`);
	lines.push('      </ram:SpecifiedTradeSettlementFinancialCard>');

	lines.push('      <ram:SpecifiedTradeSettlementPaymentMeans>');
	lines.push('        <ram:TypeCode>58</ram:TypeCode>');
	lines.push('        <ram:Information>Zahlung per SEPA Überweisung.</ram:Information>');
	lines.push('        <ram:PayeePartyCreditorFinancialAccount>');
	lines.push(`          <ram:IBANID>${sender.iban || ''}</ram:IBANID>`);
	lines.push(`          <ram:AccountName>${sender.company || sender.name}</ram:AccountName>`);
	lines.push('        </ram:PayeePartyCreditorFinancialAccount>');
	lines.push('        <ram:PayeeSpecifiedCreditorFinancialInstitution>');
	lines.push(`          <ram:BICID>${sender.bic || ''}</ram:BICID>`);
	lines.push('        </ram:PayeeSpecifiedCreditorFinancialInstitution>');
	lines.push('      </ram:SpecifiedTradeSettlementPaymentMeans>');

	lines.push('      <ram:SpecifiedTradePaymentTerms>');
	lines.push('        <ram:DueDateDateTime>');
	lines.push(`          <udt:DateTimeString format="102">${dueDateStr}</udt:DateTimeString>`);
	lines.push('        </ram:DueDateDateTime>');
	lines.push('      </ram:SpecifiedTradePaymentTerms>');
	lines.push('    </ram:ApplicableHeaderTradeSettlement>');

	// Line Items
	lines.push('    <ram:IncludedSupplyChainTradeLineItem>');

	articles.forEach((article, index) => {
		const total = calculateArticleTotal(article);
		lines.push('      <ram:AssociatedDocumentLineDocument>');
		lines.push(`        <ram:LineID>${index + 1}</ram:LineID>`);
		lines.push('      </ram:AssociatedDocumentLineDocument>');
		lines.push('      <ram:SpecifiedTradeProduct>');
		lines.push(`        <ram:Name>${article.description}</ram:Name>`);
		lines.push('      </ram:SpecifiedTradeProduct>');
		lines.push('      <ram:SpecifiedLineTradeAgreement>');
		lines.push('        <ram:GrossPriceProductTradePrice>');
		lines.push(`          <ram:ChargeAmount>${article.pricePerUnit.toFixed(2)}</ram:ChargeAmount>`);
		lines.push('        </ram:GrossPriceProductTradePrice>');
		lines.push('        <ram:NetPriceProductTradePrice>');
		lines.push(`          <ram:ChargeAmount>${article.pricePerUnit.toFixed(2)}</ram:ChargeAmount>`);
		lines.push('        </ram:NetPriceProductTradePrice>');
		lines.push('      </ram:SpecifiedLineTradeAgreement>');
		lines.push('      <ram:SpecifiedLineTradeDelivery>');
		lines.push(`        <ram:BilledQuantity unitCode="H87">${article.amount}</ram:BilledQuantity>`);
		lines.push('      </ram:SpecifiedLineTradeDelivery>');
		lines.push('      <ram:SpecifiedLineTradeSettlement>');
		lines.push('        <ram:ApplicableTradeTax>');
		lines.push('          <ram:TypeCode>VAT</ram:TypeCode>');
		lines.push('          <ram:CategoryCode>S</ram:CategoryCode>');
		lines.push(
			`          <ram:RateApplicablePercent>${settings.vatRate}</ram:RateApplicablePercent>`
		);
		lines.push('        </ram:ApplicableTradeTax>');
		lines.push('        <ram:SpecifiedTradeSettlementLineMonetarySummation>');
		lines.push(`          <ram:LineTotalAmount>${total.toFixed(2)}</ram:LineTotalAmount>`);
		lines.push('        </ram:SpecifiedTradeSettlementLineMonetarySummation>');
		lines.push('      </ram:SpecifiedLineTradeSettlement>');
	});

	// Discounts as negative line items (following Python logic)
	discounts.forEach((discount, index) => {
		const lineId = articles.length + index + 1;
		lines.push('      <ram:AssociatedDocumentLineDocument>');
		lines.push(`        <ram:LineID>${lineId}</ram:LineID>`);
		lines.push('      </ram:AssociatedDocumentLineDocument>');
		lines.push('      <ram:SpecifiedTradeProduct>');
		lines.push(`        <ram:Name>${discount.description}</ram:Name>`);
		lines.push('      </ram:SpecifiedTradeProduct>');
		lines.push('      <ram:SpecifiedLineTradeAgreement>');
		lines.push('        <ram:GrossPriceProductTradePrice>');
		lines.push(`          <ram:ChargeAmount>-${discount.amount.toFixed(2)}</ram:ChargeAmount>`);
		lines.push('        </ram:GrossPriceProductTradePrice>');
		lines.push('        <ram:NetPriceProductTradePrice>');
		lines.push(`          <ram:ChargeAmount>-${discount.amount.toFixed(2)}</ram:ChargeAmount>`);
		lines.push('        </ram:NetPriceProductTradePrice>');
		lines.push('      </ram:SpecifiedLineTradeAgreement>');
		lines.push('      <ram:SpecifiedLineTradeSettlement>');
		lines.push('        <ram:ApplicableTradeTax>');
		lines.push('          <ram:TypeCode>VAT</ram:TypeCode>');
		lines.push('          <ram:CategoryCode>S</ram:CategoryCode>');
		lines.push(
			`          <ram:RateApplicablePercent>${settings.vatRate}</ram:RateApplicablePercent>`
		);
		lines.push('        </ram:ApplicableTradeTax>');
		lines.push('        <ram:SpecifiedTradeSettlementLineMonetarySummation>');
		lines.push(
			`          <ram:LineTotalAmount>-${discount.amount.toFixed(2)}</ram:LineTotalAmount>`
		);
		lines.push('        </ram:SpecifiedTradeSettlementLineMonetarySummation>');
		lines.push('      </ram:SpecifiedLineTradeSettlement>');
	});

	lines.push('    </ram:IncludedSupplyChainTradeLineItem>');
	lines.push('  </rsm:SupplyChainTradeTransaction>');
	lines.push('</rsm:CrossIndustryInvoice>');

	return lines.join('\n');
}
