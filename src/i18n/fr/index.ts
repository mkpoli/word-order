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
		info: 'L’illustration générée par cette application est distribuée sous la licence {license}, ce qui signifie qu’elle sera dans le domaine public et totalement libre d’utilisation. Il n’est pas obligatoire, mais bienvenu de partager et de créditer'
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
