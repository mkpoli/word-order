import type { Translation } from '../i18n-types';

const eo: Translation = {
	meta: {
		title: 'Ilustrilo de vortordo'
	},
	params: {
		options: 'Agordoj',
		verticalGap: 'Vertikala interspaco',
		lineGap: 'Interspaco de linioj',
		straightLength: 'Rekta parto',
		endpointCorrection: 'Korekto de finpunkto',
		textAlignment: 'Teksta vicigo',
		displayLanguage: 'Lingvo de la interfaco',
		text: 'Teksto',
		fontFamily: 'Tipara familio',
		default: 'Defaŭlta',
		serif: 'Serifa',
		sansSerif: 'Senserifa',
		monospace: 'Egallarĝa',
		fontStyle: 'Tipara stilo',
		normal: 'Normala',
		italic: 'Kursiva',
		bold: 'Grasa',
		boldItalic: 'Grasa kursiva',
		fontSize: 'Tipara grando'
	},
	input: {
		input: 'Enigo',
		placeholder: 'Enigu novan frazon ĉi tie…',
		add: 'Aldoni',
		modify: 'Modifi',
		guidance:
			'Vortoj aŭtomate dividiĝas per lingvokonscia segmentado kiam ĝi disponeblas, aŭ laŭ spacoj kaj interpunkcio kiel rezervo. Uzu {delimiter} por pli fajna rego, ekzemple {example}'
	},
	tokenEditor: {
		tokens: 'Tokenoj',
		mergeSelected: 'Kunigi elektitajn',
		splitAtBoundary: 'Dividi tokenon ĉe limo',
		selectTokens: 'Elektu tokenojn'
	},
	footer: {
		info: 'Ĉi tiu aplikaĵo ne pretendas rajtojn pri la ilustraĵoj, kiujn vi kreas ĉi tie. Kiel vi uzas aŭ dividas ilin dependas tute de vi. Diskonigi ĉi tiun ilon estas bonvena.',
		githubRepository: 'GitHub-deponejo',
		announcement: 'Anonca afiŝo',
		by: 'de'
	},
	ui: {
		selected: 'Elektita'
	},
	dialog: {
		editing: 'Redaktado',
		confirm: 'Konfirmi',
		cancel: 'Nuligi'
	},
	confirm: {
		deleteSentence: 'Ĉu vi certas, ke vi volas forigi ĉi tiun frazon?',
		new: 'Ĉu vi certas, ke vi volas krei novan ilustraĵon? Tio forigos ĉion.'
	},
	menu: {
		new: 'Nova',
		import: 'Importi',
		export: 'Eksporti',
		svg: 'Eksporti SVG',
		png: 'Eksporti PNG',
		scramble: 'Miksi kolorojn'
	}
};

export default eo;
