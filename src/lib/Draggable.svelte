<script lang="ts">
	export let left = 100;
	export let top = 100;

	let moving = false;

	function onpointerdown() {
		moving = true;
	}

	function onpointermove(e: PointerEvent) {
		if (moving) {
			left += e.movementX;
			top += e.movementY;
		}
	}

	function onpointerup() {
		moving = false;
	}
</script>

<section on:mousedown={onpointerdown} style="left: {left}px; top: {top}px;" class="draggable">
	<slot />
</section>

<svelte:window on:pointerup={onpointerup} on:pointermove={onpointermove} />

<style>
	.draggable {
		user-select: none;
		cursor: move;
		position: absolute;
	}
</style>
