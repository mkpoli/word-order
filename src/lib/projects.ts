import type { Sentence, SentenceData } from './types';
import { normalizeSentence } from './types';

export type Project = {
	id: string;
	name: string;
	sentences: Sentence[];
	equivalency: number[][][];
	createdAt: number;
	updatedAt: number;
};

export type PersistedState = {
	schemaVersion: 1;
	projects: Project[];
	activeId: string;
};

const STORAGE_KEY = 'word-order:state';
const SCHEMA_VERSION = 1 as const;

function randomId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyProject(name = ''): Project {
	const now = Date.now();
	return {
		id: randomId(),
		name,
		sentences: [],
		equivalency: [],
		createdAt: now,
		updatedAt: now
	};
}

const DEFAULT_SAMPLE = (): Project => ({
	id: randomId(),
	name: '',
	sentences: [
		{
			lang: 'en',
			showGloss: false,
			tokens: ['I', ' ', 'can', ' ', 'eat', ' ', 'glass', ' ', 'and', ' ', 'it', ' ', 'doesn’t', ' ', 'hurt', ' ', 'me', '.'].map((text) => ({ text, gloss: '' }))
		},
		{
			lang: 'zh-HanS',
			showGloss: false,
			tokens: ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体', '。'].map((text) => ({ text, gloss: '' }))
		},
		{
			lang: 'zh-HanT',
			showGloss: false,
			tokens: ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體', '。'].map((text) => ({ text, gloss: '' }))
		},
		{
			lang: 'ja',
			showGloss: false,
			tokens: ['<ruby>私<rt>わたし</rt></ruby>', 'は', 'ガラス', 'を', '食べ', 'れます', '。', 'それ', 'は', '私', 'を', '傷つけ', 'ません', '。'].map((text) => ({
				text,
				gloss: ''
			}))
		}
	],
	equivalency: [
		[[0], [0], [0], [0, 1]],
		[[2], [1], [1], [5]],
		[[4], [2], [2], [4]],
		[[6], [3], [3], [2, 3]],
		[[8], [4], [4], []],
		[[10], [], [], [7, 8]],
		[[12], [5], [5], [12]],
		[[14], [6], [6], [11]],
		[[16], [], [], [9, 10]],
		[[], [7], [7], []]
	],
	createdAt: Date.now(),
	updatedAt: Date.now()
});

export function createDefaultState(): PersistedState {
	const sample = DEFAULT_SAMPLE();
	return { schemaVersion: SCHEMA_VERSION, projects: [sample], activeId: sample.id };
}

type LegacyDoc = { sentences: SentenceData[]; equivalency: number[][][] };

function normalizeProject(raw: unknown): Project | null {
	if (!raw || typeof raw !== 'object') return null;
	const candidate = raw as Partial<Project> & { sentences?: SentenceData[] };
	if (!Array.isArray(candidate.sentences) || !Array.isArray(candidate.equivalency)) return null;

	const now = Date.now();
	return {
		id: typeof candidate.id === 'string' && candidate.id ? candidate.id : randomId(),
		name: typeof candidate.name === 'string' ? candidate.name : '',
		sentences: candidate.sentences.map(normalizeSentence),
		equivalency: candidate.equivalency as number[][][],
		createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : now,
		updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : now
	};
}

export function loadState(): PersistedState {
	if (typeof localStorage === 'undefined') return createDefaultState();

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return createDefaultState();

	try {
		const parsed = JSON.parse(raw);

		// Current schema
		if (parsed && typeof parsed === 'object' && parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.projects)) {
			const projects: Project[] = parsed.projects.map(normalizeProject).filter((p: Project | null): p is Project => p !== null);
			if (projects.length === 0) return createDefaultState();
			const activeId = typeof parsed.activeId === 'string' && projects.some((p: Project) => p.id === parsed.activeId) ? parsed.activeId : projects[0].id;
			return { schemaVersion: SCHEMA_VERSION, projects, activeId };
		}

		// Legacy single-doc shape
		if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sentences) && Array.isArray(parsed.equivalency)) {
			const project = projectFromDoc(parsed as LegacyDoc);
			return { schemaVersion: SCHEMA_VERSION, projects: [project], activeId: project.id };
		}
	} catch {
		// fall through
	}

	return createDefaultState();
}

export function saveState(state: PersistedState): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// quota or other failure — best effort
	}
}

export function projectFromDoc(doc: LegacyDoc, name = ''): Project {
	const now = Date.now();
	return {
		id: randomId(),
		name,
		sentences: doc.sentences.map(normalizeSentence),
		equivalency: doc.equivalency,
		createdAt: now,
		updatedAt: now
	};
}

export function projectToDoc(project: Project): LegacyDoc {
	return { sentences: project.sentences, equivalency: project.equivalency };
}

const RUBY_RE = /<ruby>(.*?)<\/ruby>/gu;
const RT_RE = /<rt>.*?<\/rt>/gu;

export function derivedProjectName(project: Project, fallback: string): string {
	if (project.name.trim()) return project.name;
	const first = project.sentences[0];
	if (!first) return fallback;
	const text = first.tokens
		.map((t) => t.text)
		.join('')
		.replace(RT_RE, '')
		.replace(RUBY_RE, '$1')
		.trim();
	if (!text) return fallback;
	return text.length > 24 ? text.slice(0, 24) + '…' : text;
}

export function isProjectEmpty(project: Project): boolean {
	return project.sentences.length === 0 && project.equivalency.length === 0;
}
