<script lang="ts">
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages';
	import { i18n } from '$lib/i18n';
	import {
		LayoutDashboard,
		FileText,
		Receipt,
		Settings,
		Github,
		Menu,
		X,
		ChevronLeft
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { isCollapsed = $bindable(false) } = $props();
	let isOpen = $state(false);

	const navItems = [
		{ href: '/dashboard', label: () => m.common_dashboard(), icon: LayoutDashboard },
		{ href: '/invoices', label: () => m.common_invoices(), icon: FileText },
		{ href: '/expenses', label: () => m.common_expenses(), icon: Receipt },
		{ href: '/settings', label: () => m.common_settings(), icon: Settings }
	];

	function isActive(href: string) {
		return $page.url.pathname.includes(href);
	}

	function closeMobile() {
		isOpen = false;
	}

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}
</script>

<!-- Mobile Toggle -->
<div class="fixed top-4 left-4 z-50 lg:hidden">
	<Button
		variant="outline"
		size="icon"
		class="bg-card h-10 w-10 shadow-md"
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<X size={20} />
		{:else}
			<Menu size={20} />
		{/if}
	</Button>
</div>

<!-- Backdrop -->
{#if isOpen}
	<div
		role="button"
		tabindex="0"
		class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={closeMobile}
		onkeydown={(e) => e.key === 'Escape' && closeMobile()}
	></div>
{/if}

<!-- Sidebar -->
<aside
	class={cn(
		'bg-card fixed inset-y-0 left-0 z-[70] flex flex-col border-r transition-all duration-300 ease-in-out lg:translate-x-0',
		isOpen ? 'translate-x-0' : '-translate-x-full',
		isCollapsed ? 'lg:w-20' : 'lg:w-64',
		'w-64' // Mobile width is always fixed
	)}
>
	<div class="flex h-16 items-center justify-between border-b px-4">
		<a
			href="/"
			class={cn(
				'flex items-center gap-2 overflow-hidden transition-all duration-300',
				isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'
			)}
			onclick={closeMobile}
		>
			<span
				class="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl font-bold"
			>
				R
			</span>
			<span class="text-xl font-bold whitespace-nowrap">{m.meta_app_name()}</span>
		</a>
		{#if isCollapsed}
			<div
				class="bg-primary text-primary-foreground mx-auto hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl font-bold lg:flex"
			>
				R
			</div>
		{/if}
	</div>

	<nav class="flex-grow space-y-1 p-3">
		{#each navItems as item (item.href)}
			<a
				href={i18n.resolveRoute(item.href, i18n.getLanguageTag())}
				class={cn(
					'group relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200',
					isActive(item.href)
						? 'bg-primary text-primary-foreground shadow-md'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground',
					isCollapsed && 'lg:justify-center lg:px-0'
				)}
				onclick={closeMobile}
				title={isCollapsed ? item.label() : ''}
			>
				<item.icon size={22} class="shrink-0" />
				<span
					class={cn(
						'transition-all duration-300',
						isCollapsed ? 'lg:w-0 lg:scale-0 lg:opacity-0' : 'w-auto scale-100 opacity-100'
					)}
				>
					{item.label()}
				</span>

				{#if isCollapsed}
					<div
						class="bg-popover text-popover-foreground pointer-events-none absolute left-full ml-4 hidden rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block"
					>
						{item.label()}
					</div>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="mt-auto border-t p-3">
		<a
			href="https://github.com/tim-gromeyer/rechnungs-ersteller"
			target="_blank"
			rel="noopener noreferrer"
			class={cn(
				'text-muted-foreground hover:bg-muted hover:text-foreground group relative flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200',
				isCollapsed && 'lg:justify-center lg:px-0'
			)}
		>
			<Github size={22} class="shrink-0" />
			<span
				class={cn(
					'transition-all duration-300',
					isCollapsed ? 'lg:w-0 lg:scale-0 lg:opacity-0' : 'w-auto scale-100 opacity-100'
				)}
			>
				{m.common_github()}
			</span>
			{#if isCollapsed}
				<div
					class="bg-popover text-popover-foreground pointer-events-none absolute left-full ml-4 hidden rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block"
				>
					{m.common_github()}
				</div>
			{/if}
		</a>
	</div>

	<!-- Optimized Collapse Toggle - Desktop Only -->
	<button
		onclick={toggleCollapse}
		class={cn(
			'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-20 -right-3 z-50 hidden h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all lg:flex',
			isCollapsed && 'rotate-180'
		)}
		title={isCollapsed ? 'Ausklappen' : 'Einklappen'}
	>
		<ChevronLeft size={14} />
	</button>
</aside>
