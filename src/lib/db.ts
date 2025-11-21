import type { Invoice } from './types';

const DB_NAME = 'invoice-creator-db';
const DB_VERSION = 1;
const STORE_INVOICES = 'invoices';
const STORE_SETTINGS = 'settings';

export const db = {
    async initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(STORE_INVOICES)) {
                    db.createObjectStore(STORE_INVOICES, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                    db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
                }
            };
        });
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
    }
};
