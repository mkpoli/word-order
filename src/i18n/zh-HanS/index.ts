import type { Translation } from '../i18n-types';

const zh: Translation = {
	params: {
		options: '选项',
		verticalGap: '行距',
		lineGap: '线距',
		straightLength: '直线长度',
		textAlignment: '文本对齐方式',
		endpointCorrection: '端点校正',
		displayLanguage: '显示语言',
		text: '文本',
		fontFamily: '字体',
		default: '默认',
		serif: '衬线体',
		sansSerif: '非衬线体',
		monospace: '等宽字体',
		fontStyle: '字体样式',
		normal: '普通',
		italic: '斜体',
		bold: '粗体',
		boldItalic: '粗斜体',
		fontSize: '字体大小'
	},
	input: {
		input: '输入',
		placeholder: '在此输入新的句子……',
		add: '添加',
		modify: '修改',
		guidance: '支持时会按语言自动分词，否则回退为空格和标点分词。使用{delimiter}可以进一步精细分隔，例如{example}'
	},
	tokenEditor: {
		tokens: '词元',
		mergeSelected: '合并所选',
		splitAtBoundary: '在此处分割词元',
		selectTokens: '请选择词元'
	},
	footer: {
		info: '使用本应用生成的图像以{license}释出，意即于公有领域公开，完全自由使用。不过也欢迎分享并在使用时标注出处。'
	},
	dialog: {
		editing: '正在编辑',
		confirm: '确认',
		cancel: '取消'
	},
	confirm: {
		deleteSentence: '确定要删除这个句子吗？',
		new: '确定要创建一个新的图像吗？这将删除所有内容！'
	},
	menu: {
		new: '新建',
		import: '导入',
		export: '导出',
		svg: '导出SVG',
		png: '导出PNG',
		scramble: '打乱颜色顺序'
	}
};

export default zh;
