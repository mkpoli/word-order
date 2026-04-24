import type { Translation } from '../i18n-types';

const ru: Translation = {
	meta: {
		title: 'Иллюстратор порядка слов'
	},
	params: {
		options: 'Параметры',
		verticalGap: 'Вертикальный отступ',
		lineGap: 'Промежуток между линиями',
		straightLength: 'Прямой участок',
		endpointCorrection: 'Коррекция конца линии',
		textAlignment: 'Выравнивание текста',
		displayLanguage: 'Язык интерфейса',
		text: 'Текст',
		fontFamily: 'Семейство шрифта',
		default: 'По умолчанию',
		serif: 'С засечками',
		sansSerif: 'Без засечек',
		monospace: 'Моноширинный',
		fontStyle: 'Стиль шрифта',
		normal: 'Обычный',
		italic: 'Курсив',
		bold: 'Жирный',
		boldItalic: 'Жирный курсив',
		fontSize: 'Размер шрифта'
	},
	input: {
		input: 'Ввод',
		placeholder: 'Введите новое предложение…',
		add: 'Добавить',
		modify: 'Изменить',
		guidance:
			'Слова автоматически сегментируются по правилам языка, если это поддерживается, иначе используются пробелы и знаки препинания. Для более точного управления используйте {delimiter}, например {example}'
	},
	tokenEditor: {
		tokens: 'Токены',
		mergeSelected: 'Объединить выбранное',
		splitAtBoundary: 'Разделить токен в этой точке',
		selectTokens: 'Выберите один или несколько токенов'
	},
	footer: {
		info: 'Это приложение не заявляет никаких прав на иллюстрации, которые вы создаете здесь. Как их использовать или публиковать, решаете только вы. Будем рады, если вы поделитесь этим инструментом.',
		githubRepository: 'Репозиторий GitHub',
		announcement: 'Анонс',
		by: 'автор'
	},
	ui: {
		selected: 'Выбрано'
	},
	dialog: {
		editing: 'Редактирование',
		confirm: 'Подтвердить',
		cancel: 'Отмена'
	},
	confirm: {
		deleteSentence: 'Вы уверены, что хотите удалить это предложение?',
		new: 'Вы уверены, что хотите создать новую иллюстрацию? Все данные будут удалены.'
	},
	menu: {
		new: 'Новый',
		import: 'Импорт',
		export: 'Экспорт',
		svg: 'Экспорт SVG',
		png: 'Экспорт PNG',
		scramble: 'Перемешать цвета'
	}
};

export default ru;
