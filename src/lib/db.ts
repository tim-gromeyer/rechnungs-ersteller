import type { Invoice, Expense, Receipt } from './types';

const DB_NAME = 'invoice-creator-db';
const DB_VERSION = 2; // Incremented for EÜR feature
const STORE_INVOICES = 'invoices';
const STORE_SETTINGS = 'settings';
const STORE_EXPENSES = 'expenses';
const STORE_RECEIPTS = 'receipts';

let dbInstance: IDBDatabase | null = null;

export const db = {
	async initDB(): Promise<IDBDatabase> {
		if (dbInstance) return dbInstance;
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				dbInstance = request.result;
				resolve(dbInstance);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(STORE_INVOICES)) {
					db.createObjectStore(STORE_INVOICES, { keyPath: 'id' });
				}

				if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
					db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
				}

				if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
					db.createObjectStore(STORE_EXPENSES, { keyPath: 'id' });
				}

				if (!db.objectStoreNames.contains(STORE_RECEIPTS)) {
					db.createObjectStore(STORE_RECEIPTS, { keyPath: 'id' });
				}
			};
		});
	},

	closeDB() {
		if (dbInstance) {
			dbInstance.close();
			dbInstance = null;
		}
	},

	async saveInvoice(invoice: Invoice): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_INVOICES, STORE_SETTINGS], 'readwrite');

			transaction.onerror = () => reject(transaction.error);
			transaction.oncomplete = () => resolve();

			const invoiceStore = transaction.objectStore(STORE_INVOICES);
			invoiceStore.put(invoice);

			const settingsStore = transaction.objectStore(STORE_SETTINGS);
			settingsStore.put({ key: 'lastInvoiceId', value: invoice.id });
		});
	},

	async loadLastActiveInvoice(): Promise<Invoice | null> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_INVOICES, STORE_SETTINGS], 'readonly');

			transaction.onerror = () => reject(transaction.error);

			const settingsStore = transaction.objectStore(STORE_SETTINGS);
			const settingsRequest = settingsStore.get('lastInvoiceId');

			settingsRequest.onsuccess = () => {
				const lastId = settingsRequest.result?.value;

				if (!lastId) {
					resolve(null);
					return;
				}

				const invoiceStore = transaction.objectStore(STORE_INVOICES);
				const invoiceRequest = invoiceStore.get(lastId);

				invoiceRequest.onsuccess = () => {
					resolve(invoiceRequest.result || null);
				};
			};
		});
	},

	async getAllInvoices(): Promise<Invoice[]> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_INVOICES, 'readonly');
			const store = transaction.objectStore(STORE_INVOICES);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	},

	async deleteInvoice(id: string): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_INVOICES, 'readwrite');
			const store = transaction.objectStore(STORE_INVOICES);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async getInvoice(id: string): Promise<Invoice | undefined> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_INVOICES, 'readonly');
			const store = transaction.objectStore(STORE_INVOICES);
			const request = store.get(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	},

	// --- Expenses CRUD ---

	async saveExpense(expense: Expense): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_EXPENSES, 'readwrite');
			const store = transaction.objectStore(STORE_EXPENSES);
			const request = store.put(expense);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async getAllExpenses(): Promise<Expense[]> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_EXPENSES, 'readonly');
			const store = transaction.objectStore(STORE_EXPENSES);
			const request = store.getAll();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	},

	async deleteExpense(id: string): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_EXPENSES, 'readwrite');
			const store = transaction.objectStore(STORE_EXPENSES);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	// --- Receipts CRUD ---

	async saveReceipt(receipt: Receipt): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_RECEIPTS, 'readwrite');
			const store = transaction.objectStore(STORE_RECEIPTS);
			const request = store.put(receipt);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async getReceipt(id: string): Promise<Receipt | undefined> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_RECEIPTS, 'readonly');
			const store = transaction.objectStore(STORE_RECEIPTS);
			const request = store.get(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	},

	async deleteReceipt(id: string): Promise<void> {
		const db = await this.initDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_RECEIPTS, 'readwrite');
			const store = transaction.objectStore(STORE_RECEIPTS);
			const request = store.delete(id);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	},

	async clearAllData(): Promise<void> {
		const db = await this.initDB();
		const storeNames = [STORE_INVOICES, STORE_EXPENSES, STORE_RECEIPTS, STORE_SETTINGS];
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(storeNames, 'readwrite');
			transaction.onerror = () => reject(transaction.error);
			transaction.oncomplete = () => resolve();

			storeNames.forEach((name) => {
				transaction.objectStore(name).clear();
			});
		});
	},

	async getStoreSizes(): Promise<Record<string, number>> {
		const db = await this.initDB();
		const storeNames = [STORE_INVOICES, STORE_EXPENSES, STORE_RECEIPTS];
		const sizes: Record<string, number> = {};

		for (const storeName of storeNames) {
			sizes[storeName] = await new Promise((resolve, reject) => {
				const transaction = db.transaction(storeName, 'readonly');
				const store = transaction.objectStore(storeName);
				const request = store.openCursor();
				let totalSize = 0;

				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						const value = cursor.value;
						if (storeName === STORE_RECEIPTS) {
							const receipt = value as Receipt;
							if (receipt.fileData) {
								totalSize += receipt.fileData.size;
							}
							if (receipt.dataUrl) {
								totalSize += receipt.dataUrl.length;
							}
						} else {
							// Estimate size for JSON objects
							totalSize += JSON.stringify(value).length;
						}
						cursor.continue();
					} else {
						resolve(totalSize);
					}
				};
				request.onerror = () => reject(request.error);
			});
		}

		return sizes;
	}
};
