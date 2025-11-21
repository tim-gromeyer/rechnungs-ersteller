import type { LayoutServerLoad } from './$types';

const supportedLocales = ['en', 'de'];
const defaultLocale = 'de';

export const load: LayoutServerLoad = async ({ params, request, cookies }) => {
	const { lang } = params;
	let currentLang = lang;

	// Only perform detection if lang param is not present
	if (!currentLang) {
		let detectedLocale = defaultLocale;
		const cookieLang = cookies.get('lang');

		if (cookieLang && supportedLocales.includes(cookieLang)) {
			detectedLocale = cookieLang;
		} else {
			const acceptLanguageHeader = request.headers.get('accept-language') || '';

			if (acceptLanguageHeader) {
				const preferredLanguages = acceptLanguageHeader
					.split(',')
					.map((l: string) => l.split(';')[0].trim()) // Explicitly type 'l' as string
					.filter(Boolean);

				for (const l of preferredLanguages) {
					const baseLang = l.split('-')[0];
					if (supportedLocales.includes(baseLang)) {
						detectedLocale = baseLang;
						break;
					}
				}
			}
		}
		currentLang = detectedLocale;
	}

	return { lang: currentLang };
};
