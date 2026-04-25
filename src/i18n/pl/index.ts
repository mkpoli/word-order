import type { Translation } from '../i18n-types';

const pl: Translation = {
	meta: { title: 'Ilustrator szyku wyrazów' },
	params: {
		options: 'Opcje',
		verticalGap: 'Odstęp pionowy',
		lineGap: 'Odstęp linii',
		straightLength: 'Prosty odcinek',
		endpointCorrection: 'Korekta końcówki',
		textAlignment: 'Wyrównanie tekstu',
		displayLanguage: 'Język interfejsu',
		text: 'Tekst',
		fontFamily: 'Krój pisma',
		default: 'Domyślny',
		serif: 'Szeryfowy',
		sansSerif: 'Bezszeryfowy',
		monospace: 'Stała szerokość',
		fontStyle: 'Styl pisma',
		normal: 'Normalny',
		italic: 'Kursywa',
		bold: 'Pogrubienie',
		boldItalic: 'Pogrubiona kursywa',
		fontSize: 'Rozmiar pisma'
	},
	input: {
		input: 'Wejście',
		placeholder: 'Wpisz tutaj nowe zdanie…',
		add: 'Dodaj',
		modify: 'Zmień',
		guidance:
			'Wyrazy są dzielone automatycznie za pomocą segmentacji właściwej dla języka, jeśli jest dostępna, a w przeciwnym razie według spacji i interpunkcji. Użyj {delimiter}, aby mieć dokładniejszą kontrolę, np. {example}'
	},
	tokenEditor: {
		tokens: 'Segmenty',
		mergeSelected: 'Scal zaznaczone',
		splitAtBoundary: 'Podziel segment w tym miejscu',
		selectTokens: 'Wybierz segmenty'
	},
	footer: {
		info: 'Ta aplikacja nie rości sobie praw do ilustracji, które tutaj tworzysz. To, jak ich używasz lub je udostępniasz, zależy wyłącznie od Ciebie. Udostępnienie tego narzędzia będzie mile widziane.',
		githubRepository: 'Repozytorium GitHub',
		announcement: 'Post z ogłoszeniem',
		by: 'autor'
	},
	ui: { selected: 'Wybrane' },
	dialog: { editing: 'Edycja', confirm: 'Potwierdź', cancel: 'Anuluj' },
	confirm: {
		deleteSentence: 'Czy na pewno chcesz usunąć to zdanie?',
		new: 'Czy na pewno chcesz utworzyć nową ilustrację? Wszystko zostanie usunięte.'
	},
	menu: { new: 'Nowa', import: 'Importuj', export: 'Eksportuj', svg: 'Eksportuj SVG', png: 'Eksportuj PNG', scramble: 'Pomieszaj kolory' }
};

export default pl;
