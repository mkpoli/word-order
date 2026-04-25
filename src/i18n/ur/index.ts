import type { Translation } from '../i18n-types';

const ur: Translation = {
	meta: { title: 'لفظی ترتیب کا مصور' },
	params: {
		options: 'اختیارات',
		verticalGap: 'عمودی فاصلہ',
		lineGap: 'لکیر کا فاصلہ',
		straightLength: 'سیدھا حصہ',
		endpointCorrection: 'آخری نقطے کی درستی',
		textAlignment: 'متن کی سیدھ',
		displayLanguage: 'نمائشی زبان',
		text: 'متن',
		fontFamily: 'فونٹ خاندان',
		default: 'طے شدہ',
		serif: 'سیرف',
		sansSerif: 'بے سیرف',
		monospace: 'یکساں چوڑائی',
		fontStyle: 'فونٹ انداز',
		normal: 'عام',
		italic: 'ترچھا',
		bold: 'جلی',
		boldItalic: 'جلی ترچھا',
		fontSize: 'فونٹ کا سائز'
	},
	input: {
		input: 'اندراج',
		placeholder: 'نیا جملہ یہاں درج کریں…',
		add: 'شامل کریں',
		modify: 'ترمیم کریں',
		guidance:
			'ممکن ہو تو الفاظ زبان کے مطابق خودکار تقسیم سے جدا کیے جاتے ہیں، ورنہ خالی جگہوں اور اوقاف کو استعمال کیا جاتا ہے۔ زیادہ باریک کنٹرول کے لیے {delimiter} استعمال کریں، مثلاً {example}'
	},
	tokenEditor: {
		tokens: 'ٹکڑے',
		mergeSelected: 'منتخب کو ملائیں',
		splitAtBoundary: 'اس حد پر ٹکڑا تقسیم کریں',
		selectTokens: 'ٹکڑے منتخب کریں'
	},
	footer: {
		info: 'یہ ایپ یہاں بنائی گئی آپ کی تصویروں پر کوئی حق دعویٰ نہیں کرتی۔ آپ انہیں کیسے استعمال یا شیئر کرتے ہیں، یہ مکمل طور پر آپ پر ہے۔ اس اوزار کو شیئر کرنا قابلِ قدر ہے۔',
		githubRepository: 'GitHub ذخیرہ',
		announcement: 'اعلانیہ پوسٹ',
		by: 'از'
	},
	ui: { selected: 'منتخب' },
	dialog: { editing: 'ترمیم جاری ہے', confirm: 'تصدیق', cancel: 'منسوخ' },
	confirm: {
		deleteSentence: 'کیا آپ واقعی یہ جملہ حذف کرنا چاہتے ہیں؟',
		new: 'کیا آپ واقعی نئی تصویر بنانا چاہتے ہیں؟ اس سے سب کچھ حذف ہو جائے گا۔'
	},
	menu: { new: 'نیا', import: 'درآمد', export: 'برآمد', svg: 'SVG برآمد', png: 'PNG برآمد', scramble: 'رنگ بدلیں' }
};

export default ur;
