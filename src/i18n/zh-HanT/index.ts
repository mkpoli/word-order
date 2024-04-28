import type { Translation } from '../i18n-types';

const zh: Translation = {
	params: {
		options: '選項',
		verticalGap: '行距',
		lineGap: '線距',
		straightLength: '直線長度',
		textAlignment: '文字對齊方式',
		displayLanguage: '顯示語言',
		text: '文字',
		fontFamily: '字體',
		default: '預設',
		serif: '襯線體',
		sansSerif: '非襯線體',
		monospace: '等寬字體',
		fontStyle: '字體樣式',
		normal: '普通',
		italic: '斜體',
		bold: '粗體',
		boldItalic: '粗斜體',
		fontSize: '字體大小'
	},
	input: {
		input: '輸入',
		placeholder: '在此輸入新的句子……',
		add: '加入',
		modify: '修改',
		guidance: '空格和標點符號自動分詞。使用{delimiter}來進一步分隔或用於中日韓泰藏等不使用空格分詞的語言，例如{example}'
	},
	footer: {
		info: '使用本程式產生的圖像以{license}釋出，意即於公有領域公開，完全自由使用。不過也歡迎分享並在使用時標註出處。'
	},
	dialog: {
		editing: '正在編輯',
		confirm: '確認',
		cancel: '取消'
	},
	confirm: {
		deleteSentence: '確定要刪除這個句子嗎？',
		new: '確定要新增一個新的圖像嗎？這將刪除所有資料！'
	},
	menu: {
		new: '新增',
		import: '匯入',
		export: '匯出',
		svg: '匯出SVG',
		png: '匯出PNG'
	}
};

export default zh;
