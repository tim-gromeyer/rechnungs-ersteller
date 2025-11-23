<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import * as Input from '$lib/components/ui/input';
	import * as Label from '$lib/components/ui/label';
	import * as Button from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import type { Discount } from '$lib/types';
	import * as m from '$lib/paraglide/messages';

	export let discount: Discount;
	export let removeDiscount: (id: string) => void;
	export let getError: (path: string) => string | undefined;
	export let index: number;

	// Helper function to get error for a specific path within a discount
	function getDiscountError(field: string): string | undefined {
		return getError(`discounts.${index}.${field}`);
	}
</script>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between space-y-0 p-4">
		<Card.Title class="text-md font-semibold">{m.form_discount()} {index + 1}</Card.Title>
		<Button.Root onclick={() => removeDiscount(discount.id)} variant="destructive" size="icon">
			<Trash2 size={16} />
		</Button.Root>
	</Card.Header>
	<Card.Content class="p-4 pt-0">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label.Root for="discount-description-{discount.id}" class="text-sm font-medium"
					>{m.form_description()}</Label.Root
				>
				<Input.Root
					type="text"
					id="discount-description-{discount.id}"
					bind:value={discount.description}
					placeholder={m.form_description()}
					class={getDiscountError('description') ? 'border-destructive' : ''}
				/>
				{#if getDiscountError('description')}
					<p class="text-destructive text-sm font-medium">
						{getDiscountError('description')}
					</p>
				{/if}
			</div>
			<div class="space-y-2">
				<Label.Root for="discount-amount-{discount.id}" class="text-sm font-medium"
					>{m.form_amount()}</Label.Root
				>
				<Input.Root
					type="number"
					id="discount-amount-{discount.id}"
					bind:value={discount.amount}
					placeholder={m.form_amount()}
					class={getDiscountError('amount') ? 'border-destructive' : ''}
				/>
				{#if getDiscountError('amount')}
					<p class="text-destructive text-sm font-medium">
						{getDiscountError('amount')}
					</p>
				{/if}
			</div>
		</div>
	</Card.Content>
</Card.Root>
