import { describe, it, expect } from 'bun:test';
import { parseGermanCurrency } from './calculations';

describe('calculations.ts', () => {
	it('should parse German currency strings', () => {
		expect(parseGermanCurrency('1.199,00')).toBe(1199.0);
		expect(parseGermanCurrency('1.199,50')).toBe(1199.5);
		expect(parseGermanCurrency('200,50')).toBe(200.5);
		expect(parseGermanCurrency('1.000,00')).toBe(1000.0);
		expect(parseGermanCurrency('0,50')).toBe(0.5);
		expect(parseGermanCurrency('')).toBe(0);
	});
});
