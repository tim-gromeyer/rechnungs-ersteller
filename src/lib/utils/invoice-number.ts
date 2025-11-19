// Generate invoice number in format YYYY-MM-<number>
export function generateInvoiceNumber(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');

	// Get invoice count for this month from localStorage
	const key = `invoice-count-${year}-${month}`;
	const count = parseInt(localStorage.getItem(key) || '0', 10) + 1;

	// Save new count
	localStorage.setItem(key, count.toString());

	return `${year}-${month}-${count}`;
}

// Reset counter for testing
export function resetInvoiceCounter() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const key = `invoice-count-${year}-${month}`;
	localStorage.removeItem(key);
}
