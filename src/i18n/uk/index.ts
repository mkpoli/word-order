import type { Translation } from '../i18n-types';

const uk: Translation = {
	meta: { title: 'Ілюстратор порядку слів' },
	params: {
		options: 'Параметри',
		verticalGap: 'Вертикальний проміжок',
		lineGap: 'Проміжок між лініями',
		straightLength: 'Пряма частина',
		endpointCorrection: 'Корекція кінцевої точки',
		textAlignment: 'Вирівнювання тексту',
		displayLanguage: 'Мова інтерфейсу',
		text: 'Текст',
		fontFamily: 'Шрифт',
		default: 'Типово',
		serif: 'Із зарубками',
		sansSerif: 'Без зарубок',
		monospace: 'Моноширинний',
		fontStyle: 'Стиль шрифту',
		normal: 'Звичайний',
		italic: 'Курсив',
		bold: 'Жирний',
		boldItalic: 'Жирний курсив',
		fontSize: 'Розмір шрифту'
	},
	input: {
		input: 'Введення',
		placeholder: 'Введіть тут нове речення…',
		add: 'Додати',
		modify: 'Змінити',
		guidance:
			'Слова автоматично розділяються за правилами мови, якщо це доступно; інакше використовуються пробіли та розділові знаки. Для точнішого керування використовуйте {delimiter}, наприклад {example}'
	},
	tokenEditor: {
		tokens: 'Токени',
		mergeSelected: 'Об’єднати вибране',
		splitAtBoundary: 'Розділити токен на цій межі',
		selectTokens: 'Виберіть токени'
	},
	footer: {
		info: 'Ця програма не претендує на права на ілюстрації, які ви створюєте тут. Як їх використовувати або поширювати, вирішуєте лише ви. Будемо вдячні, якщо ви поділитеся цим інструментом.',
		githubRepository: 'Репозиторій GitHub',
		announcement: 'Оголошення',
		by: 'автор'
	},
	ui: { selected: 'Вибрано' },
	dialog: { editing: 'Редагування', confirm: 'Підтвердити', cancel: 'Скасувати' },
	confirm: {
		deleteSentence: 'Ви справді хочете видалити це речення?',
		new: 'Ви справді хочете створити нову ілюстрацію? Усе буде видалено.'
	},
	menu: { new: 'Нова', import: 'Імпорт', export: 'Експорт', svg: 'Експорт SVG', png: 'Експорт PNG', scramble: 'Перемішати кольори' }
};

export default uk;
