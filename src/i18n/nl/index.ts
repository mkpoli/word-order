import type { Translation } from '../i18n-types';

const nl: Translation = {
	meta: { title: 'Woordvolgorde-illustrator' },
	params: {
		options: 'Opties',
		verticalGap: 'Verticale afstand',
		lineGap: 'Lijnafstand',
		straightLength: 'Recht stuk',
		endpointCorrection: 'Eindpuntcorrectie',
		textAlignment: 'Tekstuitlijning',
		displayLanguage: 'Weergavetaal',
		text: 'Tekst',
		fontFamily: 'Lettertype',
		default: 'Standaard',
		serif: 'Schreef',
		sansSerif: 'Schreefloos',
		monospace: 'Vaste breedte',
		fontStyle: 'Letterstijl',
		normal: 'Normaal',
		italic: 'Cursief',
		bold: 'Vet',
		boldItalic: 'Vet cursief',
		fontSize: 'Tekstgrootte'
	},
	input: {
		input: 'Invoer',
		placeholder: 'Voer hier een nieuwe zin in…',
		add: 'Toevoegen',
		modify: 'Wijzigen',
		guidance:
			'Woorden worden automatisch gesplitst met taalspecifieke segmentatie wanneer die beschikbaar is, anders op spaties en leestekens. Gebruik {delimiter} voor fijnere controle, bijvoorbeeld {example}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Selectie samenvoegen',
		splitAtBoundary: 'Token op deze grens splitsen',
		selectTokens: 'Selecteer token(s)'
	},
	footer: {
		info: 'Deze toepassing claimt geen rechten op de illustraties die je hier maakt. Hoe je ze gebruikt of deelt is helemaal aan jou. Het delen van dit hulpmiddel wordt gewaardeerd.',
		githubRepository: 'GitHub-repository',
		announcement: 'Aankondigingsbericht',
		by: 'door'
	},
	ui: { selected: 'Geselecteerd' },
	dialog: { editing: 'Bewerken', confirm: 'Bevestigen', cancel: 'Annuleren' },
	confirm: {
		deleteSentence: 'Weet je zeker dat je deze zin wilt verwijderen?',
		new: 'Weet je zeker dat je een nieuwe illustratie wilt maken? Alles wordt verwijderd.'
	},
	menu: { new: 'Nieuw', import: 'Importeren', export: 'Exporteren', svg: 'SVG exporteren', png: 'PNG exporteren', scramble: 'Kleuren mengen' }
};

export default nl;
