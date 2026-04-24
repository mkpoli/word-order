import type { Translation } from '../i18n-types';

const pt: Translation = {
	meta: {
		title: 'Ilustrador de ordem das palavras'
	},
	params: {
		options: 'Opcoes',
		verticalGap: 'Espaco vertical',
		lineGap: 'Espaco entre linhas',
		straightLength: 'Trecho reto',
		endpointCorrection: 'Correcao da extremidade',
		textAlignment: 'Alinhamento do texto',
		displayLanguage: 'Idioma da interface',
		text: 'Texto',
		fontFamily: 'Familia da fonte',
		default: 'Padrao',
		serif: 'Serif',
		sansSerif: 'Sans serif',
		monospace: 'Monoespacada',
		fontStyle: 'Estilo da fonte',
		normal: 'Normal',
		italic: 'Italico',
		bold: 'Negrito',
		boldItalic: 'Negrito italico',
		fontSize: 'Tamanho da fonte'
	},
	input: {
		input: 'Entrada',
		placeholder: 'Digite uma nova frase aqui…',
		add: 'Adicionar',
		modify: 'Modificar',
		guidance:
			'As palavras sao separadas automaticamente com segmentacao apropriada ao idioma quando disponivel, ou por espacos e pontuacao como alternativa. Use {delimiter} para um controle mais preciso, por exemplo {example}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Mesclar selecao',
		splitAtBoundary: 'Dividir token neste ponto',
		selectTokens: 'Selecione um ou mais tokens'
	},
	footer: {
		info: 'Este aplicativo nao reivindica direitos sobre as ilustracoes que voce cria aqui. Como voce as usa ou compartilha depende inteiramente de voce. Compartilhar esta ferramenta e apreciado.',
		githubRepository: 'Repositorio do GitHub',
		announcement: 'Publicacao de anuncio',
		by: 'por'
	},
	ui: {
		selected: 'Selecionado'
	},
	dialog: {
		editing: 'Editando',
		confirm: 'Confirmar',
		cancel: 'Cancelar'
	},
	confirm: {
		deleteSentence: 'Tem certeza de que deseja excluir esta frase?',
		new: 'Tem certeza de que deseja criar uma nova ilustracao? Isso apagara tudo.'
	},
	menu: {
		new: 'Novo',
		import: 'Importar',
		export: 'Exportar',
		svg: 'Exportar SVG',
		png: 'Exportar PNG',
		scramble: 'Embaralhar cores'
	}
};

export default pt;
