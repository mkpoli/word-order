#!/usr/bin/env bun
// One-shot: drop two over-explanatory hint keys from en.json and the
// already-translated locales, and shorten five verbose strings to the
// "tight UI label" form proposed during the UX review. Per mkpoli:
// the app should be visually intuitive — not narrate what users can see.
//
// Removed keys (everywhere):
//   - rename_language_customised_hint
//   - rename_language_hint
//
// Shortened strings get rewritten in en.json AND in every locale that
// already has them (since the placeholder count / semantic shape changed
// in some cases). Locales that don't have a key yet stay absent — per
// the no-English-fallback rule.
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'project.inlang/messages';

const REMOVE_KEYS = ['rename_language_customised_hint', 'rename_language_hint'];

type Strings = Record<string, string>;

const SHORT_EN: Strings = {
	menu_share_long: '{length} chars — may be truncated',
	menu_share_load_error: 'Broken share link',
	menu_qr_too_long: 'Too long for one QR',
	settings_key_network_error: "Can't reach provider",
	settings_cache_stored: '{count} cached'
};

// Hand-authored short versions per locale. Only locales that previously had
// the long string get a short replacement; missing keys stay missing.
const SHORT_BY_LOCALE: Record<string, Strings> = {
	ar: {
		menu_share_long: '{length} حرفًا — قد يُقتطع',
		menu_share_load_error: 'رابط مشاركة معطوب',
		menu_qr_too_long: 'طويل جدًا لرمز QR واحد',
		settings_key_network_error: 'تعذّر الوصول إلى المزوّد',
		settings_cache_stored: '{count} مخزّن'
	},
	bg: {
		menu_share_long: '{length} символа — може да бъде отрязан',
		menu_share_load_error: 'Повредена връзка за споделяне',
		menu_qr_too_long: 'Твърде дълго за един QR код',
		settings_key_network_error: 'Доставчикът не отговаря',
		settings_cache_stored: '{count} в кеша'
	},
	bn: {
		menu_share_long: '{length} অক্ষর — কেটে যেতে পারে',
		menu_share_load_error: 'শেয়ার লিঙ্ক ভাঙা',
		menu_qr_too_long: 'একটি QR-এ ধারণের জন্য খুব দীর্ঘ',
		settings_key_network_error: 'প্রদানকারীর সাথে সংযোগ নেই',
		settings_cache_stored: '{count} ক্যাশে'
	},
	de: {
		menu_share_long: '{length} Zeichen — evtl. abgeschnitten',
		menu_share_load_error: 'Defekter Freigabelink',
		menu_qr_too_long: 'Zu lang für einen QR-Code',
		settings_key_network_error: 'Anbieter nicht erreichbar',
		settings_cache_stored: '{count} im Cache'
	},
	eo: {
		menu_share_long: '{length} signoj — eble tranĉita',
		menu_share_load_error: 'Rompita kunhaviga ligilo',
		menu_qr_too_long: 'Tro longa por unu QR-kodo',
		settings_key_network_error: 'Provizanto neatingebla',
		settings_cache_stored: '{count} kaŝmemoritaj'
	},
	es: {
		menu_share_long: '{length} caracteres — podría truncarse',
		menu_share_load_error: 'Enlace de compartir roto',
		menu_qr_too_long: 'Demasiado largo para un QR',
		settings_key_network_error: 'No se puede contactar al proveedor',
		settings_cache_stored: '{count} en caché'
	},
	fa: {
		menu_share_long: '{length} نویسه — ممکن است کوتاه شود',
		menu_share_load_error: 'لینک اشتراک خراب',
		menu_qr_too_long: 'بلندتر از یک کد QR',
		settings_key_network_error: 'دسترسی به ارائه‌دهنده ممکن نیست',
		settings_cache_stored: '{count} در کش'
	},
	fi: {
		menu_share_long: '{length} merkkiä — voi katketa',
		menu_share_load_error: 'Rikkinäinen jakolinkki',
		menu_qr_too_long: 'Liian pitkä yhteen QR-koodiin',
		settings_key_network_error: 'Palveluntarjoaja ei vastaa',
		settings_cache_stored: '{count} välimuistissa'
	},
	fr: {
		menu_share_long: '{length} caractères — risque de troncature',
		menu_share_load_error: 'Lien de partage cassé',
		menu_qr_too_long: 'Trop long pour un seul QR',
		settings_key_network_error: 'Fournisseur injoignable',
		settings_cache_stored: '{count} en cache'
	},
	hi: {
		menu_share_long: '{length} वर्ण — कट सकता है',
		menu_share_load_error: 'टूटा शेयर लिंक',
		menu_qr_too_long: 'एक QR के लिए बहुत लंबा',
		settings_key_network_error: 'प्रदाता तक नहीं पहुँचा',
		settings_cache_stored: '{count} कैश में'
	},
	id: {
		menu_share_long: '{length} karakter — mungkin terpotong',
		menu_share_load_error: 'Tautan berbagi rusak',
		menu_qr_too_long: 'Terlalu panjang untuk satu QR',
		settings_key_network_error: 'Penyedia tidak dapat dihubungi',
		settings_cache_stored: '{count} di cache'
	},
	it: {
		menu_share_long: '{length} caratteri — potrebbe essere troncato',
		menu_share_load_error: 'Link di condivisione rotto',
		menu_qr_too_long: 'Troppo lungo per un QR',
		settings_key_network_error: 'Fornitore irraggiungibile',
		settings_cache_stored: '{count} in cache'
	},
	ja: {
		menu_share_long: '{length} 文字 — 切られる可能性あり',
		menu_share_load_error: '共有リンクが壊れています',
		menu_qr_too_long: 'QR コード 1 つに収まりません',
		settings_key_network_error: 'プロバイダーに接続できません',
		settings_cache_stored: '{count} 件キャッシュ'
	},
	'ja-Hira': {
		menu_share_long: '{length} もじ — みじかく されるかも',
		menu_share_load_error: 'きょうゆうりんくが こわれて います',
		menu_qr_too_long: 'QR こおど ひとつに おさまりません',
		settings_key_network_error: 'ていきょうしゃに つながれません',
		settings_cache_stored: '{count} こ ほかんずみ'
	},
	ko: {
		menu_share_long: '{length}자 — 잘릴 수 있음',
		menu_share_load_error: '공유 링크 손상',
		menu_qr_too_long: '한 QR에 담기엔 너무 김',
		settings_key_network_error: '제공자 연결 실패',
		settings_cache_stored: '{count}개 캐시됨'
	},
	'ko-Kore': {
		menu_share_long: '{length}字 — 切斷될 수 있음',
		menu_share_load_error: '共有 連結 損傷',
		menu_qr_too_long: '一個 QR에 收容하기엔 過長',
		settings_key_network_error: '提供者 接續 失敗',
		settings_cache_stored: '{count}件 貯藏됨'
	},
	la: {
		menu_share_long: '{length} litterae — truncari potest',
		menu_share_load_error: 'Nexus communis fractus',
		menu_qr_too_long: 'Nimis longum pro uno QR',
		settings_key_network_error: 'Praebitor contingi non potest',
		settings_cache_stored: '{count} in promptuario'
	},
	nl: {
		menu_share_long: '{length} tekens — kan afgekapt worden',
		menu_share_load_error: 'Gebroken deel-link',
		menu_qr_too_long: 'Te lang voor één QR',
		settings_key_network_error: 'Provider niet bereikbaar',
		settings_cache_stored: '{count} in cache'
	},
	pl: {
		menu_share_long: '{length} znaków — może być przycięty',
		menu_share_load_error: 'Uszkodzony link udostępniania',
		menu_qr_too_long: 'Za długie na jeden kod QR',
		settings_key_network_error: 'Brak kontaktu z dostawcą',
		settings_cache_stored: '{count} w pamięci podręcznej'
	},
	pt: {
		menu_share_long: '{length} caracteres — pode ser truncado',
		menu_share_load_error: 'Ligação de partilha quebrada',
		menu_qr_too_long: 'Demasiado longo para um QR',
		settings_key_network_error: 'Fornecedor inacessível',
		settings_cache_stored: '{count} em cache'
	},
	ru: {
		menu_share_long: '{length} символов — может быть обрезано',
		menu_share_load_error: 'Битая ссылка',
		menu_qr_too_long: 'Слишком длинно для одного QR',
		settings_key_network_error: 'Провайдер недоступен',
		settings_cache_stored: '{count} в кэше'
	},
	th: {
		menu_share_long: '{length} ตัวอักษร — อาจถูกตัด',
		menu_share_load_error: 'ลิงก์แชร์เสีย',
		menu_qr_too_long: 'ยาวเกินสำหรับ QR เดียว',
		settings_key_network_error: 'ติดต่อผู้ให้บริการไม่ได้',
		settings_cache_stored: '{count} ในแคช'
	},
	tok: {
		menu_share_long: '{length} sitelen — ona ken kipisi',
		menu_share_load_error: 'ma pi pana li pakala',
		menu_qr_too_long: 'lipu li suli — sitelen QR wan li ken ala',
		settings_key_network_error: 'mi ken ala toki tawa jan pi pana',
		settings_cache_stored: '{count} li awen'
	},
	tr: {
		menu_share_long: '{length} karakter — kısaltılabilir',
		menu_share_load_error: 'Bozuk paylaşım bağlantısı',
		menu_qr_too_long: 'Bir QR için fazla uzun',
		settings_key_network_error: 'Sağlayıcıya ulaşılamadı',
		settings_cache_stored: '{count} önbellekte'
	},
	uk: {
		menu_share_long: '{length} символів — може бути обрізано',
		menu_share_load_error: 'Зламане посилання',
		menu_qr_too_long: 'Задовге для одного QR',
		settings_key_network_error: 'Провайдер недоступний',
		settings_cache_stored: '{count} у кеші'
	},
	vi: {
		menu_share_long: '{length} ký tự — có thể bị cắt',
		menu_share_load_error: 'Liên kết chia sẻ hỏng',
		menu_qr_too_long: 'Quá dài cho một QR',
		settings_key_network_error: 'Không liên hệ được nhà cung cấp',
		settings_cache_stored: '{count} trong bộ đệm'
	},
	'zh-HanS': {
		menu_share_long: '{length} 字 — 可能被截断',
		menu_share_load_error: '分享链接已损坏',
		menu_qr_too_long: '一个二维码装不下',
		settings_key_network_error: '无法连接到提供方',
		settings_cache_stored: '{count} 条缓存'
	},
	'zh-HanT': {
		menu_share_long: '{length} 字 — 可能被截斷',
		menu_share_load_error: '分享連結損毀',
		menu_qr_too_long: '一個 QR 碼裝不下',
		settings_key_network_error: '無法連線至提供方',
		settings_cache_stored: '{count} 條快取'
	},
	grc: {
		menu_share_long: 'Γράμματα {length} — δύναται κολούεσθαι',
		menu_share_load_error: 'Διεφθαρμένος σύνδεσμος',
		menu_qr_too_long: 'Μακρότερον ἢ ἓν σύμβολον QR',
		settings_key_network_error: 'Ὁ πάροχος ἀδύνατος εὑρεθῆναι',
		settings_cache_stored: '{count} ἀπεθησαυρισμέναι'
	},
	ia: {
		menu_share_long: '{length} characteres — possibilemente truncate',
		menu_share_load_error: 'Ligamine compartite rumpite',
		menu_qr_too_long: 'Troppo longe pro un sol QR',
		settings_key_network_error: 'Fornitor non accessibile',
		settings_cache_stored: '{count} in cache'
	},
	ain: {
		menu_share_long: 'Itak ikiri {length} — a=tuye p an ruwe ne nankor',
		menu_share_load_error: 'Cinuyeuske perke',
		menu_qr_too_long: 'Sine QR noka or ta a=oma eaykap',
		settings_key_network_error: 'Ikorarpe a=eteskar ka eaykap',
		settings_cache_stored: '{count} a=ukao'
	}
};

function sortKeys(obj: Strings, reference: string[]): Strings {
	const out: Strings = {};
	for (const k of reference) if (k in obj) out[k] = obj[k];
	for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
	return out;
}

// 1. Update en.json: remove the two hint keys and apply short strings.
const enPath = join(DIR, 'en.json');
const en: Strings = JSON.parse(readFileSync(enPath, 'utf8'));
for (const k of REMOVE_KEYS) delete en[k];
for (const [k, v] of Object.entries(SHORT_EN)) en[k] = v;
writeFileSync(enPath, JSON.stringify(en, null, '\t') + '\n', 'utf8');
const enOrder = Object.keys(en);
console.log(`en: -${REMOVE_KEYS.length}, ${Object.keys(SHORT_EN).length} shortened`);

// 2. Walk every other locale: drop the two hint keys; overwrite shortened
//    keys only when (a) the locale previously had the long version AND
//    (b) we have a hand-authored short version for it.
const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'en.json');
for (const f of files) {
	const locale = f.replace('.json', '');
	const path = join(DIR, f);
	const obj: Strings = JSON.parse(readFileSync(path, 'utf8'));
	let removed = 0;
	let shortened = 0;
	for (const k of REMOVE_KEYS) {
		if (k in obj) {
			delete obj[k];
			removed++;
		}
	}
	const short = SHORT_BY_LOCALE[locale];
	if (short) {
		for (const [k, v] of Object.entries(short)) {
			if (k in obj) {
				obj[k] = v;
				shortened++;
			}
		}
	}
	if (removed || shortened) {
		const ordered = sortKeys(obj, enOrder);
		writeFileSync(path, JSON.stringify(ordered, null, '\t') + '\n', 'utf8');
		console.log(`${locale}: -${removed}, ${shortened} shortened`);
	}
}
