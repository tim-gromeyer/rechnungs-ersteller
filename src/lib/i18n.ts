import { localizeHref, getLocale, locales } from '$lib/paraglide/runtime';

export type AvailableLanguageTag = (typeof locales)[number];

export const i18n = {
	resolveRoute: (path: string, locale: string) => {
		return localizeHref(path, { locale: locale as AvailableLanguageTag });
	},
	route: (path: string) => {
		return localizeHref(path, { locale: getLocale() });
	},
	getLanguageTag: getLocale
};
