/**
 * Shared drag-preview permutation.
 *
 * While an equivalency row is being dragged, the visual order doesn't change
 * (the dragged row floats with the cursor; static rows stay put). What does
 * change is the *colour* each row would take if the drop happened — colours
 * are positional, so an entry moving from `from` → `to` is re-coloured to
 * `colors[to]`, and entries between `from` and `to` shift one slot to absorb
 * the gap.
 *
 * Both <Equivalency> (for row swatches + colour-bar) and <Output> (for SVG
 * connector line colours, via +page.svelte's display colours) use this — so
 * the entire preview reads as one synchronised motion instead of the phantom
 * sliding in isolation.
 */
export type DragPreview = { from: number; to: number } | null;

export function applyPreviewColors<T>(colors: T[], preview: DragPreview): T[] {
	if (!preview) return colors;
	const { from, to } = preview;
	if (from === to || from < 0 || from >= colors.length) return colors;
	return colors.map((_, i) => {
		let newPos = i;
		if (i === from) newPos = to;
		else if (from < to && i > from && i <= to) newPos = i - 1;
		else if (to < from && i >= to && i < from) newPos = i + 1;
		return colors[newPos];
	});
}
