function getCharacterLength(text: string): number {
	return Array.from(text).length;
}

function getTokenRanges(tokens: string[]): Array<{ start: number; end: number }> {
	const ranges: Array<{ start: number; end: number }> = [];
	let start = 0;

	for (const token of tokens) {
		const end = start + getCharacterLength(token);
		ranges.push({ start, end });
		start = end;
	}

	return ranges;
}

function createCharacterToTokenMap(tokens: string[]): number[] {
	const map: number[] = [];

	for (const [tokenIndex, token] of tokens.entries()) {
		for (let i = 0; i < getCharacterLength(token); i++) {
			map.push(tokenIndex);
		}
	}

	return map;
}

function createLcsCharacterMap(source: string[], target: string[]): number[] {
	const dp = Array.from({ length: source.length + 1 }, () => new Array(target.length + 1).fill(0));

	for (let i = source.length - 1; i >= 0; i--) {
		for (let j = target.length - 1; j >= 0; j--) {
			dp[i][j] = source[i] === target[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
		}
	}

	const map = new Array(source.length).fill(-1);
	let i = 0;
	let j = 0;

	while (i < source.length && j < target.length) {
		if (source[i] === target[j] && dp[i][j] === dp[i + 1][j + 1] + 1) {
			map[i] = j;
			i++;
			j++;
			continue;
		}

		if (dp[i + 1][j] >= dp[i][j + 1]) {
			i++;
		} else {
			j++;
		}
	}

	return map;
}

function isContiguous(indices: number[]): boolean {
	for (let i = 1; i < indices.length; i++) {
		if (indices[i] !== indices[i - 1] + 1) return false;
	}

	return true;
}

function createTokenRemap(previousWords: string[], nextWords: string[]): number[][] {
	const previousChars = Array.from(previousWords.join(''));
	const nextChars = Array.from(nextWords.join(''));
	const previousRanges = getTokenRanges(previousWords);
	const nextCharToToken = createCharacterToTokenMap(nextWords);
	const charMap = createLcsCharacterMap(previousChars, nextChars);

	return previousRanges.map(({ start, end }) => {
		const targetTokens = new Set<number>();

		for (let i = start; i < end; i++) {
			const mappedIndex = charMap[i];
			if (mappedIndex === -1) return [];
			targetTokens.add(nextCharToToken[mappedIndex]);
		}

		const remappedTokens = [...targetTokens].sort((a, b) => a - b);
		return isContiguous(remappedTokens) ? remappedTokens : [];
	});
}

export function remapSentenceConnections(
	equivalency: number[][][],
	sentenceIndex: number,
	previousWords: string[],
	nextWords: string[]
): number[][][] {
	const tokenRemap = createTokenRemap(previousWords, nextWords);

	return equivalency.map((entry) =>
		entry.map((words, index) => {
			if (index !== sentenceIndex) return words;

			return [...new Set(words.flatMap((word) => tokenRemap[word] ?? []))];
		})
	);
}
