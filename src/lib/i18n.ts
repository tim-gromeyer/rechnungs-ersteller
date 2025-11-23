import { localizeHref, getLocale } from '$lib/paraglide/runtime';

export const i18n = {
	resolveRoute: (path: string, locale: string) => {
		return localizeHref(path, { locale });
	},
	route: (path: string) => {
		return localizeHref(path, { locale: getLocale() });
	},
	getLanguageTag: getLocale
};
