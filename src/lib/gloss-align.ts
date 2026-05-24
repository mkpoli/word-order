import type { Sentence } from './types';

function key(sentenceIdx: number, tokenIdx: number): string {
	return `${sentenceIdx}:${tokenIdx}`;
}

/**
 * Adds new equivalency groups by bucketing tokens across sentences by their gloss text.
 *
 * Only considers tokens that are NOT already in an existing equivalency group, so
 * user-made manual connections are preserved. A new group is created only when at
 * least one of the matched tokens belongs to one of `newSentenceIndices` (i.e. a
 * sentence that was just added), so re-running this is idempotent.
 *
 * Sentences without any glosses are ignored — their tokens never bucket — matching
 * the "if existing is unglossed, then ignore" requirement.
 */
export function addGlossAlignments(
	sentences: Sentence[],
	existing: number[][][],
	newSentenceIndices: number[]
): number[][][] {
	const covered = new Set<string>();
	for (const group of existing) {
		for (const [si, tokens] of group.entries()) {
			for (const ti of tokens) covered.add(key(si, ti));
		}
	}

	const newSet = new Set(newSentenceIndices);
	const buckets = new Map<string, Array<[number, number]>>();

	for (const [si, sentence] of sentences.entries()) {
		const sentenceHasAnyGloss = sentence.tokens.some((t) => t.gloss.trim().length > 0);
		if (!sentenceHasAnyGloss) continue;
		for (const [ti, tok] of sentence.tokens.entries()) {
			const g = tok.gloss.trim();
			if (!g) continue;
			if (covered.has(key(si, ti))) continue;
			let bucket = buckets.get(g);
			if (!bucket) {
				bucket = [];
				buckets.set(g, bucket);
			}
			bucket.push([si, ti]);
		}
	}

	const next: number[][][] = [...existing];
	for (const bucket of buckets.values()) {
		const hasNew = bucket.some(([si]) => newSet.has(si));
		if (!hasNew) continue;
		const sentSet = new Set(bucket.map(([si]) => si));
		if (sentSet.size < 2) continue;

		const row: number[][] = Array.from({ length: sentences.length }, () => []);
		for (const [si, ti] of bucket) row[si].push(ti);
		next.push(row);
	}
	return next;
}
