<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	let { open = $bindable(false), title, description, onConfirm, onCancel } = $props();

	function handleConfirm() {
		onConfirm?.();
		open = false;
	}

	function handleCancel() {
		onCancel?.();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{description}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel}>Abbrechen</Button>
			<Button variant="destructive" onclick={handleConfirm}>Löschen</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
