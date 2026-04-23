import type { Translation } from '../i18n-types';

const fr: Translation = {
	params: {
		options: 'Options',
		verticalGap: 'Espace vertical',
		lineGap: 'Espace des lignes',
		straightLength: 'La part droite',
		endpointCorrection: 'Correction du point final',
		textAlignment: 'Alignement du texte',
		displayLanguage: 'Langue d’affichage',
		text: 'Texte',
		fontFamily: 'Police',
		default: 'Défaut',
		serif: 'Serif',
		sansSerif: 'Sans serif',
		monospace: 'Monospace',
		fontStyle: 'Style de police',
		normal: 'Normal',
		italic: 'Italique',
		bold: 'Gras',
		boldItalic: 'Gras italique',
		fontSize: 'Taille de police'
	},
	input: {
		input: 'Entrée',
		placeholder: 'Saisissez une nouvelle phrase…',
		add: 'Ajouter',
		modify: 'Modifier',
		guidance:
			'Les mots sont découpés automatiquement avec une segmentation adaptée à la langue quand elle est disponible, sinon avec les espaces et la ponctuation. Utilisez {delimiter} pour un découpage plus précis. Exemple : {example}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Fusionner la selection',
		splitAtBoundary: 'Scinder le token a cette limite',
		selectTokens: 'Selectionnez des tokens'
	},
	footer: {
		info: 'Cette application ne revendique pas de droits sur les illustrations que vous créez ici. La façon dont vous les utilisez ou les partagez dépend entièrement de vous. Partager cet outil est apprécié.'
	},
	dialog: {
		editing: 'Édition',
		confirm: 'Confirmer',
		cancel: 'Annuler'
	},
	confirm: {
		deleteSentence: 'Êtes-vous sûr de vouloir supprimer cette phrase?',
		new: 'Êtes-vous sûr de vouloir créer une nouvelle illustration? Cela supprimera TOUTES les phrases!'
	},
	menu: {
		new: 'Nouvelle',
		import: 'Importer',
		export: 'Exporter',
		svg: 'Exporter SVG',
		png: 'Exporter PNG',
		scramble: 'Mélanger les couleurs'
	}
};

export default fr;
