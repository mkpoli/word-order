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
			'各単語は自動的にスペースや約物で区切られています。更に区切る場合や、日本語・中国語・タイ語等のスペースによって単語が分けられていない言語を区切りたい場合は、{delimiter}を使用してください。例えば、{example}'
	},
	footer: {
		info: 'このツールにて生成されたイラストは、{license}ライセンスにて公開されています。即ち完全著作権フリーであり、自由に使用することができます。また、強制ではないが、利用する際にシェアや引用リツイートすると製作者は歓びます。'
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
		png: 'PNG出力'
	}
};

export default ja;
