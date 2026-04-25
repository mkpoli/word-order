import type { Translation } from '../i18n-types';

const it: Translation = {
	meta: { title: "Illustratore dell'ordine delle parole" },
	params: {
		options: 'Opzioni',
		verticalGap: 'Spazio verticale',
		lineGap: 'Spazio tra le linee',
		straightLength: 'Parte diritta',
		endpointCorrection: "Correzione dell'estremità",
		textAlignment: 'Allineamento del testo',
		displayLanguage: 'Lingua interfaccia',
		text: 'Testo',
		fontFamily: 'Carattere',
		default: 'Predefinito',
		serif: 'Con grazie',
		sansSerif: 'Senza grazie',
		monospace: 'Monospaziato',
		fontStyle: 'Stile del carattere',
		normal: 'Normale',
		italic: 'Corsivo',
		bold: 'Grassetto',
		boldItalic: 'Grassetto corsivo',
		fontSize: 'Dimensione carattere'
	},
	input: {
		input: 'Input',
		placeholder: 'Inserisci qui una nuova frase…',
		add: 'Aggiungi',
		modify: 'Modifica',
		guidance:
			'Le parole vengono separate automaticamente con segmentazione adatta alla lingua quando disponibile, oppure con spazi e punteggiatura come ripiego. Usa {delimiter} per un controllo più preciso, ad esempio {example}'
	},
	tokenEditor: {
		tokens: 'Token',
		mergeSelected: 'Unisci selezionati',
		splitAtBoundary: 'Dividi il token in questo punto',
		selectTokens: 'Seleziona token'
	},
	footer: {
		info: 'Questa applicazione non rivendica diritti sulle illustrazioni che crei qui. Il modo in cui le usi o le condividi dipende interamente da te. La condivisione di questo strumento è apprezzata.',
		githubRepository: 'Repository GitHub',
		announcement: 'Post di annuncio',
		by: 'di'
	},
	ui: { selected: 'Selezionato' },
	dialog: { editing: 'Modifica', confirm: 'Conferma', cancel: 'Annulla' },
	confirm: {
		deleteSentence: 'Vuoi davvero eliminare questa frase?',
		new: 'Vuoi davvero creare una nuova illustrazione? Tutto verrà eliminato.'
	},
	menu: { new: 'Nuova', import: 'Importa', export: 'Esporta', svg: 'Esporta SVG', png: 'Esporta PNG', scramble: 'Mescola colori' }
};

export default it;
