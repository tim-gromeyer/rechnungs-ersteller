<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { Plus, X, ChevronDown } from 'lucide-svelte';
	import { Accordion } from 'bits-ui';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Textarea from '$lib/components/ui/textarea';
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ArticleCard from './ArticleCard.svelte';
	import DiscountCard from './DiscountCard.svelte';
	import { t, locale } from 'svelte-i18n';

	// Don't destructure invoice - access it reactively through invoiceState
	const { addArticle, removeArticle, addDiscount, removeDiscount } = invoiceState;

	// Trigger validation whenever the invoice object or locale changes
	$effect(() => {
		// Track both invoice and locale changes
		void invoiceState.invoice;
		void $locale; // This makes the effect reactive to locale changes
		invoiceState.validateInvoice();
	});

	// Helper function to get error for a specific path
	function getError(path: string): string | undefined {
		if (!invoiceState.validationErrors) return undefined;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let currentError: any = invoiceState.validationErrors; // Start with the full error object

		const parts = path.split('.');
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (currentError && typeof currentError === 'object' && part in currentError) {
				currentError = currentError[part];
			} else {
				return undefined; // Path not found
			}
		}

		// At the end of the path, check for _errors
		if (
			currentError &&
			typeof currentError === 'object' &&
			'_errors' in currentError &&
			currentError._errors.length > 0
		) {
			return currentError._errors[0];
		}
		return undefined;
	}

	function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			invoiceState.invoice.settings.logoPath = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removeLogo() {
		invoiceState.invoice.settings.logoPath = undefined;
		const logoInput = document.getElementById('input-logo') as HTMLInputElement;
		if (logoInput) {
			logoInput.value = '';
		}
	}
</script>

<div class="space-y-6">
	<Accordion.Root type="multiple" class="space-y-4" value={['general', 'customer']}>
		<!-- General Settings -->
		<Accordion.Item
			value="general"
			class="border-border bg-card overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="hover:bg-accent/50 flex w-full items-center justify-between px-6 py-4 text-left transition-all"
				>
					<h3 class="text-card-foreground text-lg font-semibold">{$t('form.general')}</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pt-2 pb-6 md:grid-cols-2">
					<div class="space-y-2">
						<Label.Root for="input-invoice-number" class="text-foreground text-sm font-medium">
							{$t('form.invoiceNumber')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-invoice-number"
							bind:value={invoiceState.invoice.number}
							readonly
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-invoice-date" class="text-foreground text-sm font-medium">
							{$t('form.date')}
						</Label.Root>
						<Input.Root
							type="date"
							id="input-invoice-date"
							bind:value={invoiceState.invoice.date}
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-service-date" class="text-foreground text-sm font-medium">
							{$t('form.serviceDate')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-service-date"
							bind:value={invoiceState.invoice.serviceDate}
							placeholder="YYYY-MM-DD oder 'today'"
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-payment-days" class="text-foreground text-sm font-medium">
							{$t('form.paymentTerms')}
						</Label.Root>
						<Input.Root
							type="number"
							id="input-payment-days"
							bind:value={invoiceState.invoice.settings.paymentDays}
							class={getError('settings.paymentDays') ? 'border-destructive' : ''}
						/>
						{#if getError('settings.paymentDays')}
							<p class="text-destructive text-sm font-medium">
								{getError('settings.paymentDays')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-vat-rate" class="text-foreground text-sm font-medium">
							{$t('form.vatRate')}
						</Label.Root>
						<Input.Root
							type="number"
							id="input-vat-rate"
							bind:value={invoiceState.invoice.settings.vatRate}
							class={getError('settings.vatRate') ? 'border-destructive' : ''}
						/>
						{#if getError('settings.vatRate')}
							<p class="text-destructive text-sm font-medium">
								{getError('settings.vatRate')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-currency" class="text-foreground text-sm font-medium">
							{$t('form.currency')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-currency"
							bind:value={invoiceState.invoice.settings.currency}
						/>
					</div>

					<!-- Logo Upload -->
					<div class="space-y-2 md:col-span-2">
						<Label.Root for="input-logo" class="text-foreground text-sm font-medium"
							>{$t('form.logo')}</Label.Root
						>

						{#if invoiceState.invoice.settings.logoPath}
							<div class="flex items-center gap-4">
								<img
									src={invoiceState.invoice.settings.logoPath}
									alt="Logo"
									class="border-border h-16 w-auto rounded border object-contain p-2"
								/>
								<Button.Root onclick={removeLogo} variant="destructive" size="sm">
									<X size={16} />
									{$t('form.remove')}
								</Button.Root>
							</div>
						{:else}
							<Input.Root
								type="file"
								id="input-logo"
								accept="image/*"
								onchange={handleLogoUpload}
							/>
						{/if}
					</div>
					<!-- Customizable Texts -->
					<div class="space-y-2 md:col-span-2">
						<Label.Root for="input-payment-text" class="text-foreground text-sm font-medium">
							{$t('form.paymentText')}
						</Label.Root>
						<Textarea.Root
							id="input-payment-text"
							bind:value={invoiceState.invoice.settings.paymentText}
							placeholder="Text für Zahlungsanweisung"
						/>
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label.Root for="input-tax-note" class="text-foreground text-sm font-medium">
							{$t('form.taxNote')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-tax-note"
							bind:value={invoiceState.invoice.settings.taxNote}
							placeholder="z.B. Gemäß § 19 UStG..."
						/>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Customer -->
		<Accordion.Item
			value="customer"
			class="border-border bg-card overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="hover:bg-accent/50 flex w-full items-center justify-between px-6 py-4 text-left transition-all"
				>
					<h3 class="text-card-foreground text-lg font-semibold">{$t('form.recipient')}</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pt-2 pb-6 md:grid-cols-2">
					<div class="space-y-2">
						<Label.Root for="input-customer-company" class="text-foreground text-sm font-medium">
							{$t('form.company')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-customer-company"
							bind:value={invoiceState.invoice.customer.company}
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-customer-name" class="text-foreground text-sm font-medium">
							{$t('form.name')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-customer-name"
							bind:value={invoiceState.invoice.customer.name}
							class={getError('customer.name') ? 'border-destructive' : ''}
						/>
						{#if getError('customer.name')}
							<p class="text-destructive text-sm font-medium">
								{getError('customer.name')}
							</p>
						{/if}
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label.Root for="input-customer-street" class="text-foreground text-sm font-medium">
							{$t('form.street')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-customer-street"
							bind:value={invoiceState.invoice.customer.street}
							class={getError('customer.street') ? 'border-destructive' : ''}
						/>
						{#if getError('customer.street')}
							<p class="text-destructive text-sm font-medium">
								{getError('customer.street')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-customer-zip" class="text-foreground text-sm font-medium">
							{$t('form.zip')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-customer-zip"
							bind:value={invoiceState.invoice.customer.zip}
							class={getError('customer.zip') ? 'border-destructive' : ''}
						/>
						{#if getError('customer.zip')}
							<p class="text-destructive text-sm font-medium">
								{getError('customer.zip')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-customer-city" class="text-foreground text-sm font-medium">
							{$t('form.city')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-customer-city"
							bind:value={invoiceState.invoice.customer.city}
							class={getError('customer.city') ? 'border-destructive' : ''}
						/>
						{#if getError('customer.city')}
							<p class="text-destructive text-sm font-medium">
								{getError('customer.city')}
							</p>
						{/if}
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Sender -->
		<Accordion.Item
			value="sender"
			class="border-border bg-card overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="hover:bg-accent/50 flex w-full items-center justify-between px-6 py-4 text-left transition-all"
				>
					<h3 class="text-card-foreground text-lg font-semibold">{$t('form.sender')}</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pt-2 pb-6 md:grid-cols-2">
					<div class="space-y-2">
						<Label.Root for="input-sender-company" class="text-foreground text-sm font-medium">
							{$t('form.company')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-company"
							bind:value={invoiceState.invoice.sender.company}
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-name" class="text-foreground text-sm font-medium">
							{$t('form.name')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-name"
							bind:value={invoiceState.invoice.sender.name}
							class={getError('sender.name') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.name')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.name')}
							</p>
						{/if}
					</div>
					<div class="space-y-2 md:col-span-2">
						<Label.Root for="input-sender-street" class="text-foreground text-sm font-medium">
							{$t('form.street')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-street"
							bind:value={invoiceState.invoice.sender.street}
							class={getError('sender.street') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.street')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.street')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-zip" class="text-foreground text-sm font-medium">
							{$t('form.zip')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-zip"
							bind:value={invoiceState.invoice.sender.zip}
							class={getError('sender.zip') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.zip')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.zip')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-city" class="text-foreground text-sm font-medium">
							{$t('form.city')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-city"
							bind:value={invoiceState.invoice.sender.city}
							class={getError('sender.city') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.city')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.city')}
							</p>
						{/if}
					</div>

					<div class="md:col-span-2">
						<div class="bg-border my-4 h-px"></div>
						<h4 class="text-foreground mb-4 text-sm font-semibold">{$t('form.contact')}</h4>
					</div>

					<div class="space-y-2">
						<Label.Root for="input-sender-email" class="text-foreground text-sm font-medium">
							{$t('form.email')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-email"
							bind:value={invoiceState.invoice.sender.email}
							class={getError('sender.email') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.email')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.email')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-website" class="text-foreground text-sm font-medium">
							{$t('form.website')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-website"
							bind:value={invoiceState.invoice.sender.website}
							class={getError('sender.website') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.website')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.website')}
							</p>
						{/if}
					</div>

					<div class="md:col-span-2">
						<div class="bg-border my-4 h-px"></div>
						<h4 class="text-foreground mb-4 text-sm font-semibold">{$t('form.bankTax')}</h4>
					</div>

					<div class="space-y-2">
						<Label.Root for="input-sender-bank-name" class="text-foreground text-sm font-medium">
							{$t('form.bankName')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-bank-name"
							bind:value={invoiceState.invoice.sender.bankName}
						/>
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-iban" class="text-foreground text-sm font-medium">
							{$t('form.iban')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-iban"
							bind:value={invoiceState.invoice.sender.iban}
							class={getError('sender.iban') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.iban')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.iban')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-bic" class="text-foreground text-sm font-medium">
							{$t('form.bic')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-bic"
							bind:value={invoiceState.invoice.sender.bic}
							class={getError('sender.bic') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.bic')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.bic')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-tax-id" class="text-foreground text-sm font-medium">
							{$t('form.taxId')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-tax-id"
							bind:value={invoiceState.invoice.sender.taxId}
							class={getError('sender.taxId') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.taxId')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.taxId')}
							</p>
						{/if}
					</div>
					<div class="space-y-2">
						<Label.Root for="input-sender-vat-id" class="text-foreground text-sm font-medium">
							{$t('form.vatId')}
						</Label.Root>
						<Input.Root
							type="text"
							id="input-sender-vat-id"
							bind:value={invoiceState.invoice.sender.vatId}
							class={getError('sender.vatId') ? 'border-destructive' : ''}
						/>
						{#if getError('sender.vatId')}
							<p class="text-destructive text-sm font-medium">
								{getError('sender.vatId')}
							</p>
						{/if}
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>

	<!-- Articles -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between space-y-0 p-4">
			<Card.Title class="text-lg font-semibold">{$t('form.items')}</Card.Title>
			<Button.Root onclick={addArticle} size="sm">
				<Plus size={16} />
				{$t('form.article')}
			</Button.Root>
		</Card.Header>
		<Card.Content class="space-y-4 p-4 pt-0">
			{#each invoiceState.invoice.articles as article, i (article.id)}
				<ArticleCard {article} {removeArticle} {getError} index={i} />
			{/each}
		</Card.Content>
	</Card.Root>

	<!-- Discounts -->
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between space-y-0 p-4">
			<Card.Title class="text-lg font-semibold">{$t('form.discounts')}</Card.Title>
			<Button.Root onclick={addDiscount} variant="outline" size="sm">
				<Plus size={16} />
				{$t('form.discount')}
			</Button.Root>
		</Card.Header>
		<Card.Content class="space-y-4 p-4 pt-0">
			{#each invoiceState.invoice.discounts as discount, i (discount.id)}
				<DiscountCard {discount} {removeDiscount} {getError} index={i} />
			{/each}
		</Card.Content>
	</Card.Root>
</div>
