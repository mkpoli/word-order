import type { Translation } from '../i18n-types';

const fa: Translation = {
	meta: { title: 'تصویرگر ترتیب واژه‌ها' },
	params: {
		options: 'گزینه‌ها',
		verticalGap: 'فاصله عمودی',
		lineGap: 'فاصله خط',
		straightLength: 'بخش مستقیم',
		endpointCorrection: 'اصلاح نقطه پایان',
		textAlignment: 'تراز متن',
		displayLanguage: 'زبان نمایش',
		text: 'متن',
		fontFamily: 'خانواده قلم',
		default: 'پیش‌فرض',
		serif: 'سریف',
		sansSerif: 'بدون سریف',
		monospace: 'تک‌فاصله',
		fontStyle: 'سبک قلم',
		normal: 'عادی',
		italic: 'کج',
		bold: 'پررنگ',
		boldItalic: 'پررنگ کج',
		fontSize: 'اندازه قلم'
	},
	input: {
		input: 'ورودی',
		placeholder: 'جمله تازه را اینجا وارد کنید…',
		add: 'افزودن',
		modify: 'ویرایش',
		guidance:
			'واژه‌ها در صورت امکان به‌طور خودکار با بخش‌بندی مناسب زبان جدا می‌شوند؛ در غیر این صورت از فاصله و نشانه‌گذاری استفاده می‌شود. برای کنترل دقیق‌تر از {delimiter} استفاده کنید، مانند {example}'
	},
	tokenEditor: {
		tokens: 'قطعه‌ها',
		mergeSelected: 'ادغام انتخاب‌شده‌ها',
		splitAtBoundary: 'جداسازی قطعه در این مرز',
		selectTokens: 'قطعه‌ها را انتخاب کنید'
	},
	footer: {
		info: 'این برنامه هیچ حقی بر تصویرهایی که اینجا می‌سازید ادعا نمی‌کند. شیوه استفاده یا اشتراک‌گذاری آن‌ها کاملاً به خود شما بستگی دارد. معرفی این ابزار مایه قدردانی است.',
		githubRepository: 'مخزن GitHub',
		announcement: 'نوشته اعلام',
		by: 'از'
	},
	ui: { selected: 'انتخاب‌شده' },
	dialog: { editing: 'در حال ویرایش', confirm: 'تأیید', cancel: 'لغو' },
	confirm: {
		deleteSentence: 'مطمئنید که می‌خواهید این جمله را حذف کنید؟',
		new: 'مطمئنید که می‌خواهید تصویر تازه‌ای بسازید؟ همه چیز حذف خواهد شد.'
	},
	menu: { new: 'جدید', import: 'وارد کردن', export: 'خروجی گرفتن', svg: 'خروجی SVG', png: 'خروجی PNG', scramble: 'درهم‌ریختن رنگ‌ها' }
};

export default fa;
