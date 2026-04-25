import type { Translation } from '../i18n-types';

const id: Translation = {
	meta: { title: 'Ilustrator Urutan Kata' },
	params: {
		options: 'Opsi',
		verticalGap: 'Jarak Vertikal',
		lineGap: 'Jarak Garis',
		straightLength: 'Bagian Lurus',
		endpointCorrection: 'Koreksi Ujung',
		textAlignment: 'Perataan Teks',
		displayLanguage: 'Bahasa Tampilan',
		text: 'Teks',
		fontFamily: 'Jenis Huruf',
		default: 'Bawaan',
		serif: 'Serif',
		sansSerif: 'Sans Serif',
		monospace: 'Monospace',
		fontStyle: 'Gaya Huruf',
		normal: 'Normal',
		italic: 'Miring',
		bold: 'Tebal',
		boldItalic: 'Tebal Miring',
		fontSize: 'Ukuran Huruf'
	},
	input: {
		input: 'Masukan',
		placeholder: 'Masukkan kalimat baru di sini…',
		add: 'Tambah',
		modify: 'Ubah',
		guidance:
			'Kata akan dipisah otomatis dengan segmentasi sesuai bahasa jika tersedia, atau berdasarkan spasi dan tanda baca sebagai cadangan. Gunakan {delimiter} untuk kontrol yang lebih rinci, misalnya {example}'
	},
	tokenEditor: {
		tokens: 'Token',
		mergeSelected: 'Gabungkan pilihan',
		splitAtBoundary: 'Pisahkan token di batas ini',
		selectTokens: 'Pilih token'
	},
	footer: {
		info: 'Aplikasi ini tidak mengklaim hak atas ilustrasi yang Anda buat di sini. Cara Anda menggunakan atau membagikannya sepenuhnya terserah Anda. Kami menghargai jika alat ini dibagikan.',
		githubRepository: 'Repositori GitHub',
		announcement: 'Pengumuman',
		by: 'oleh'
	},
	ui: { selected: 'Dipilih' },
	dialog: { editing: 'Mengedit', confirm: 'Konfirmasi', cancel: 'Batal' },
	confirm: {
		deleteSentence: 'Yakin ingin menghapus kalimat ini?',
		new: 'Yakin ingin membuat ilustrasi baru? Semua isi akan dihapus.'
	},
	menu: { new: 'Baru', import: 'Impor', export: 'Ekspor', svg: 'Ekspor SVG', png: 'Ekspor PNG', scramble: 'Acak warna' }
};

export default id;
