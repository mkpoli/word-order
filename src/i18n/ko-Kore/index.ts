import type { Translation } from '../i18n-types';

const koKore: Translation = {
	meta: {
		title: '語順 일러스트레이터'
	},
	params: {
		options: '選擇 사항',
		verticalGap: '垂直 間隔',
		lineGap: '直線 틈',
		straightLength: '直線 길이',
		endpointCorrection: '終點 補正',
		textAlignment: '文字 整列',
		displayLanguage: '表示 言語',
		text: '文字',
		fontFamily: '글꼴',
		default: '基本',
		serif: '세리프',
		sansSerif: '산세리프',
		monospace: '固定 幅',
		fontStyle: '글꼴 樣式',
		normal: '一般',
		italic: '이탤릭',
		bold: '볼드',
		boldItalic: '볼드 이탤릭',
		fontSize: '글꼴 크기'
	},
	input: {
		input: '入力',
		placeholder: '새 文章을 여기에 入力하세요…',
		add: '追加',
		modify: '修正',
		guidance:
			'單語는 支援되는 環境에서는 言語에 맞게 自動 分離되며, 使用할 수 없을 때는 空白과 文章 符號를 基準으로 分離됩니다. 더 細密하게 나누려면 {delimiter}을 使用하세요. 例: {example}'
	},
	tokenEditor: {
		tokens: '토큰',
		mergeSelected: '選擇 倂合',
		splitAtBoundary: '이 境界에서 토큰 分割',
		selectTokens: '토큰 選擇'
	},
	footer: {
		info: '이 도구로 生成한 이미지에 對해 本 도구는 어떠한 權利도 主張하지 않습니다. 使用하거나 公開하는 方式은 自由롭게 決定하실 수 있습니다. 이 도구를 共有해 주시거나 出處를 남겨 주시면 製作者에게 큰 기쁨이 됩니다.',
		githubRepository: 'GitHub 貯藏所',
		announcement: '案內 게시물',
		by: '製作'
	},
	ui: {
		selected: '選擇됨'
	},
	dialog: {
		editing: '編輯 中',
		confirm: '確認',
		cancel: '取消'
	},
	confirm: {
		deleteSentence: '이 文章을 削除하시겠습니까?',
		new: '새 揷畵를 만드시겠습니까? 이 機能은 모든 데이터를 削除합니다!'
	},
	menu: {
		new: '새로 만들기',
		import: '가져오기',
		export: '내보내기',
		svg: 'SVG 내보내기',
		png: 'PNG 내보내기',
		scramble: '色相 섞기'
	}
};

export default koKore;
