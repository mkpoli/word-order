import type { Translation } from '../i18n-types';

const hi: Translation = {
	meta: {
		title: 'शब्द क्रम चित्रकार'
	},
	params: {
		options: 'विकल्प',
		verticalGap: 'ऊर्ध्वाधर अंतर',
		lineGap: 'रेखा अंतर',
		straightLength: 'सीधा भाग',
		endpointCorrection: 'अंत बिंदु सुधार',
		textAlignment: 'पाठ संरेखण',
		displayLanguage: 'इंटरफ़ेस भाषा',
		text: 'पाठ',
		fontFamily: 'फ़ॉन्ट परिवार',
		default: 'डिफ़ॉल्ट',
		serif: 'सेरिफ',
		sansSerif: 'सैन्स सेरिफ',
		monospace: 'मोनोस्पेस',
		fontStyle: 'फ़ॉन्ट शैली',
		normal: 'सामान्य',
		italic: 'इटैलिक',
		bold: 'बोल्ड',
		boldItalic: 'बोल्ड इटैलिक',
		fontSize: 'फ़ॉन्ट आकार'
	},
	input: {
		input: 'इनपुट',
		placeholder: 'यहां नया वाक्य लिखें…',
		add: 'जोड़ें',
		modify: 'संशोधित करें',
		guidance:
			'जहां संभव हो वहां शब्द भाषा-अनुरूप विभाजन से अपने आप अलग किए जाते हैं, अन्यथा रिक्त स्थान और विराम चिह्नों का उपयोग किया जाता है। अधिक सटीक नियंत्रण के लिए {delimiter} का उपयोग करें, जैसे {example}'
	},
	tokenEditor: {
		tokens: 'टोकन',
		mergeSelected: 'चयनित को मिलाएं',
		splitAtBoundary: 'इस बिंदु पर टोकन विभाजित करें',
		selectTokens: 'एक या अधिक टोकन चुनें'
	},
	footer: {
		info: 'यह अनुप्रयोग यहां बनाई गई चित्रात्मक रचनाओं पर कोई अधिकार दावा नहीं करता। आप उनका उपयोग या साझा कैसे करते हैं, यह पूरी तरह आप पर निर्भर है। इस उपकरण को साझा करना सराहनीय है।',
		githubRepository: 'GitHub रिपॉज़िटरी',
		announcement: 'घोषणा पोस्ट',
		by: 'द्वारा'
	},
	ui: {
		selected: 'चयनित'
	},
	dialog: {
		editing: 'संपादन',
		confirm: 'पुष्टि करें',
		cancel: 'रद्द करें'
	},
	confirm: {
		deleteSentence: 'क्या आप वाकई इस वाक्य को हटाना चाहते हैं?',
		new: 'क्या आप वाकई नया चित्र बनाना चाहते हैं? इससे सब कुछ हट जाएगा।'
	},
	menu: {
		new: 'नया',
		import: 'आयात',
		export: 'निर्यात',
		svg: 'SVG निर्यात',
		png: 'PNG निर्यात',
		scramble: 'रंग बदलें'
	}
};

export default hi;
