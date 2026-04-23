import type { Translation } from '../i18n-types';

const ja: Translation = {
	params: {
		options: 'オプション',
		verticalGap: '行間隔',
		lineGap: '直線隙間',
		straightLength: '直線部分',
		endpointCorrection: '終点補正',
		textAlignment: 'テキスト配置',
		displayLanguage: '表示言語',
		text: 'テキスト',
		fontFamily: 'フォント',
		default: 'デフォルト',
		serif: '明朝体',
		sansSerif: 'ゴシック体',
		monospace: '等幅体',
		fontStyle: 'フォントスタイル',
		normal: '標準',
		italic: '斜体',
		bold: '太字',
		boldItalic: '太斜体',
		fontSize: 'フォントサイズ'
	},
	input: {
		input: '入力',
		placeholder: '新しい文章を入力してください……',
		add: '追加',
		modify: '修正',
		guidance:
			'単語は対応している環境では言語に応じて自動分割され、利用できない場合は空白や約物で分割されます。さらに細かく区切りたい場合は、{delimiter}を使用してください。例えば、{example}'
	},
	tokenEditor: {
		tokens: 'トークン',
		mergeSelected: '選択を結合',
		splitAtBoundary: 'この位置でトークンを分割',
		selectTokens: 'トークンを選択'
	},
	footer: {
		info: 'このツールで生成したイラストについては、こちら側で権利を主張することはありません。利用や公開の仕方を自由にお決めいただけます。利用する際にこのページをシェアしてくださると、製作者が歓びます。'
	},
	dialog: {
		editing: '編集中',
		confirm: '確認',
		cancel: 'キャンセル'
	},
	confirm: {
		deleteSentence: 'この文を削除してもよろしいですか？',
		new: '新しいイラストを作成しますか？この操作は全てを削除します!!!'
	},
	menu: {
		new: '新規',
		import: 'インポート',
		export: 'エクスポート',
		svg: 'SVG出力',
		png: 'PNG出力',
		scramble: '色を並べ替え'
	}
};

export default ja;
