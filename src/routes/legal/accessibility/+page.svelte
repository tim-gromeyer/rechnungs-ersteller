<script lang="ts">
	import { company } from '$lib/config/company';
</script>

<svelte:head>
	<title>Erklärung zur Barrierefreiheit | {company.name}</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<h1 class="mb-8 text-4xl font-bold">Erklärung zur Barrierefreiheit</h1>

	<section class="mb-8">
		<p class="mb-4">
			{company.name} bemüht sich, seine Website im Einklang mit den nationalen Rechtsvorschriften zur
			Umsetzung der Richtlinie (EU) 2016/2102 des Europäischen Parlaments und des Rates barrierefrei zugänglich
			zu machen.
		</p>
		<p class="mb-4">
			Diese Erklärung zur Barrierefreiheit gilt für die Website <a
				href={company.website}
				class="text-primary hover:underline">{company.website}</a
			>.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Stand der Vereinbarkeit mit den Anforderungen</h2>
		<p class="mb-4">
			Diese Website ist mit dem Barrierefreiheitsstärkungsgesetz (BFSG) und den Anforderungen der
			Web Content Accessibility Guidelines (WCAG) 2.1 auf Stufe AA weitestgehend vereinbar.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Nicht barrierefreie Inhalte</h2>
		<p class="mb-4">
			Die nachstehend aufgeführten Inhalte sind aus den folgenden Gründen nicht barrierefrei:
		</p>
		<ul class="mb-4 list-inside list-disc">
			<li>Einige ältere PDF-Dokumente sind möglicherweise nicht vollständig barrierefrei.</li>
			<li>
				Komplexe mathematische Formeln könnten in einigen Browsern eingeschränkt zugänglich sein.
			</li>
		</ul>
		<p>Wir arbeiten kontinuierlich an der Verbesserung der Barrierefreiheit.</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Erstellung dieser Erklärung zur Barrierefreiheit</h2>
		<p class="mb-4">Diese Erklärung wurde am 22. April 2026 erstellt.</p>
		<p>
			Die Bewertung der Vereinbarkeit der Website mit den Anforderungen des BFSG beruht auf einer
			von uns durchgeführten Selbstbewertung.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Feedback und Kontaktangaben</h2>
		<p class="mb-4">
			Wenn Ihnen Mängel in Bezug auf die barrierefreie Gestaltung unserer Website auffallen, können
			Sie uns dies mitteilen. Bitte kontaktieren Sie uns unter:
		</p>
		<p class="mb-2">
			E-Mail: <a href="mailto:{company.email}" class="text-primary hover:underline"
				>{company.email}</a
			>
		</p>
		<p class="mb-2">Telefon: (Keine Angabe erforderlich)</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">Durchsetzungsverfahren</h2>
		<p>
			Sollten Sie auf Ihre Anfrage zur Barrierefreiheit keine zufriedenstellende Antwort erhalten
			haben, können Sie sich an die zuständige Durchsetzungsstelle für Barrierefreiheit wenden.
		</p>
	</section>
</div>
