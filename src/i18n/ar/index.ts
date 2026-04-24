import type { Translation } from '../i18n-types';

const ar: Translation = {
	meta: {
		title: 'رسام ترتيب الكلمات'
	},
	params: {
		options: 'الخيارات',
		verticalGap: 'التباعد العمودي',
		lineGap: 'تباعد الخطوط',
		straightLength: 'الجزء المستقيم',
		endpointCorrection: 'تصحيح نقطة النهاية',
		textAlignment: 'محاذاة النص',
		displayLanguage: 'لغة الواجهة',
		text: 'النص',
		fontFamily: 'عائلة الخط',
		default: 'افتراضي',
		serif: 'سيريف',
		sansSerif: 'بلا سيريف',
		monospace: 'ثابت العرض',
		fontStyle: 'نمط الخط',
		normal: 'عادي',
		italic: 'مائل',
		bold: 'عريض',
		boldItalic: 'عريض مائل',
		fontSize: 'حجم الخط'
	},
	input: {
		input: 'إدخال',
		placeholder: 'أدخل جملة جديدة هنا…',
		add: 'إضافة',
		modify: 'تعديل',
		guidance:
			'تُقسَّم الكلمات تلقائيا وفق اللغة عند توفر ذلك، وإلا يُستخدم الفراغ وعلامات الترقيم كحل بديل. استخدم {delimiter} لتحكم أدق، مثل {example}'
	},
	tokenEditor: {
		tokens: 'الرموز',
		mergeSelected: 'دمج المحدد',
		splitAtBoundary: 'تقسيم الرمز عند هذه النقطة',
		selectTokens: 'حدد رمزا واحدا أو أكثر'
	},
	footer: {
		info: 'لا يدعي هذا التطبيق أي حقوق على الرسومات التي تنشئها هنا. لك الحرية الكاملة في كيفية استخدامها أو مشاركتها. نقدر مشاركة هذه الأداة.',
		githubRepository: 'مستودع GitHub',
		announcement: 'منشور الإعلان',
		by: 'بواسطة'
	},
	ui: {
		selected: 'محدد'
	},
	dialog: {
		editing: 'جارٍ التعديل',
		confirm: 'تأكيد',
		cancel: 'إلغاء'
	},
	confirm: {
		deleteSentence: 'هل أنت متأكد من رغبتك في حذف هذه الجملة؟',
		new: 'هل أنت متأكد من رغبتك في إنشاء رسم جديد؟ سيؤدي هذا إلى حذف كل شيء.'
	},
	menu: {
		new: 'جديد',
		import: 'استيراد',
		export: 'تصدير',
		svg: 'تصدير SVG',
		png: 'تصدير PNG',
		scramble: 'خلط الألوان'
	}
};

export default ar;
