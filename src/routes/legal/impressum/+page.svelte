<script lang="ts">
	import { company } from '$lib/config/company';
</script>

<svelte:head>
	<title>Impressum | {company.name}</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<h1 class="mb-8 text-4xl font-bold">Impressum</h1>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Angaben gemäß § 5 DDG</h2>
		<p class="mb-2">{company.name}</p>
		<p class="mb-2">Inhaber: {company.owner}</p>
		<p class="mb-2">{company.address.street}</p>
		<p class="mb-2">{company.address.zip} {company.address.city}</p>
		<p class="mb-2">{company.address.country}</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Kontakt</h2>
		<p class="mb-2">
			E-Mail: <a href="mailto:{company.email}" class="text-primary hover:underline"
				>{company.email}</a
			>
		</p>
		<p class="mb-2">
			Website: <a
				href={company.website}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">{company.website}</a
			>
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Steuer-ID</h2>
		<p class="mb-2">
			Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: {company.vatId}
		</p>
		<p class="mb-2">Wirtschafts-Identifikationsnummer: {company.businessId}</p>
		<p class="mb-2">Steuernummer: {company.taxId}</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Redaktionell verantwortlich</h2>
		<p class="mb-2">{company.owner}</p>
		<p class="mb-2">{company.address.street}</p>
		<p class="mb-2">{company.address.zip} {company.address.city}</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">EU-Streitschlichtung</h2>
		<p class="mb-4">
			Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
			<a
				href="https://ec.europa.eu/consumers/odr/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a
			>. Unsere E-Mail-Adresse finden Sie oben im Impressum.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">
			Verbraucherstreitbeilegung/Universalschlichtungsstelle
		</h2>
		<p>
			Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
			Verbraucherschlichtungsstelle teilzunehmen.
		</p>
	</section>
</div>
