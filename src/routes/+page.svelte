<script lang="ts">
	import Navbar from './components/Navbar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, CheckCircle2 } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Kostenlos Rechnung schreiben | ZUGFeRD E-Rechnung Generator</title>
	<meta
		name="description"
		content="Erstellen Sie professionelle, ZUGFeRD-konforme E-Rechnungen kostenlos direkt im Browser. Keine Anmeldung erforderlich. Ihre Daten bleiben lokal und sicher."
	/>
	<meta
		name="keywords"
		content="Rechnung schreiben, Rechnung erstellen, E-Rechnung, ZUGFeRD, kostenlos, online, PDF Rechnung, Kleinunternehmer, Freiberufler"
	/>
	<meta name="robots" content="index, follow" />
	<meta name="author" content="Tim Gromeyer" />
	<link rel="canonical" href="https://rechnungs-ersteller.com/" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://rechnungs-ersteller.com/" />
	<meta property="og:title" content="Kostenlos Rechnung schreiben | ZUGFeRD E-Rechnung Generator" />
	<meta
		property="og:description"
		content="Erstellen Sie professionelle, ZUGFeRD-konforme E-Rechnungen kostenlos direkt im Browser. Keine Anmeldung erforderlich. Ihre Daten bleiben lokal und sicher."
	/>
	<meta property="og:site_name" content="Rechnungs-Ersteller" />
	<!-- <meta property="og:image" content="https://rechnungs-ersteller.com/og-image.jpg" /> -->

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://rechnungs-ersteller.com/" />
	<meta
		property="twitter:title"
		content="Kostenlos Rechnung schreiben | ZUGFeRD E-Rechnung Generator"
	/>
	<meta
		property="twitter:description"
		content="Erstellen Sie professionelle, ZUGFeRD-konforme E-Rechnungen kostenlos direkt im Browser. Keine Anmeldung erforderlich."
	/>
	<!-- <meta property="twitter:image" content="https://rechnungs-ersteller.com/og-image.jpg" /> -->

	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "Rechnungs-Ersteller",
			"applicationCategory": "BusinessApplication",
			"operatingSystem": "Any",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "EUR"
			},
			"description": "Kostenloses Tool zum Erstellen von ZUGFeRD-konformen E-Rechnungen direkt im Browser.",
			"featureList": "ZUGFeRD Export, PDF Generierung, Lokale Datenspeicherung, Dark Mode",
			"author": {
				"@type": "Person",
				"name": "Tim Gromeyer"
			}
		}
	</script>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Navbar />

	<main class="flex-1">
		<!-- Hero Section -->
		<section class="container mx-auto px-4 py-24 text-center md:py-32">
			<h1 class="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
				Rechnungen schreiben <br class="hidden sm:inline" />
				<span class="text-primary">einfach gemacht</span>
			</h1>
			<p class="text-muted-foreground mx-auto mb-10 max-w-[700px] text-lg md:text-xl">
				Erstellen Sie professionelle, ZUGFeRD-konforme Rechnungen direkt in Ihrem Browser. Keine
				Anmeldung, keine Kosten, Ihre Daten bleiben bei Ihnen.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<Button size="lg" href="/dashboard" class="gap-2">
					Zur Übersicht <ArrowRight size={18} />
				</Button>
				<Button
					variant="outline"
					size="lg"
					href="https://github.com/tim-gromeyer/rechnungs-ersteller"
				>
					GitHub
				</Button>
			</div>
		</section>

		<!-- Features Section -->
		<section class="bg-muted/30 py-24">
			<div class="container mx-auto px-4">
				<div class="grid gap-12 md:grid-cols-3">
					<div class="flex flex-col items-center text-center">
						<div class="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<CheckCircle2 class="text-primary h-8 w-8" />
						</div>
						<h3 class="mb-3 text-xl font-bold">Lokal & Sicher</h3>
						<p class="text-muted-foreground">
							Alle Daten werden lokal in Ihrem Browser gespeichert. Nichts wird auf unsere Server
							hochgeladen.
						</p>
					</div>
					<div class="flex flex-col items-center text-center">
						<div class="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<CheckCircle2 class="text-primary h-8 w-8" />
						</div>
						<h3 class="mb-3 text-xl font-bold">ZUGFeRD Konform</h3>
						<p class="text-muted-foreground">
							Erstellen Sie automatisch E-Rechnungen nach dem ZUGFeRD-Standard für maximale
							Kompatibilität.
						</p>
					</div>
					<div class="flex flex-col items-center text-center">
						<div class="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
							<CheckCircle2 class="text-primary h-8 w-8" />
						</div>
						<h3 class="mb-3 text-xl font-bold">Kostenlos</h3>
						<p class="text-muted-foreground">
							Unser Tool ist Open Source und komplett kostenlos nutzbar. Keine versteckten Gebühren.
						</p>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t py-8">
		<div class="text-muted-foreground container mx-auto px-4 text-center text-sm">
			<p>&copy; {new Date().getFullYear()} Rechnungs-Ersteller. Open Source.</p>
		</div>
	</footer>
</div>
