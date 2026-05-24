import type { Sentence, SentenceToken } from './types';

function tokenAnnotations(tok: SentenceToken): string[] {
	const annots: string[] = [];
	for (const a of tok.annotationsAbove) if (a) annots.push(a);
	for (const a of tok.annotationsBelow) if (a) annots.push(a);
	return annots;
}

function normalize(s: string): string {
	return s
		.toLowerCase()
		.replace(/<ruby>[^<]*<\/ruby>/gi, (m) => {
			// extract base text (before <rt>)
			const inner = m.replace(/<ruby>|<\/ruby>|<rt>[^<]*<\/rt>/gi, '');
			return inner;
		})
		.replace(/[\p{P}\p{S}\s]+/gu, '')
		.trim();
}

/**
 * Strip morphology suffixes a model adds despite the prompt:
 *   "me.DAT" → "me", "can.1SG" → "can", "i.TOP-i.TOP" → "i", "hurt.CONNEG" → "hurt"
 * Keeps multi-character glosses with underscores intact ("to_me" stays "to_me").
 */
function normalizeGlossKey(g: string): string {
	return g
		.toLowerCase()
		.split(/[.\-]/)[0]
		.trim();
}

/**
 * Adds equivalency groups by bucketing tokens across sentences by their gloss text.
 *
 * For each gloss bucket that includes at least one of `newSentenceIndices`:
 *  - if any token in the bucket is already in an existing equivalency group, ADD the
 *    other bucket tokens to that group (merge);
 *  - otherwise, if the gloss matches (exact OR normalised-surface match) some token in
 *    an existing group — even a glossless source token — add the bucket to THAT group;
 *  - otherwise, create a new group, but only if the bucket spans at least 2 sentences.
 *
 * This is what connects LLM-generated translations to the original sentences (whose
 * source-text surface form often equals the gloss the LLM produces, e.g. "glass" /
 * "eat"), and what merges new tokens into prior runs' groups when the user translates
 * incrementally.
 *
 * Manual user-made groups are preserved.
 */
export function addGlossAlignments(
	sentences: Sentence[],
	existing: number[][][],
	newSentenceIndices: number[]
): number[][][] {
	const newSet = new Set(newSentenceIndices);

	// Bucket every glossed token across all sentences by its NORMALISED gloss key
	// — strips morphology suffixes so "me.DAT" / "me.ACC" / "me" all share one bucket.
	const buckets = new Map<string, Array<[number, number]>>();
	for (const [si, sentence] of sentences.entries()) {
		for (const [ti, tok] of sentence.tokens.entries()) {
			const seen = new Set<string>();
			for (const annot of tokenAnnotations(tok)) {
				const key = normalizeGlossKey(annot);
				if (!key || seen.has(key)) continue;
				seen.add(key);
				let bucket = buckets.get(key);
				if (!bucket) {
					bucket = [];
					buckets.set(key, bucket);
				}
				bucket.push([si, ti]);
			}
		}
	}

	// Deep-copy existing groups so we can mutate freely.
	const next: number[][][] = existing.map((g) => g.map((r) => [...r]));

	// For each group, collect its label set: every gloss + normalised surface text of
	// the tokens it contains. Used to fuzzy-match new gloss buckets to old groups.
	function labelsFor(groupIdx: number): Set<string> {
		const labels = new Set<string>();
		const group = next[groupIdx];
		for (let si = 0; si < group.length; si++) {
			const sentence = sentences[si];
			if (!sentence) continue;
			for (const ti of group[si]) {
				const tok = sentence.tokens[ti];
				if (!tok) continue;
				for (const annot of tokenAnnotations(tok)) {
					const g = annot.trim();
					if (!g) continue;
					labels.add(g);
					labels.add(g.toLowerCase());
					labels.add(normalizeGlossKey(g));
				}
				const norm = normalize(tok.text);
				if (norm) labels.add(norm);
			}
		}
		return labels;
	}

	function findOverlap(bucket: Array<[number, number]>): number {
		for (let gi = 0; gi < next.length; gi++) {
			const group = next[gi];
			for (const [si, ti] of bucket) {
				if (group[si]?.includes(ti)) return gi;
			}
		}
		return -1;
	}

	function findByLabel(glossKey: string): number {
		// glossKey is already normalised (lowercase, no morphology suffix).
		const surfaceNorm = normalize(glossKey);
		for (let gi = 0; gi < next.length; gi++) {
			const labels = labelsFor(gi);
			if (labels.has(glossKey) || (surfaceNorm && labels.has(surfaceNorm))) {
				return gi;
			}
		}
		return -1;
	}

	function addToGroup(groupIdx: number, bucket: Array<[number, number]>) {
		const group = next[groupIdx];
		// Ensure the row has enough slots (in case the group was created before some sentences existed).
		while (group.length < sentences.length) group.push([]);
		for (const [si, ti] of bucket) {
			if (!group[si]) group[si] = [];
			if (!group[si].includes(ti)) group[si].push(ti);
		}
	}

	for (const [gloss, bucket] of buckets.entries()) {
		const hasNew = bucket.some(([si]) => newSet.has(si));
		if (!hasNew) continue;

		const overlapIdx = findOverlap(bucket);
		if (overlapIdx !== -1) {
			addToGroup(overlapIdx, bucket);
			continue;
		}

		const labelIdx = findByLabel(gloss);
		if (labelIdx !== -1) {
			addToGroup(labelIdx, bucket);
			continue;
		}

		// No existing target; create a new group only when the bucket spans at least 2 sentences.
		const sentSet = new Set(bucket.map(([si]) => si));
		if (sentSet.size < 2) continue;

		const row: number[][] = Array.from({ length: sentences.length }, () => []);
		for (const [si, ti] of bucket) row[si].push(ti);
		next.push(row);
	}

	return next;
}
