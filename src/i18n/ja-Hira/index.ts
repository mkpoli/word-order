import type { Translation } from '../i18n-types';

const jaHira: Translation = {
	meta: {
		title: 'ことばの ならびを えにする どうぐ'
	},
	params: {
		options: 'かえるところ',
		verticalGap: 'たての あいだ',
		lineGap: 'せんの あいだ',
		straightLength: 'まっすぐな ところ',
		endpointCorrection: 'せんの さきを なおす',
		textAlignment: 'もじの ならべかた',
		displayLanguage: 'つかう ことば',
		text: 'もじ',
		fontFamily: 'もじの みため',
		default: 'ふつう',
		serif: 'かざりつき',
		sansSerif: 'かざりなし',
		monospace: 'おなじ はば',
		fontStyle: 'もじの かたち',
		normal: 'ふつう',
		italic: 'ななめ',
		bold: 'ふとい',
		boldItalic: 'ふとくて ななめ',
		fontSize: 'もじの おおきさ'
	},
	input: {
		input: 'かくところ',
		placeholder: 'ここに あたらしい ぶんを かいてください…',
		add: 'たす',
		modify: 'なおす',
		guidance:
			'ことばは、できるときは そのことばに あわせて ひとりでに わけます。できないときは、あきや くぎりの しるしで わけます。もっと こまかく わけたいときは {delimiter} を つかってください。たとえば {example}'
	},
	tokenEditor: {
		tokens: 'わけた ことば',
		mergeSelected: 'えらんだ ものを つなげる',
		splitAtBoundary: 'ここで わける',
		selectTokens: 'わけた ことばを えらんでください'
	},
	footer: {
		info: 'この どうぐで つくった えを、「これは わたしたちのものです」とは いいません。どう つかうか、どう ひとに みせるかは、あなたが きめられます。この どうぐを ひとに おしえてくれると うれしいです。',
		githubRepository: 'GitHub の ページ',
		announcement: 'おしらせ',
		by: 'つくったひと'
	},
	ui: {
		selected: 'えらんでいます'
	},
	dialog: {
		editing: 'なおしています',
		confirm: 'これでいい',
		cancel: 'やめる'
	},
	confirm: {
		deleteSentence: 'この ぶんを けしても いいですか？',
		new: 'あたらしい えを つくりますか？ いまのものは ぜんぶ きえます。'
	},
	menu: {
		new: 'あたらしく つくる',
		import: 'よみこむ',
		export: 'かきだす',
		svg: 'SVG で かきだす',
		png: 'PNG で かきだす',
		scramble: 'いろを まぜる'
	}
};

export default jaHira;
