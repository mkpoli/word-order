import type { Translation } from '../i18n-types';

const tr: Translation = {
	meta: { title: 'Sözcük Sırası Çizim Aracı' },
	params: {
		options: 'Seçenekler',
		verticalGap: 'Dikey Boşluk',
		lineGap: 'Çizgi Boşluğu',
		straightLength: 'Düz Bölüm',
		endpointCorrection: 'Uç Nokta Düzeltmesi',
		textAlignment: 'Metin Hizalama',
		displayLanguage: 'Arayüz Dili',
		text: 'Metin',
		fontFamily: 'Yazı Tipi',
		default: 'Varsayılan',
		serif: 'Serif',
		sansSerif: 'Sans Serif',
		monospace: 'Eş Aralıklı',
		fontStyle: 'Yazı Stili',
		normal: 'Normal',
		italic: 'İtalik',
		bold: 'Kalın',
		boldItalic: 'Kalın İtalik',
		fontSize: 'Yazı Boyutu'
	},
	input: {
		input: 'Girdi',
		placeholder: 'Yeni cümleyi buraya girin…',
		add: 'Ekle',
		modify: 'Değiştir',
		guidance:
			'Sözcükler, mümkün olduğunda dile duyarlı bölümleme ile otomatik ayrılır; değilse boşluklar ve noktalama kullanılır. Daha ince denetim için {delimiter} kullanın, örneğin {example}'
	},
	tokenEditor: {
		tokens: 'Parçalar',
		mergeSelected: 'Seçilenleri birleştir',
		splitAtBoundary: 'Parçayı bu sınırda böl',
		selectTokens: 'Parça seçin'
	},
	footer: {
		info: 'Bu uygulama burada oluşturduğunuz çizimler üzerinde hak iddia etmez. Onları nasıl kullanacağınız veya paylaşacağınız tamamen size bağlıdır. Bu aracı paylaşmanız memnuniyetle karşılanır.',
		githubRepository: 'GitHub deposu',
		announcement: 'Duyuru gönderisi',
		by: 'hazırlayan'
	},
	ui: { selected: 'Seçili' },
	dialog: { editing: 'Düzenleniyor', confirm: 'Onayla', cancel: 'İptal' },
	confirm: {
		deleteSentence: 'Bu cümleyi silmek istediğinizden emin misiniz?',
		new: 'Yeni bir çizim oluşturmak istediğinizden emin misiniz? Her şey silinecek.'
	},
	menu: { new: 'Yeni', import: 'İçe aktar', export: 'Dışa aktar', svg: 'SVG dışa aktar', png: 'PNG dışa aktar', scramble: 'Renkleri karıştır' }
};

export default tr;
