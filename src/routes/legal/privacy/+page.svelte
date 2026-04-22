<script lang="ts">
	import { company } from '$lib/config/company';
</script>

<svelte:head>
	<title>Datenschutzerklärung | {company.name}</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<h1 class="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">1. Datenschutz auf einen Blick</h2>
		<h3 class="mb-2 text-xl font-medium">Allgemeine Hinweise</h3>
		<p class="mb-4">
			Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
			personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind
			alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen
			zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten
			Datenschutzerklärung.
		</p>
		<h3 class="mb-2 text-xl font-medium">Datenerfassung auf dieser Website</h3>
		<p class="mb-4 font-bold">
			Hinweis zur Cookie-Nutzung: Diese Website nutzt keine einwilligungspflichtigen Cookies oder
			Tracking-Technologien. Alle Funktionen werden ohne die Speicherung von nicht-essentiellen
			Daten auf Ihrem Endgerät bereitgestellt.
		</p>
		<p class="mb-4">
			Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
			Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser
			Datenschutzerklärung entnehmen.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">2. Allgemeine Hinweise und Pflichtinformationen</h2>
		<h3 class="mb-2 text-xl font-medium">Datenschutz</h3>
		<p class="mb-4">
			Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
			behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen
			Datenschutzvorschriften sowie dieser Datenschutzerklärung.
		</p>
		<p class="mb-4">
			Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
			Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die
			vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen.
			Sie erläutert auch, wie und zu welchem Zweck das geschieht.
		</p>
		<p class="mb-4">
			Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per
			E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff
			durch Dritte ist nicht möglich.
		</p>

		<h3 class="mb-2 text-xl font-medium">Hinweis zur verantwortlichen Stelle</h3>
		<p class="mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
		<p class="mb-2">{company.name}</p>
		<p class="mb-2">{company.owner}</p>
		<p class="mb-2">{company.address.street}</p>
		<p class="mb-2">{company.address.zip} {company.address.city}</p>
		<p class="mb-4">
			E-Mail: <a href="mailto:{company.email}" class="text-primary hover:underline"
				>{company.email}</a
			>
		</p>
		<p class="mb-4">
			Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam
			mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B.
			Namen, E-Mail-Adressen o. Ä.) entscheidet.
		</p>

		<h3 class="mb-2 text-xl font-medium">Speicherdauer</h3>
		<p class="mb-4">
			Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde,
			verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung
			entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur
			Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich
			zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder
			handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach
			Fortfall dieser Gründe.
		</p>

		<h3 class="mb-2 text-xl font-medium">SSL- bzw. TLS-Verschlüsselung</h3>
		<p class="mb-4">
			Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte,
			wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine
			SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die
			Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in
			Ihrer Browserzeile.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">3. Datenerfassung auf dieser Website</h2>
		<h3 class="mb-2 text-xl font-medium">Server-Log-Dateien</h3>
		<p class="mb-4">
			Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten
			Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
		</p>
		<ul class="mb-4 list-inside list-disc">
			<li>Browsertyp und Browserversion</li>
			<li>verwendetes Betriebssystem</li>
			<li>Referrer URL</li>
			<li>Hostname des zugreifenden Rechners</li>
			<li>Uhrzeit der Serveranfrage</li>
			<li>IP-Adresse</li>
		</ul>
		<p class="mb-4">
			Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
		</p>
		<p class="mb-4">
			Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der
			Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und
			der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
		</p>
	</section>

	<section class="mb-8">
		<h2 class="mb-4 text-2xl font-semibold">4. Betroffenenrechte</h2>
		<p class="mb-4">
			Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
			unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und
			Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder
			Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können
			Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
		</p>
	</section>
</div>
