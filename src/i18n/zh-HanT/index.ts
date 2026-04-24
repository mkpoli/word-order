import type { Translation } from '../i18n-types';

const zh: Translation = {
	meta: {
		title: '語序示意圖工具'
	},
	params: {
		options: '選項',
		verticalGap: '行距',
		lineGap: '線距',
		straightLength: '直線長度',
		textAlignment: '文字對齊方式',
		endpointCorrection: '端點校正',
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
		guidance: '支援時會按語言自動分詞，否則回退為空格和標點分詞。使用{delimiter}可以進一步精細分隔，例如{example}'
	},
	tokenEditor: {
		tokens: '詞元',
		mergeSelected: '合併所選',
		splitAtBoundary: '在此處分割詞元',
		selectTokens: '請選擇詞元'
	},
	footer: {
		info: '本工具不會對產生的圖像主張任何權利，請您自行決定如何使用或發布。歡迎分享本工具，並在使用時標註出處。',
		githubRepository: 'GitHub 倉庫',
		announcement: '發布說明',
		by: '作者'
	},
	ui: {
		selected: '已選擇'
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
		png: '匯出PNG',
		scramble: '打亂顏色順序'
	}
};

export default zh;
