import type { Sentence } from './types';

export type Example = {
	id: string;
	name: string;
	sentences: Sentence[];
	equivalency: number[][][];
};

function s(lang: string, tokens: string[], glosses: string[] = [], below: string[] = []): Sentence {
	const lanesAbove = glosses.some(Boolean) ? 1 : 0;
	const lanesBelow = below.some(Boolean) ? 1 : 0;
	return {
		lang,
		lanesAbove,
		lanesBelow,
		showGloss: lanesAbove > 0 || lanesBelow > 0,
		tokens: tokens.map((text, i) => ({
			text,
			annotationsAbove: lanesAbove ? [glosses[i] ?? ''] : [],
			annotationsBelow: lanesBelow ? [below[i] ?? ''] : []
		}))
	};
}

export const EXAMPLES: Example[] = [
	{
		id: 'glass',
		name: 'I can eat glass',
		sentences: [
			s('en', ['I', ' ', 'can', ' ', 'eat', ' ', 'glass', ' ', 'and', ' ', 'it', ' ', 'doesn’t', ' ', 'hurt', ' ', 'me', '.']),
			s('zh-HanS', ['我', '能', '吞下', '玻璃', '而', '不', '伤', '身体', '。']),
			s('zh-HanT', ['我', '能', '吞下', '玻璃', '而', '不', '傷', '身體', '。']),
			s('ja', ['<ruby>私<rt>わたし</rt></ruby>', 'は', 'ガラス', 'を', '食べ', 'れます', '。', 'それ', 'は', '私', 'を', '傷つけ', 'ません', '。'])
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
		]
	},
	{
		id: 'genesis-1-1',
		name: 'Genesis 1:1',
		sentences: [
			// 0:בְּרֵאשִׁית 1:space 2:בָּרָא 3:space 4:אֱלֹהִים 5:space 6:אֵת 7:space 8:הַשָּׁמַיִם 9:space 10:וְאֵת 11:space 12:הָאָרֶץ
			s('he', ['בְּרֵאשִׁית', ' ', 'בָּרָא', ' ', 'אֱלֹהִים', ' ', 'אֵת', ' ', 'הַשָּׁמַיִם', ' ', 'וְאֵת', ' ', 'הָאָרֶץ']),
			// 0:Ἐν 1:space 2:ἀρχῇ 3:space 4:ἐποίησεν 5:space 6:ὁ 7:space 8:θεὸς 9:space 10:τὸν 11:space 12:οὐρανὸν 13:space 14:καὶ 15:space 16:τὴν 17:space 18:γῆν
			s('grc', ['Ἐν', ' ', 'ἀρχῇ', ' ', 'ἐποίησεν', ' ', 'ὁ', ' ', 'θεὸς', ' ', 'τὸν', ' ', 'οὐρανὸν', ' ', 'καὶ', ' ', 'τὴν', ' ', 'γῆν']),
			// 0:In 1:space 2:principio 3:space 4:creavit 5:space 6:Deus 7:space 8:caelum 9:space 10:et 11:space 12:terram
			s('la', ['In', ' ', 'principio', ' ', 'creavit', ' ', 'Deus', ' ', 'caelum', ' ', 'et', ' ', 'terram']),
			// 0:In 1:space 2:the 3:space 4:beginning 5:space 6:God 7:space 8:created 9:space 10:the 11:space 12:heaven 13:space 14:and 15:space 16:the 17:space 18:earth
			s('en', ['In', ' ', 'the', ' ', 'beginning', ' ', 'God', ' ', 'created', ' ', 'the', ' ', 'heaven', ' ', 'and', ' ', 'the', ' ', 'earth'])
		],
		equivalency: [
			[[0], [0], [0], [0]], // "in" preposition (Hebrew prefix בְּ within word 0)
			[[0], [2], [2], [2, 4]], // "the beginning" — Hebrew רֵאשִׁית within word 0
			[[2], [4], [4], [8]], // "created"
			[[4], [6, 8], [6], [6]], // "God" (Greek includes article ὁ)
			[[6], [10], [], []], // accusative marker אֵת / τὸν (Latin & English have none)
			[[8], [12], [8], [10, 12]], // "the heaven(s)"
			[[10], [14], [10], [14]], // "and"
			[[10], [16], [], []], // second accusative marker
			[[12], [18], [12], [16, 18]] // "the earth"
		]
	},
	{
		id: 'sov-vs-svo',
		name: 'SOV vs SVO',
		sentences: [
			s('en', ['I', ' ', 'read', ' ', 'the', ' ', 'book', '.'], ['1SG', '', 'read', '', 'DEF', '', 'book', '']),
			s('ja', ['私', 'は', '本', 'を', '読む', '。'], ['1SG', 'TOP', 'book', 'ACC', 'read', '']),
			s('ko', ['나', '는', ' ', '책', '을', ' ', '읽는다', '.'], ['1SG', 'TOP', '', 'book', 'ACC', '', 'read.PRS', ''])
		],
		equivalency: [
			[[0], [0], [0]],
			[[2], [4], [6]],
			[[6], [2], [3]]
		]
	},
	{
		id: 'rtl',
		name: 'LTR · RTL',
		sentences: [
			// 0:I 1:space 2:love 3:space 4:coffee 5:.
			s('en', ['I', ' ', 'love', ' ', 'coffee', '.']),
			// 0:أنا 1:space 2:أحب 3:space 4:القهوة 5:.
			s('ar', ['أنا', ' ', 'أحب', ' ', 'القهوة', '.']),
			// 0:אני 1:space 2:אוהב 3:space 4:קפה 5:.
			s('he', ['אני', ' ', 'אוהב', ' ', 'קפה', '.'])
		],
		equivalency: [
			[[0], [0], [0]],
			[[2], [2], [2]],
			[[4], [4], [4]]
		]
	},
	{
		id: 'pro-drop',
		name: 'Pro-drop',
		sentences: [
			s('en', ['I', ' ', 'have', ' ', 'a', ' ', 'cat', '.'], ['1SG', '', 'have', '', 'INDF', '', 'cat', '']),
			s('es', ['Yo', ' ', 'tengo', ' ', 'un', ' ', 'gato', '.'], ['1SG', '', 'have.1SG', '', 'INDF', '', 'cat', '']),
			s('fr', ["J'", 'ai', ' ', 'un', ' ', 'chat', '.'], ['1SG', 'have.1SG', '', 'INDF', '', 'cat', '']),
			s('it', ['Ho', ' ', 'un', ' ', 'gatto', '.'], ['have.1SG', '', 'INDF', '', 'cat', ''])
		],
		equivalency: [
			[[0], [0], [0], []],
			[[2], [2], [1], [0]],
			[[4], [4], [3], [2]],
			[[6], [6], [5], [4]]
		]
	},
	{
		id: 'gloss-turkish',
		name: 'Turkish gloss',
		sentences: [
			s(
				'tr',
				['Ev', '-', 'ler', '-', 'iniz', '-', 'de', ' ', 'yaşı', '-', 'yor', '-', 'uz'],
				['house', '', 'PL', '', '2PL.POSS', '', 'LOC', '', 'live', '', 'PROG', '', '1PL']
			),
			s('en', ['We', ' ', 'are', ' ', 'living', ' ', 'in', ' ', 'your', ' ', 'houses', '.'])
		],
		equivalency: [
			[[0], [10]], // Ev = houses
			[[2], [10]], // -ler (PL) = (plural marker in 'houses')
			[[4], [8]], // -iniz (2PL.POSS) = your
			[[6], [6]], // -de (LOC) = in
			[[8], [4]], // yaşı = living
			[[10], [4]], // -yor (PROG) = -ing in living
			[[12], [0]] // -uz (1PL) = We
		]
	},
	{
		id: 'ainu-polysynthesis',
		name: 'Ainu polysynthesis',
		sentences: [
			// One Ainu verb packs subject, object, and stem into a single word
			// 0:a= 1:e= 2:nukar
			s('ain', ['a=', 'e=', 'nukar'], ['1SG.A', '2SG.O', 'see']),
			// 0:I 1:space 2:see 3:space 4:you 5:.
			s('en', ['I', ' ', 'see', ' ', 'you', '.'], ['1SG.A', '', 'see', '', '2SG.O', ''])
		],
		equivalency: [
			[[0], [0]], // a= (1SG.A) = I
			[[1], [4]], // e= (2SG.O) = you (note the position swap)
			[[2], [2]] // nukar = see
		]
	},
	{
		id: 'question-name',
		name: 'What is your name?',
		sentences: [
			// 0:What 1:space 2:is 3:space 4:your 5:space 6:name 7:?
			s('en', ['What', ' ', 'is', ' ', 'your', ' ', 'name', '?']),
			// 0:あなた 1:の 2:名前 3:は 4:何 5:です 6:か
			// "you-GEN name-TOP what COP Q" — wh-word stays in situ, near the end
			s('ja', ['あなた', 'の', '名前', 'は', '何', 'です', 'か']),
			// 0:आपका 1:space 2:नाम 3:space 4:क्या 5:space 6:है 7:?
			// "your.GEN name what COP" — wh-word before the verb
			s('hi', ['आपका', ' ', 'नाम', ' ', 'क्या', ' ', 'है', '?']),
			// 0:ما 1:space 2:اسمك 3:؟
			// "what your-name" — possessive is a clitic on 'name'
			s('ar', ['ما', ' ', 'اسمك', '؟'])
		],
		equivalency: [
			[[0], [4], [4], [0]], // what
			[[4], [0], [0], [2]], // your (ar: -k clitic on اسمك)
			[[6], [2], [2], [2]] // name (ar: stem of اسمك)
		]
	},
	{
		id: 'numbers-1-5',
		name: 'Numbers 1–5',
		sentences: [
			// 0:one 1:space 2:two 3:space 4:three 5:space 6:four 7:space 8:five
			s('en', ['one', ' ', 'two', ' ', 'three', ' ', 'four', ' ', 'five']),
			s('hi', ['एक', ' ', 'दो', ' ', 'तीन', ' ', 'चार', ' ', 'पाँच']),
			s('vi', ['một', ' ', 'hai', ' ', 'ba', ' ', 'bốn', ' ', 'năm']),
			s('fi', ['yksi', ' ', 'kaksi', ' ', 'kolme', ' ', 'neljä', ' ', 'viisi']),
			s('ar', ['واحد', ' ', 'اثنان', ' ', 'ثلاثة', ' ', 'أربعة', ' ', 'خمسة'])
		],
		equivalency: [
			[[0], [0], [0], [0], [0]], // 1
			[[2], [2], [2], [2], [2]], // 2
			[[4], [4], [4], [4], [4]], // 3
			[[6], [6], [6], [6], [6]], // 4
			[[8], [8], [8], [8], [8]] // 5
		]
	},
	{
		id: 'romanization-above-below',
		name: 'Romanization + gloss',
		sentences: [
			s(
				'ja',
				['私', 'は', '本', 'を', '読む', '。'],
				['1SG', 'TOP', 'book', 'ACC', 'read', ''],
				['watashi', 'wa', 'hon', 'o', 'yomu', '']
			),
			s(
				'zh-HanS',
				['我', '读', '书', '。'],
				['1SG', 'read', 'book', ''],
				['wǒ', 'dú', 'shū', '']
			),
			s('en', ['I', ' ', 'read', ' ', 'a', ' ', 'book', '.'], ['1SG', '', 'read', '', 'INDF', '', 'book', ''])
		],
		equivalency: [
			[[0], [0], [0]],
			[[4], [1], [2]],
			[[2], [2], [6]]
		]
	},
	{
		id: 'plural-strategies',
		name: 'Plural strategies',
		sentences: [
			// 0:two 1:space 2:book 3:s — suffix
			s('en', ['two', ' ', 'book', 's']),
			// 0:两 1:本 2:书 — numeral + classifier + bare noun, no plural marker
			s('zh-HanS', ['两', '本', '书']),
			// 0:dua 1:space 2:buku — bare noun, plural inferred from numeral
			s('id', ['dua', ' ', 'buku']),
			// 0:две 1:space 2:книги — case- and gender-marked plural via suffix
			s('ru', ['две', ' ', 'книги']),
			// 0:kaksi 1:space 2:kirjaa — numeral triggers partitive singular
			s('fi', ['kaksi', ' ', 'kirjaa'])
		],
		equivalency: [
			[[0], [0], [0], [0], [0]], // two
			[[2], [2], [2], [2], [2]], // book
			[[3], [], [], [], []], // -s (English plural suffix)
			[[], [1], [], [], []] // 本 (Chinese classifier)
		]
	}
];
