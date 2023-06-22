import type { Translation } from '../i18n-types';

const fr: Translation = {
	params: {
		options: 'Options',
		verticalGap: 'Espace vertical',
		lineGap: 'Espace des lignes',
		straightLength: 'La part droite',
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
		placeholder: 'Saisissez une nouvelle phrase...',
		add: 'Ajouter',
		modify: 'Modifier',
		guidance:
			'Les mots sont automatiquement découpés par des espaces et les caractères de ponctuation. Utilisez {delimiter} pour découper ou pour utiliser les textes qui ne sont pas séparés par des espaces pour les langues chinoises, japonais, thaï, tibétain et celtique. Exemple : {example}'
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
		svg: 'Exporter SVG'
	}
};

export default fr;
