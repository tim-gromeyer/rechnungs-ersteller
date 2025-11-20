<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import {
		calculateArticleTotal,
		calculateSubtotal,
		calculateDiscountTotal,
		calculateNetTotal,
		calculateVat,
		calculateGrossTotal,
		formatCurrency,
		formatDate
	} from '$lib/utils/calculations';

	// Create a reactive reference to the invoice
	let invoice = $derived(invoiceState.invoice);

	// Derived calculations
	let subtotal = $derived(calculateSubtotal(invoice.articles));
	let discountTotal = $derived(calculateDiscountTotal(invoice.discounts));
	let netTotal = $derived(calculateNetTotal(invoice.articles, invoice.discounts));
	let vatTotal = $derived(calculateVat(netTotal, invoice.settings.vatRate));
	let grossTotal = $derived(calculateGrossTotal(netTotal, vatTotal));
</script>

<div
	class="invoice-preview mx-auto flex min-h-[297mm] w-[210mm] flex-shrink-0 flex-col bg-white px-[15mm] py-[10mm] font-sans text-[11px] leading-tight text-black shadow-xl ring-1 ring-black/5 print:m-0 print:min-h-0 print:w-full print:shadow-none print:ring-0"
>
	<!-- Header / Logo -->
	<div class="mb-4 flex items-start justify-between">
		<div class="text-[9px] text-gray-600">
			<!-- Return Address Line -->
			<div class="w-max">
				<p class="mb-0.5">
					{invoice.sender.name} • {invoice.sender.street} • {invoice.sender.zip}
					{invoice.sender.city}
				</p>
				<div class="mb-2 h-px bg-gray-300"></div>
			</div>

			<!-- Recipient Address -->
			<div class="mt-4 text-[11px] text-black">
				{#if invoice.customer.company}
					<div class="font-semibold">{invoice.customer.company}</div>
				{/if}
				<div>{invoice.customer.name}</div>
				<div>{invoice.customer.street}</div>
				<div>{invoice.customer.zip} {invoice.customer.city}</div>
			</div>
		</div>

		{#if invoice.settings.logoPath}
			<img src={invoice.settings.logoPath} alt="Logo" class="h-14 object-contain" />
		{:else}
			<div class="text-lg font-bold text-gray-800">
				{invoice.sender.company || invoice.sender.name}
			</div>
		{/if}
	</div>

	<!-- Sender Info Block -->
	<div class="mb-6 flex justify-end">
		<div class="space-y-0.5 text-right text-[9px] text-gray-600">
			<div>
				<strong class="text-gray-800">{invoice.sender.company || invoice.sender.name}</strong>
			</div>
			<div>{invoice.sender.street} • {invoice.sender.zip} {invoice.sender.city}</div>
			{#if invoice.sender.email || invoice.sender.phone}
				<div>{invoice.sender.email}{invoice.sender.phone ? ' • ' + invoice.sender.phone : ''}</div>
			{/if}
			{#if invoice.sender.website}<div>{invoice.sender.website}</div>{/if}
			{#if invoice.sender.taxId}<div class="pt-0.5">Steuernr.: {invoice.sender.taxId}</div>{/if}
			<div class="pt-1"></div>
			<div>
				Datum: <strong>{formatDate(invoice.date, invoice.settings.locale)}</strong> • Nr.:
				<strong>{invoice.number}</strong>
			</div>
			<div>
				Leistung: <strong>{formatDate(invoice.serviceDate, invoice.settings.locale)}</strong>
			</div>
		</div>
	</div>

	<!-- Title -->
	<h1 class="mb-3 text-lg font-bold text-gray-900">Rechnung</h1>

	<div>
		<!-- Message -->
		{#if invoice.message}
			<p class="mb-3 text-[10px] text-gray-700">{invoice.message}</p>
		{/if}

		<!-- Articles Table -->
		<table class="mb-3 w-full border-collapse text-left text-[10px]">
			<thead>
				<tr class="border-b border-gray-900">
					<th class="w-1/2 py-1 text-[10px] font-semibold text-gray-700">Bezeichnung</th>
					<th class="py-1 text-right text-[10px] font-semibold text-gray-700">Preis</th>
					<th class="py-1 text-right text-[10px] font-semibold text-gray-700">Menge</th>
					<th class="py-1 text-right text-[10px] font-semibold text-gray-700">Betrag</th>
				</tr>
			</thead>
			<tbody>
				{#each invoice.articles as article (article.id)}
					<tr class="border-b border-gray-100">
						<td class="py-1">
							<div class="font-medium text-gray-900">{article.description}</div>
							{#if article.summary}
								<div class="text-[9px] text-gray-500">{article.summary}</div>
							{/if}
						</td>
						<td class="py-1 text-right text-gray-700"
							>{formatCurrency(
								article.pricePerUnit,
								invoice.settings.currency,
								invoice.settings.locale
							)}</td
						>
						<td class="py-1 text-right text-gray-700">{article.amount}</td>
						<td class="py-1 text-right font-medium text-gray-900"
							>{formatCurrency(
								calculateArticleTotal(article),
								invoice.settings.currency,
								invoice.settings.locale
							)}</td
						>
					</tr>
				{/each}
				{#each invoice.discounts as discount (discount.id)}
					<tr class="border-b border-gray-100">
						<td class="py-1 text-green-700">{discount.description}</td>
						<td class="py-1 text-right text-gray-400">-</td>
						<td class="py-1 text-right text-gray-400">-</td>
						<td class="py-1 text-right font-medium text-green-700"
							>-{formatCurrency(
								discount.amount,
								invoice.settings.currency,
								invoice.settings.locale
							)}</td
						>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr>
					<td colspan="2" class="py-0.5 text-gray-700">Zwischensumme</td>
					<td colspan="2" class="py-0.5 text-right text-gray-700"
						>{formatCurrency(subtotal, invoice.settings.currency, invoice.settings.locale)}</td
					>
				</tr>
				{#if discountTotal > 0}
					<tr>
						<td colspan="2" class="py-0.5 text-gray-700">Rabatt</td>
						<td colspan="2" class="py-0.5 text-right text-green-700"
							>-{formatCurrency(
								discountTotal,
								invoice.settings.currency,
								invoice.settings.locale
							)}</td
						>
					</tr>
				{/if}
				<tr class="border-t border-gray-900">
					<td colspan="2" class="py-1 text-gray-700">Netto</td>
					<td colspan="2" class="py-1 text-right font-medium text-gray-900"
						>{formatCurrency(netTotal, invoice.settings.currency, invoice.settings.locale)}</td
					>
				</tr>
				<tr>
					<td colspan="2" class="py-0.5 text-gray-700">zzgl. MwSt. {invoice.settings.vatRate}%</td>
					<td colspan="2" class="py-0.5 text-right text-gray-700"
						>{formatCurrency(vatTotal, invoice.settings.currency, invoice.settings.locale)}</td
					>
				</tr>
				<tr class="font-bold">
					<td colspan="2" class="py-1 text-gray-900">Brutto</td>
					<td colspan="2" class="py-1 text-right text-sm text-gray-900"
						>{formatCurrency(grossTotal, invoice.settings.currency, invoice.settings.locale)}</td
					>
				</tr>
			</tfoot>
		</table>

		<!-- Payment Info -->
		<div class="mt-4 text-[10px] text-gray-700 print:break-inside-avoid">
			{#if invoice.settings.paymentText}
				<p class="mb-2">{invoice.settings.paymentText}</p>
			{/if}

			<!-- Tax Note (only if VAT is 0 and taxNote is set) -->
			{#if invoice.settings.vatRate === 0 && invoice.settings.taxNote}
				<p class="mb-2 text-[9px] italic text-gray-600">
					{invoice.settings.taxNote}
				</p>
			{/if}

			{#if invoice.sender.bankName || invoice.sender.iban}
				<div class="mt-3 text-[9px] text-gray-600">
					{#if invoice.sender.bankName}<div>Bank: {invoice.sender.bankName}</div>{/if}
					{#if invoice.sender.iban}<div>IBAN: {invoice.sender.iban}</div>{/if}
					{#if invoice.sender.bic}<div>BIC: {invoice.sender.bic}</div>{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
