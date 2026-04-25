import type { Translation } from '../i18n-types';

const grc: Translation = {
	meta: { title: 'Εἰκονογράφος τάξεως λέξεων' },
	params: {
		options: 'Αἱρέσεις',
		verticalGap: 'Διάστημα κάθετον',
		lineGap: 'Διάστημα γραμμῶν',
		straightLength: 'Μέρος εὐθύ',
		endpointCorrection: 'Διόρθωσις πέρατος',
		textAlignment: 'Τάξις γραφῆς',
		displayLanguage: 'Γλῶσσα φαινομένη',
		text: 'Γραφή',
		fontFamily: 'Γένος γραμμάτων',
		default: 'Προκείμενον',
		serif: 'Κεραῖαι',
		sansSerif: 'Ἄνευ κεραιῶν',
		monospace: 'Ἰσόχωρον',
		fontStyle: 'Σχῆμα γραμμάτων',
		normal: 'Κοινόν',
		italic: 'Κεκλιμένον',
		bold: 'Παχύ',
		boldItalic: 'Παχύ κεκλιμένον',
		fontSize: 'Μέγεθος γραμμάτων'
	},
	input: {
		input: 'Εἴσοδος',
		placeholder: 'Γράψον καινὴν περίοδον ἐνθάδε…',
		add: 'Πρόσθες',
		modify: 'Μετάβαλε',
		guidance:
			'Αἱ λέξεις αὐτομάτως τέμνονται κατὰ τὴν γλῶσσαν, ἐὰν δυνατόν ᾖ· εἰ δὲ μή, κατὰ διαστήματα καὶ σημεῖα στίξεως. Χρῶ τῷ {delimiter} εἰς λεπτοτέραν ἀκρίβειαν, οἷον {example}'
	},
	tokenEditor: {
		tokens: 'Τμήματα',
		mergeSelected: 'Σύναψον τὰ ἐκλελεγμένα',
		splitAtBoundary: 'Τέμε τὸ τμῆμα ἐνταῦθα',
		selectTokens: 'Ἔκλεξαι τμήματα'
	},
	footer: {
		info: 'Τὸδε τὸ ὄργανον οὐκ ἀξιοῖ δικαιώματα περὶ τῶν εἰκόνων ἃς ἐνθάδε ποιεῖς. Ὅπως χρῇ ἢ μεταδιδῷς, ἐπὶ σοὶ ἐστίν. Χάρις, ἐὰν τὸ ὄργανον τοῦτο μεταδιδῷς.',
		githubRepository: 'Θησαυρὸς GitHub',
		announcement: 'Ἀγγελία',
		by: 'ὑπό'
	},
	ui: { selected: 'Ἐκλελεγμένον' },
	dialog: { editing: 'Μεταβολή', confirm: 'Κύρωσον', cancel: 'Ἄφες' },
	confirm: {
		deleteSentence: 'Ἆρα βούλει τὴν περίοδον ταύτην ἀφελεῖν;',
		new: 'Ἆρα βούλει καινὴν εἰκόνα ποιῆσαι; πάντα ἀφαιρεθήσεται.'
	},
	menu: { new: 'Καινόν', import: 'Εἰσάγαγε', export: 'Ἐξάγαγε', svg: 'Ἐξάγαγε SVG', png: 'Ἐξάγαγε PNG', scramble: 'Σύγχυσον χρώματα' }
};

export default grc;
