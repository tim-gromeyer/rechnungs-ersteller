<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Textarea from '$lib/components/ui/textarea';
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Article } from '$lib/types';

	export let article: Article;
	export let removeArticle: (id: string) => void;
	export let getError: (path: string) => string | undefined;
	export let index: number;

	// Helper function to get error for a specific path within an article
	function getArticleError(field: string): string | undefined {
		return getError(`articles.${index}.${field}`);
	}
</script>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between space-y-0 p-4">
		<Card.Title class="text-md font-semibold">Position {index + 1}</Card.Title>
		<Button.Root onclick={() => removeArticle(article.id)} variant="destructive" size="icon">
			<Trash2 size={16} />
		</Button.Root>
	</Card.Header>
	<Card.Content class="p-4 pt-0">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label.Root for="article-description-{article.id}" class="text-sm font-medium"
					>Beschreibung</Label.Root
				>
				<Input.Root
					type="text"
					id="article-description-{article.id}"
					bind:value={article.description}
					placeholder="Beschreibung"
					class={getArticleError('description') ? 'border-destructive' : ''}
				/>
				{#if getArticleError('description')}
					<p class="text-destructive text-sm font-medium">
						{getArticleError('description')}
					</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label.Root for="article-summary-{article.id}" class="text-sm font-medium"
					>Details (optional)</Label.Root
				>
				<Textarea.Root
					id="article-summary-{article.id}"
					bind:value={article.summary}
					placeholder="Details (optional)"
					class={getArticleError('summary') ? 'border-destructive' : ''}
				/>
				{#if getArticleError('summary')}
					<p class="text-destructive text-sm font-medium">
						{getArticleError('summary')}
					</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label.Root for="article-amount-{article.id}" class="text-sm font-medium">Menge</Label.Root>
				<Input.Root
					type="number"
					id="article-amount-{article.id}"
					bind:value={article.amount}
					placeholder="Menge"
					class={getArticleError('amount') ? 'border-destructive' : ''}
				/>
				{#if getArticleError('amount')}
					<p class="text-destructive text-sm font-medium">
						{getArticleError('amount')}
					</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label.Root for="article-price-{article.id}" class="text-sm font-medium">Preis</Label.Root>
				<Input.Root
					type="number"
					id="article-price-{article.id}"
					bind:value={article.pricePerUnit}
					placeholder="Preis"
					class={getArticleError('pricePerUnit') ? 'border-destructive' : ''}
				/>
				{#if getArticleError('pricePerUnit')}
					<p class="text-destructive text-sm font-medium">
						{getArticleError('pricePerUnit')}
					</p>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
