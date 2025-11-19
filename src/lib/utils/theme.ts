export function getInitialTheme(): string {
	if (typeof window === 'undefined') return 'light';

	// Check localStorage first
	const stored = localStorage.getItem('theme');
	if (stored) return stored;

	// Fall back to browser preference
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return prefersDark ? 'dim' : 'light';
}

export function setTheme(theme: string) {
	if (typeof window === 'undefined') return;

	localStorage.setItem('theme', theme);
	const html = document.documentElement;
	html.setAttribute('data-theme', theme);

	// Force a reflow to ensure the theme is applied
	void html.offsetHeight;
}

export function watchSystemTheme(callback: (isDark: boolean) => void) {
	if (typeof window === 'undefined') return () => {};

	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handler = (e: MediaQueryListEvent) => callback(e.matches);

	mediaQuery.addEventListener('change', handler);
	return () => mediaQuery.removeEventListener('change', handler);
}
