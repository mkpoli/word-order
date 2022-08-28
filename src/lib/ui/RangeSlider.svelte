<script lang="ts">
	import { spring, type Spring } from 'svelte/motion';

	export let min: number;
	export let max: number;
	export let step = 1;
	export let wheelStep = (max + min) / 20;
	export let value: number = (max + min) / 2;

	export let reversed = false;
	export let hoverable = true;
	export let disabled = false;

	export let id: string;
	export let prefix = '';
	export let suffix = '';
	export let formatter = (value: number, percentage: number) => value;

	export let precision = 2;
	export let springValues = { stiffness: 0.15, damping: 0.4 };

	let slider: HTMLDivElement;
	let focus = false;
	let handleActivated = false;
	let handlePressed = false;
	let keyboardActive = false;
	let previousValue: number;
	let springPositions: Spring<number[]>;
	let percentage = 50;

	function fixFloat(value: number): number {
		return parseFloat(value.toFixed(precision));
	}

	$: {
		value = align(value);
		percentage = percentOf(value);
		springPositions = spring([percentage], springValues);
	}

	function percentOf(x: number): number {
		let perc = ((x - min) / (max - min)) * 100;
		if (isNaN(perc) || perc <= 0) {
			return 0;
		} else if (perc >= 100) {
			return 100;
		} else {
			return fixFloat(perc);
		}
	}

	function clamp(val: number): number {
		return val <= min ? min : val >= max ? max : val;
	}

	function align(val: number): number {
		if (val <= min) {
			return fixFloat(min);
		} else if (val >= max) {
			return fixFloat(max);
		}

		let remainder = (val - min) % step;
		let aligned = val - remainder;
		if (Math.abs(remainder) * 2 >= step) {
			aligned += remainder > 0 ? step : -step;
		}
		return fixFloat(clamp(aligned));
	}

	$: orientationStart = reversed ? 'right' : 'left';
	$: orientationEnd = reversed ? 'left' : 'right';

	function normalisedClient(e: MouseEvent | TouchEvent): { clientX: number; clientY: number } {
		if (e.type.includes('touch')) {
			return (e as TouchEvent).touches[0];
		} else {
			return e as MouseEvent;
		}
	}

	function targetIsHandle(el: EventTarget) {
		const handles = slider.querySelectorAll('.handle');
		const isHandle = Array.prototype.includes.call(handles, el);
		const isChild = Array.prototype.some.call(handles, (e) => e.contains(el));
		return isHandle || isChild;
	}

	function handleInteract(clientPos: { clientX: number; clientY: number }) {
		// first make sure we have the latest dimensions
		// of the slider, as it may have changed size
		const dims = slider.getBoundingClientRect();
		// calculate the interaction position, percent and value
		let handlePos = 0;
		let handlePercent = 0;
		let handleVal = 0;
		handlePos = clientPos.clientX - dims.left;
		handlePercent = (handlePos / dims.width) * 100;
		handlePercent = reversed ? 100 - handlePercent : handlePercent;
		handleVal = ((max - min) / 100) * handlePercent + min;
		// move handle to the value
		setValue(handleVal);
	}

	function setValue(x: number): void {
		x = align(x);

		if (value !== x) {
			value = x;
		}

		// fire the change event when the handle moves,
		// and store the previous value for the next time
		if (previousValue !== x) {
			previousValue = x;
		}
	}

	function sliderBlurHandle() {
		if (keyboardActive) {
			focus = false;
			handleActivated = false;
			handlePressed = false;
		}
	}

	function sliderFocusHandle() {
		if (!disabled) {
			focus = true;
		}
	}
	function sliderKeydown(e: KeyboardEvent) {
		if (!disabled) {
			let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
			let prevent = false;

			switch (e.key) {
				case 'PageDown':
					jump *= 10;
				case 'ArrowRight':
				case 'ArrowUp':
					setValue(value + jump);
					prevent = true;
					break;
				case 'PageUp':
					jump *= 10;
				case 'ArrowLeft':
				case 'ArrowDown':
					setValue(value - jump);
					prevent = true;
					break;
				case 'Home':
					setValue(min);
					prevent = true;
					break;
				case 'End':
					setValue(max);
					prevent = true;
					break;
			}
			if (prevent) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}

	function sliderInteractStart(e: MouseEvent | TouchEvent) {
		if (!disabled) {
			const el = e.target;
			const clientPos = normalisedClient(e);
			// set the closest handle as active
			focus = true;
			handleActivated = true;
			handlePressed = true;

			previousValue = align(value);

			if (e.type === 'touchstart') {
				handleInteract(clientPos);
			}
		}
	}

	function sliderInteractEnd(e: Event) {
		handlePressed = false;
	}

	function bodyInteractStart(e: Event) {
		keyboardActive = false;
		if (focus && e.target !== slider && !slider.contains(e.target as Node)) {
			focus = false;
		}
	}

	function bodyInteract(e: MouseEvent | TouchEvent) {
		if (!disabled) {
			if (handleActivated) {
				handleInteract(normalisedClient(e));
			}
		}
	}

	let ctrlKey = false;
	let shiftKey = false;
	let altKey = false;

	let activatedByWheel = false;
</script>

<div
	{id}
	bind:this={slider}
	class="rangeSlider range"
	class:disabled
	class:hoverable
	class:reversed
	class:focus
	on:mousedown={sliderInteractStart}
	on:mouseup={sliderInteractEnd}
	on:touchstart|preventDefault={sliderInteractStart}
	on:touchend|preventDefault={sliderInteractEnd}
	on:wheel={(e) => {
		if (disabled) return;

		focus = true;
		activatedByWheel = true;

		const delta = (e.deltaY > 0 ? -wheelStep : wheelStep) * (ctrlKey || altKey || shiftKey ? 5 : 1);
		setValue(value + delta);

		e.preventDefault();
	}}
	on:mouseleave={(e) => {
		if (activatedByWheel) {
			activatedByWheel = false;
			focus = false;
		}
	}}
>
	<span
		role="slider"
		class="rangeHandle"
		class:active={focus}
		class:press={handlePressed}
		data-handle={0}
		on:blur={sliderBlurHandle}
		on:focus={sliderFocusHandle}
		on:keydown={sliderKeydown}
		style="{orientationStart}: {$springPositions[0]}%; z-index: {3};"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-valuetext="{prefix}{formatter(value, percentOf(value))}{suffix}"
		aria-orientation="horizontal"
		aria-disabled={disabled}
		{disabled}
		tabindex={disabled ? -1 : 0}
	>
		<span class="rangeNub" />
		<span class="rangeFloat">
			{#if prefix}<span class="rangeFloat-prefix">{prefix}</span>{/if}{formatter(value, percentOf(value))}{#if suffix}<span class="rangeFloat-suffix"
					>{suffix}</span
				>{/if}
		</span>
	</span>
	<span
		class="rangeBar"
		style="{orientationStart}: 0%; 
            {orientationEnd}: {100 - $springPositions[0]}%;"
	/>
</div>

<svelte:window
	on:mousedown={bodyInteractStart}
	on:touchstart={bodyInteractStart}
	on:mousemove={bodyInteract}
	on:touchmove={bodyInteract}
	on:mouseup={(e) => {
		if (!disabled && handleActivated) {
			const el = e.target;
			if (el === slider || (el instanceof Element && slider.contains(el))) {
				focus = true;
				if (!targetIsHandle(el)) {
					handleInteract(normalisedClient(e));
				}
			}
		}
		handleActivated = false;
		handlePressed = false;
	}}
	on:touchend={() => {
		handleActivated = false;
		handlePressed = false;
	}}
	on:keydown={(e) => {
		if (!disabled) {
			if (e.key === 'Control') {
				ctrlKey = true;
			}

			if (e.key === 'Shift') {
				shiftKey = true;
			}

			if (e.key === 'Alt') {
				altKey = true;
			}

			if (e.target === slider || (e.target instanceof Element && slider.contains(e.target))) {
				keyboardActive = true;
			}
		}
	}}
	on:keyup={(e) => {
		if (!disabled) {
			if (e.key === 'Control') {
				ctrlKey = false;
			}

			if (e.key === 'Shift') {
				shiftKey = false;
			}

			if (e.key === 'Alt') {
				altKey = false;
			}
		}
	}}
/>

<style global>
	.rangeSlider {
		--slider-thickness: 0.5em;

		--handle-size: 1.05em;
		--hover-expand: 0.3em;
		--click-expand: 0.5em;

		--color-slider: #efefef;
		--color-slider-border: #dbdbdb;

		--color-handle: var(--color-range-handle, #838de7);
		--color-handle-border: var(--color-handle);
		--color-handle-focus: var(--color-accent);

		--color-range: var(--color-handle-focus);

		--color-handle-inactive: var(--color-inactive);
		--color-range-inactive: var(--color-handle-inactive);

		--color-float-inactive: var(--color-handle-inactive);
		--color-float: var(--color-handle-focus);
		--color-float-text: #ffffff;
	}
	.rangeSlider {
		position: relative;
		border-radius: 100px;
		height: var(--slider-thickness);
		/* margin: 1em; */
		margin: 0.6em 0.2em;
		transition: opacity 0.2s ease;
		user-select: none;
		background-color: var(--color-slider);
		border: 1px solid var(--color-slider-border);
	}
	.rangeSlider * {
		user-select: none;
	}
	.rangeSlider .rangeHandle {
		position: absolute;
		display: block;
		height: var(--handle-size);
		width: var(--handle-size);
		top: 0.25em;
		bottom: auto;
		transform: translateY(-50%) translateX(-50%);
		z-index: 2;
	}
	.rangeSlider.reversed .rangeHandle {
		transform: translateY(-50%) translateX(50%);
	}

	.rangeSlider .rangeNub {
		background-color: var(--color-handle-inactive);
	}
	.rangeSlider.focus .rangeNub {
		background-color: var(--color-handle);
	}

	.rangeSlider .rangeNub,
	.rangeSlider .rangeHandle:before {
		position: absolute;
		left: 0;
		top: 0;
		display: block;
		border-radius: 10em;
		height: 100%;
		width: 100%;
		transition: box-shadow 0.2s ease;
	}

	.rangeSlider .rangeHandle.active .rangeNub {
		background-color: var(--color-handle-focus);
	}

	.rangeSlider .rangeHandle:before {
		content: '';
		left: 1px;
		top: 1px;
		bottom: 1px;
		right: 1px;
		height: auto;
		width: auto;
		box-shadow: 0 0 0 0px var(--color-handle-border);
		opacity: 0;
	}
	.rangeSlider.hoverable:not(.disabled) .rangeHandle:hover:before {
		box-shadow: 0 0 0 var(--hover-expand) var(--color-handle-border);
		opacity: 0.2;
	}
	.rangeSlider.hoverable:not(.disabled) .rangeHandle.press:before,
	.rangeSlider.hoverable:not(.disabled) .rangeHandle.press:hover:before {
		box-shadow: 0 0 0 var(--click-expand) var(--color-handle-border);
		opacity: 0.4;
	}
	.rangeSlider.range .rangeHandle:nth-of-type(1) .rangeNub {
		transform: rotate(-135deg);
	}
	.rangeSlider.range .rangeHandle:nth-of-type(2) .rangeNub {
		transform: rotate(45deg);
	}
	.rangeSlider.range.reversed .rangeHandle:nth-of-type(1) .rangeNub {
		transform: rotate(45deg);
	}
	.rangeSlider.range.reversed .rangeHandle:nth-of-type(2) .rangeNub {
		transform: rotate(-135deg);
	}
	.rangeSlider .rangeFloat {
		display: block;
		position: absolute;
		left: 50%;
		top: -0.5em;
		transform: translate(-50%, -100%);
		font-size: 1em;
		text-align: center;
		opacity: 0;
		pointer-events: none;
		white-space: nowrap;
		transition: all 0.2s ease;
		font-size: 0.9em;
		padding: 0.2em 0.4em;
		border-radius: 0.2em;
		color: var(--color-float-text);
		background-color: var(--color-float-inactive);
	}
	.rangeSlider.focus .rangeFloat {
		background-color: var(--color-float);
	}

	.rangeSlider .rangeHandle.active .rangeFloat,
	.rangeSlider.hoverable .rangeHandle:hover .rangeFloat {
		opacity: 1;
		top: -0.2em;
		transform: translate(-50%, -100%);
	}
	.rangeSlider .rangeBar {
		position: absolute;
		display: block;
		transition: background 0.2s ease;
		border-radius: 1em;
		height: 0.45em;
		top: 0;
		user-select: none;
		z-index: 1;
		background-color: var(--color-range-inactive);
		box-shadow: 0 0 0 1px var(--color-range-inactive);
	}

	.rangeSlider.focus .rangeBar {
		box-shadow: 0 0 0 1px var(--color-handle-focus);
		background-color: var(--color-range);
	}

	.rangeSlider.disabled {
		opacity: 0.5;
	}
	.rangeSlider.disabled .rangeNub {
		background-color: var(--color-slider);
	}
</style>
