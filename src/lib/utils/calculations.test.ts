import { describe, it, expect } from 'vitest';
import {
	calculateArticleTotal,
	calculateSubtotal,
	calculateDiscountTotal,
	calculateNetTotal,
	calculateVat,
	calculateGrossTotal
} from './calculations';
import type { Article, Discount } from '../types';

describe('Calculations', () => {
	const articles: Article[] = [
		{ id: '1', description: 'Item 1', pricePerUnit: 100, amount: 2 }, // 200
		{ id: '2', description: 'Item 2', pricePerUnit: 50, amount: 1 } // 50
	];

	const discounts: Discount[] = [{ id: '1', description: 'Loyalty', amount: 20 }];

	it('calculates article total correctly', () => {
		expect(calculateArticleTotal(articles[0])).toBe(200);
	});

	it('calculates subtotal correctly', () => {
		expect(calculateSubtotal(articles)).toBe(250);
	});

	it('calculates discount total correctly', () => {
		expect(calculateDiscountTotal(discounts)).toBe(20);
	});

	it('calculates net total correctly', () => {
		expect(calculateNetTotal(articles, discounts)).toBe(230);
	});

	it('calculates VAT correctly (19%)', () => {
		const net = 100;
		expect(calculateVat(net, 19)).toBe(19);
	});

	it('calculates gross total correctly', () => {
		const net = 100;
		const vat = 19;
		expect(calculateGrossTotal(net, vat)).toBe(119);
	});
});
