import type { Translation } from '../i18n-types';

const es: Translation = {
	meta: {
		title: 'Ilustrador del orden de palabras'
	},
	params: {
		options: 'Opciones',
		verticalGap: 'Espacio vertical',
		lineGap: 'Espacio entre lineas',
		straightLength: 'Tramo recto',
		endpointCorrection: 'Correccion del extremo',
		textAlignment: 'Alineacion del texto',
		displayLanguage: 'Idioma de la interfaz',
		text: 'Texto',
		fontFamily: 'Familia tipografica',
		default: 'Predeterminada',
		serif: 'Serif',
		sansSerif: 'Sans serif',
		monospace: 'Monoespaciada',
		fontStyle: 'Estilo tipografico',
		normal: 'Normal',
		italic: 'Cursiva',
		bold: 'Negrita',
		boldItalic: 'Negrita cursiva',
		fontSize: 'Tamano de fuente'
	},
	input: {
		input: 'Entrada',
		placeholder: 'Escribe una nueva oracion aqui…',
		add: 'Anadir',
		modify: 'Modificar',
		guidance:
			'Las palabras se separan automaticamente con segmentacion adaptada al idioma cuando esta disponible, o por espacios y puntuacion como alternativa. Usa {delimiter} para un control mas preciso; por ejemplo, {example}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Unir seleccion',
		splitAtBoundary: 'Dividir token en este punto',
		selectTokens: 'Selecciona uno o varios tokens'
	},
	footer: {
		info: 'Esta aplicacion no reclama ningun derecho sobre las ilustraciones que creas aqui. Como las uses o compartas depende totalmente de ti. Se agradece compartir esta herramienta.',
		githubRepository: 'Repositorio de GitHub',
		announcement: 'Publicacion de anuncio',
		by: 'por'
	},
	ui: {
		selected: 'Seleccionado'
	},
	dialog: {
		editing: 'Editando',
		confirm: 'Confirmar',
		cancel: 'Cancelar'
	},
	confirm: {
		deleteSentence: 'Seguro que quieres eliminar esta oracion?',
		new: 'Seguro que quieres crear una nueva ilustracion? Esto eliminara todo.'
	},
	menu: {
		new: 'Nuevo',
		import: 'Importar',
		export: 'Exportar',
		svg: 'Exportar SVG',
		png: 'Exportar PNG',
		scramble: 'Mezclar colores'
	}
};

export default es;
