import type { Article, Discount } from '../types';

export function calculateArticleTotal(article: Article): number {
	return article.pricePerUnit * article.amount;
}

export function calculateSubtotal(articles: Article[]): number {
	return articles.reduce((sum, article) => sum + calculateArticleTotal(article), 0);
}

export function calculateDiscountTotal(discounts: Discount[]): number {
	return discounts.reduce((sum, discount) => sum + discount.amount, 0);
}

export function calculateNetTotal(articles: Article[], discounts: Discount[]): number {
	const subtotal = calculateSubtotal(articles);
	const discountTotal = calculateDiscountTotal(discounts);
	return Math.max(0, subtotal - discountTotal);
}

export function calculateVat(netTotal: number, vatRate: number): number {
	return netTotal * (vatRate / 100);
}

export function calculateGrossTotal(netTotal: number, vatTotal: number): number {
	return netTotal + vatTotal;
}

export function formatCurrency(
	amount: number,
	currency: string = 'EUR',
	locale: string = 'de-DE'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

export function formatDate(dateString: string, locale: string = 'de-DE'): string {
	if (!dateString || dateString === 'today') {
		return new Date().toLocaleDateString(locale);
	}
	const date = new Date(dateString);
	return isNaN(date.getTime()) ? dateString : date.toLocaleDateString(locale);
}
