import type { RequestHandler } from './$types';

// Configuration
const SITE_URL = 'https://your-domain.com'; // TODO: Replace with your actual domain
const supportedLocales = ['en', 'de'];

// Define your static routes here
const staticRoutes = [
	'/', // Home page
	'/dashboard' // Dashboard page
	// Add more static routes as needed
];

// Function to generate dynamic routes (e.g., from database or CMS)
async function getDynamicRoutes(): Promise<string[]> {
	// Example: If you have invoices or other dynamic content
	// You could fetch IDs from your database here
	// For now, returning an empty array as an example

	// Example implementation:
	// const invoices = await db.query('SELECT id FROM invoices');
	// return invoices.map(invoice => `/invoices/${invoice.id}`);

	return [];
}

// Generate sitemap XML
function generateSitemap(routes: string[]): string {
	const urls = routes
		.map((route) => {
			// For each route, create entries for all supported locales
			return supportedLocales
				.map((locale) => {
					const url = `${SITE_URL}/${locale}${route}`;
					const lastmod = new Date().toISOString().split('T')[0]; // Current date

					return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
				})
				.join('');
		})
		.join('');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export const GET: RequestHandler = async () => {
	try {
		// Combine static and dynamic routes
		const dynamicRoutes = await getDynamicRoutes();
		const allRoutes = [...staticRoutes, ...dynamicRoutes];

		// Generate the sitemap XML
		const sitemap = generateSitemap(allRoutes);

		return new Response(sitemap, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'max-age=0, s-maxage=3600' // Cache for 1 hour
			}
		});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		return new Response('Error generating sitemap', { status: 500 });
	}
};
