<script lang="ts" context="module">
	export type Margin = { top: number; right: number; bottom: number; left: number };
</script>

<script lang="ts">
	export let value: Margin;
	export let min = 0;
	export let max = 200;

	$: linked = value.top === value.right && value.right === value.bottom && value.bottom === value.left;

	function clamp(n: number): number {
		if (!Number.isFinite(n)) return min;
		return Math.max(min, Math.min(max, Math.round(n)));
	}

	function setSide(side: keyof Margin, raw: number) {
		const v = clamp(raw);
		if (linked) {
			value = { top: v, right: v, bottom: v, left: v };
		} else {
			value = { ...value, [side]: v };
		}
	}

	function toggleLink() {
		if (linked) {
			// breaking the link: keep current values
			linked = false;
		} else {
			// re-linking: snap all to top
			value = { top: value.top, right: value.top, bottom: value.top, left: value.top };
		}
	}
</script>

<div class="margin-input" role="group" aria-label="Margins">
	<div class="cell corner" />
	<label class="cell side top">
		<span class="vh">Top</span>
		<input
			type="number"
			{min}
			{max}
			value={value.top}
			on:input={(e) => setSide('top', +e.currentTarget.value)}
		/>
	</label>
	<div class="cell corner" />

	<label class="cell side left">
		<span class="vh">Left</span>
		<input
			type="number"
			{min}
			{max}
			value={value.left}
			on:input={(e) => setSide('left', +e.currentTarget.value)}
		/>
	</label>
	<button
		type="button"
		class="cell lock"
		class:linked
		title={linked ? 'Sides are linked' : 'Sides are independent'}
		aria-label={linked ? 'Unlink sides' : 'Link sides'}
		aria-pressed={linked}
		on:click={toggleLink}
	>
		<iconify-icon icon={linked ? 'mdi:link-variant' : 'mdi:link-variant-off'} inline="true" />
	</button>
	<label class="cell side right">
		<span class="vh">Right</span>
		<input
			type="number"
			{min}
			{max}
			value={value.right}
			on:input={(e) => setSide('right', +e.currentTarget.value)}
		/>
	</label>

	<div class="cell corner" />
	<label class="cell side bottom">
		<span class="vh">Bottom</span>
		<input
			type="number"
			{min}
			{max}
			value={value.bottom}
			on:input={(e) => setSide('bottom', +e.currentTarget.value)}
		/>
	</label>
	<div class="cell corner" />
</div>

<style>
	.margin-input {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto 1fr auto;
		gap: 0.25em;
		padding: 0.3em;
		border: 1px dashed rgb(46 91 255 / 0.35);
		border-radius: 0.35em;
		background:
			linear-gradient(transparent, transparent) padding-box,
			repeating-linear-gradient(
					45deg,
					rgb(46 91 255 / 0.05) 0 0.3em,
					transparent 0.3em 0.6em
				)
				border-box;
		align-items: center;
		justify-items: center;
	}

	.cell {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.corner {
		width: 1em;
		height: 1em;
	}

	.side input {
		width: 3.2em;
		padding: 0.2em 0.35em;
		text-align: center;
		font: inherit;
		font-size: 0.9em;
		border: 1px solid rgb(0 0 0 / 0.15);
		border-radius: 0.25em;
		background: white;
		color: #333;
	}

	.side input:focus {
		outline: 2px solid rgb(46 91 255 / 0.4);
		outline-offset: 0;
	}

	/* hide spinners */
	.side input::-webkit-outer-spin-button,
	.side input::-webkit-inner-spin-button {
		appearance: none;
		margin: 0;
	}
	.side input {
		-moz-appearance: textfield;
	}

	.lock {
		appearance: none;
		background: white;
		border: 1px solid rgb(0 0 0 / 0.12);
		border-radius: 999px;
		width: 1.75em;
		height: 1.75em;
		font-size: 1em;
		cursor: pointer;
		color: #888;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 120ms ease,
			border-color 120ms ease,
			background-color 120ms ease;
	}

	.lock:hover {
		background: rgb(46 91 255 / 0.06);
	}

	.lock.linked {
		color: rgb(33 56 199);
		border-color: rgb(46 91 255 / 0.4);
		background: rgb(46 91 255 / 0.08);
	}

	/* visually-hidden label text — keeps the input accessible */
	.vh {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
</style>
