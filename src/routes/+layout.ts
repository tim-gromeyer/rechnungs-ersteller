import '$lib/i18n';
import { waitLocale, locale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { invoiceState } from '$lib/state.svelte';

const supportedLocales = ['en', 'de'];
const defaultLocale = 'de';

export const load: LayoutLoad = async ({ data }) => {
	let currentLang = data.lang || defaultLocale;

	// Client-side detection for initial load or if data.lang is somehow missing
	if (browser && !data.lang) {
		let detectedLocale = defaultLocale;
		const match = document.cookie.match(/lang=([^;]+)/);
		const cookieLang = match ? match[1] : undefined;

		if (cookieLang && supportedLocales.includes(cookieLang)) {
			detectedLocale = cookieLang;
		} else {
			const acceptLanguageHeader = navigator.language || '';

			if (acceptLanguageHeader) {
				const preferredLanguages = acceptLanguageHeader
					.split(',')
					.map((l: string) => l.split(';')[0].trim())
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

	// Set the svelte-i18n locale
	if (currentLang) {
		locale.set(currentLang);
		invoiceState.updateLocale(currentLang);
	}

	await waitLocale();
	return { lang: currentLang };
};
