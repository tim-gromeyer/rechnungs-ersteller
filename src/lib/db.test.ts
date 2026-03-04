import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import 'fake-indexeddb/auto';
import { db } from './db';
import type { Expense, Receipt } from './types';

describe('db.ts IndexedDB Wrapper', () => {
	beforeEach(async () => {
		// Initialize or clean DB if necessary, fake-indexeddb keeps state between tests
	});

	afterEach(async () => {
		db.closeDB(); // Close open connections before deleting the db
		const req = indexedDB.deleteDatabase('invoice-creator-db');
		await new Promise((resolve) => {
			req.onsuccess = resolve;
			req.onerror = resolve; // ignore errors on delete
			// Handle blocked state to prevent hanging if another connection is open
			req.onblocked = resolve;
		});
	});

	it('should save and retrieve an expense', async () => {
		const expense: Expense = {
			id: 'exp-1',
			date: '2026-03-03',
			amount: 50.0,
			description: 'Test Expense',
			category: 'Tests'
		};

		await db.saveExpense(expense);
		const expenses = await db.getAllExpenses();

		expect(expenses).toHaveLength(1);
		expect(expenses[0]).toEqual(expense);
	});

	it('should delete an expense', async () => {
		const expense: Expense = {
			id: 'exp-2',
			date: '2026-03-04',
			amount: 100.0,
			description: 'To Delete',
			category: 'Tests'
		};

		await db.saveExpense(expense);
		await db.deleteExpense('exp-2');

		const expenses = await db.getAllExpenses();
		expect(expenses).toHaveLength(0);
	});

	it('should save, retrieve and delete a receipt', async () => {
		const receipt: Receipt = {
			id: 'rec-1',
			fileName: 'test.png',
			fileType: 'image/png',
			fileData: new Blob(['test content'], { type: 'image/png' })
		};

		await db.saveReceipt(receipt);

		const fetched = await db.getReceipt('rec-1');
		expect(fetched).toEqual(receipt);

		await db.deleteReceipt('rec-1');
		const fetchedAfterDelete = await db.getReceipt('rec-1');
		expect(fetchedAfterDelete).toBeUndefined();
	});

	it('should retrieve all expenses', async () => {
		const exp1: Expense = {
			id: '1',
			date: '2026-01-01',
			amount: 10,
			description: 'A',
			category: 'C'
		};
		const exp2: Expense = {
			id: '2',
			date: '2026-01-02',
			amount: 20,
			description: 'B',
			category: 'C'
		};

		await db.saveExpense(exp1);
		await db.saveExpense(exp2);

		const all = await db.getAllExpenses();
		expect(all).toHaveLength(2);
		expect(all.find((e) => e.id === '1')).toEqual(exp1);
		expect(all.find((e) => e.id === '2')).toEqual(exp2);
	});
});
