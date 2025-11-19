<script lang="ts">
	import { invoiceState } from '$lib/state.svelte';
	import { Plus, Trash2, X, ChevronDown } from 'lucide-svelte';
	import { Accordion } from 'bits-ui';

	let { invoice, addArticle, removeArticle, addDiscount, removeDiscount } = invoiceState;

	let logoInput: HTMLInputElement;

	function handleLogoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			invoice.settings.logoPath = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removeLogo() {
		invoice.settings.logoPath = undefined;
		if (logoInput) logoInput.value = '';
	}
</script>

<div class="space-y-6">
	<Accordion.Root type="multiple" class="space-y-4" value={['general', 'customer']}>
		<!-- General Settings -->
		<Accordion.Item
			value="general"
			class="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-accent/50"
				>
					<h3 class="text-lg font-semibold text-card-foreground">Allgemein</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pb-6 pt-2 md:grid-cols-2">
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-invoice-number"
							>Rechnungsnummer (automatisch)</label
						>
						<input
							type="text"
							id="input-invoice-number"
							bind:value={invoice.number}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							readonly
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-invoice-date">Datum</label
						>
						<input
							type="date"
							id="input-invoice-date"
							bind:value={invoice.date}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-service-date"
							>Leistungsdatum</label
						>
						<input
							type="text"
							id="input-service-date"
							bind:value={invoice.serviceDate}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="YYYY-MM-DD oder 'today'"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-payment-days"
							>Zahlungsziel (Tage)</label
						>
						<input
							type="number"
							id="input-payment-days"
							bind:value={invoice.settings.paymentDays}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-vat-rate"
							>MwSt. Satz (%)</label
						>
						<input
							type="number"
							id="input-vat-rate"
							bind:value={invoice.settings.vatRate}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-currency">Währung</label>
						<input
							type="text"
							id="input-currency"
							bind:value={invoice.settings.currency}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>

					<!-- Logo Upload -->
					<div class="space-y-2 md:col-span-2">
						<label class="text-sm font-medium text-foreground" for="input-logo">Logo</label>
						{#if invoice.settings.logoPath}
							<div class="flex items-center gap-4">
								<img
									src={invoice.settings.logoPath}
									alt="Logo"
									class="h-16 w-auto rounded border border-border object-contain p-2"
								/>
								<button
									onclick={removeLogo}
									class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-all hover:scale-105 hover:bg-destructive/90 active:scale-95"
								>
									<X size={16} /> Entfernen
								</button>
							</div>
						{:else}
							<input
								type="file"
								id="input-logo"
								accept="image/*"
								bind:this={logoInput}
								onchange={handleLogoUpload}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
						{/if}
					</div>

					<!-- Customizable Texts -->
					<div class="space-y-2 md:col-span-2">
						<label class="text-sm font-medium text-foreground" for="input-payment-text"
							>Zahlungstext</label
						>
						<textarea
							id="input-payment-text"
							bind:value={invoice.settings.paymentText}
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Text für Zahlungsanweisung"
						></textarea>
					</div>
					<div class="space-y-2 md:col-span-2">
						<label class="text-sm font-medium text-foreground" for="input-tax-note"
							>Steuerhinweis (nur bei 0% MwSt.)</label
						>
						<input
							type="text"
							id="input-tax-note"
							bind:value={invoice.settings.taxNote}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="z.B. Gemäß § 19 UStG..."
						/>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Customer -->
		<Accordion.Item
			value="customer"
			class="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-accent/50"
				>
					<h3 class="text-lg font-semibold text-card-foreground">Empfänger (Kunde)</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pb-6 pt-2 md:grid-cols-2">
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-customer-company"
							>Firma</label
						>
						<input
							type="text"
							id="input-customer-company"
							bind:value={invoice.customer.company}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-customer-name">Name</label
						>
						<input
							type="text"
							id="input-customer-name"
							bind:value={invoice.customer.name}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2 md:col-span-2">
						<label class="text-sm font-medium text-foreground" for="input-customer-street"
							>Straße</label
						>
						<input
							type="text"
							id="input-customer-street"
							bind:value={invoice.customer.street}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-customer-zip">PLZ</label>
						<input
							type="text"
							id="input-customer-zip"
							bind:value={invoice.customer.zip}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-customer-city"
							>Stadt</label
						>
						<input
							type="text"
							id="input-customer-city"
							bind:value={invoice.customer.city}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>

		<!-- Sender -->
		<Accordion.Item
			value="sender"
			class="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md"
		>
			<Accordion.Header>
				<Accordion.Trigger
					class="flex w-full items-center justify-between px-6 py-4 text-left transition-all hover:bg-accent/50"
				>
					<h3 class="text-lg font-semibold text-card-foreground">Absender (Du)</h3>
					<ChevronDown
						class="h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
					/>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			>
				<div class="grid grid-cols-1 gap-4 px-6 pb-6 pt-2 md:grid-cols-2">
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-company"
							>Firma</label
						>
						<input
							type="text"
							id="input-sender-company"
							bind:value={invoice.sender.company}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-name">Name</label>
						<input
							type="text"
							id="input-sender-name"
							bind:value={invoice.sender.name}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2 md:col-span-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-street"
							>Straße</label
						>
						<input
							type="text"
							id="input-sender-street"
							bind:value={invoice.sender.street}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-zip">PLZ</label>
						<input
							type="text"
							id="input-sender-zip"
							bind:value={invoice.sender.zip}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-city">Stadt</label>
						<input
							type="text"
							id="input-sender-city"
							bind:value={invoice.sender.city}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>

					<div class="md:col-span-2">
						<div class="my-4 h-px bg-border"></div>
						<h4 class="mb-4 text-sm font-semibold text-foreground">Kontakt</h4>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-email">Email</label
						>
						<input
							type="text"
							id="input-sender-email"
							bind:value={invoice.sender.email}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-website"
							>Webseite</label
						>
						<input
							type="text"
							id="input-sender-website"
							bind:value={invoice.sender.website}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>

					<div class="md:col-span-2">
						<div class="my-4 h-px bg-border"></div>
						<h4 class="mb-4 text-sm font-semibold text-foreground">Bank & Steuer</h4>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-bank-name"
							>Bank Name</label
						>
						<input
							type="text"
							id="input-sender-bank-name"
							bind:value={invoice.sender.bankName}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-iban">IBAN</label>
						<input
							type="text"
							id="input-sender-iban"
							bind:value={invoice.sender.iban}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-bic">BIC</label>
						<input
							type="text"
							id="input-sender-bic"
							bind:value={invoice.sender.bic}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-tax-id"
							>Steuernummer</label
						>
						<input
							type="text"
							id="input-sender-tax-id"
							bind:value={invoice.sender.taxId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-foreground" for="input-sender-vat-id"
							>USt-IdNr.</label
						>
						<input
							type="text"
							id="input-sender-vat-id"
							bind:value={invoice.sender.vatId}
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						/>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>

	<!-- Articles -->
	<div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<h3 class="text-lg font-semibold text-card-foreground">Positionen</h3>
			<button
				onclick={addArticle}
				class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
			>
				<Plus size={16} /> Artikel
			</button>
		</div>

		<div class="space-y-4 p-6">
			{#each invoice.articles as article (article.id)}
				<div class="grid grid-cols-12 items-start gap-2 border-b border-border pb-4 last:border-0">
					<div class="col-span-12 md:col-span-6">
						<input
							type="text"
							bind:value={article.description}
							class="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Beschreibung"
						/>
						<textarea
							bind:value={article.summary}
							class="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Details (optional)"
						></textarea>
					</div>
					<div class="col-span-4 md:col-span-2">
						<input
							type="number"
							bind:value={article.amount}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Menge"
						/>
					</div>
					<div class="col-span-6 md:col-span-3">
						<input
							type="number"
							bind:value={article.pricePerUnit}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Preis"
						/>
					</div>
					<div class="col-span-2 flex justify-end md:col-span-1">
						<button
							onclick={() => removeArticle(article.id)}
							class="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
						>
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Discounts -->
	<div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<h3 class="text-lg font-semibold text-card-foreground">Rabatte</h3>
			<button
				onclick={addDiscount}
				class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground active:scale-95"
			>
				<Plus size={16} /> Rabatt
			</button>
		</div>

		<div class="space-y-4 p-6">
			{#each invoice.discounts as discount (discount.id)}
				<div class="grid grid-cols-12 items-center gap-2 border-b border-border pb-2 last:border-0">
					<div class="col-span-7">
						<input
							type="text"
							bind:value={discount.description}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Beschreibung"
						/>
					</div>
					<div class="col-span-4">
						<input
							type="number"
							bind:value={discount.amount}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Betrag"
						/>
					</div>
					<div class="col-span-1 flex justify-end">
						<button
							onclick={() => removeDiscount(discount.id)}
							class="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
						>
							<Trash2 size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Message -->
	<div class="space-y-2">
		<label class="text-sm font-medium text-foreground" for="input-message"
			>Nachricht / Fußzeile</label
		>
		<textarea
			id="input-message"
			bind:value={invoice.message}
			class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		></textarea>
	</div>
</div>
