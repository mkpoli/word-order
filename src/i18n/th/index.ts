import type { Translation } from '../i18n-types';

const th: Translation = {
	meta: { title: 'เครื่องมือวาดลำดับคำ' },
	params: {
		options: 'ตัวเลือก',
		verticalGap: 'ระยะห่างแนวตั้ง',
		lineGap: 'ระยะห่างเส้น',
		straightLength: 'ส่วนเส้นตรง',
		endpointCorrection: 'ปรับปลายเส้น',
		textAlignment: 'การจัดแนวข้อความ',
		displayLanguage: 'ภาษาที่แสดง',
		text: 'ข้อความ',
		fontFamily: 'แบบอักษร',
		default: 'ค่าเริ่มต้น',
		serif: 'มีเชิง',
		sansSerif: 'ไม่มีเชิง',
		monospace: 'กว้างเท่ากัน',
		fontStyle: 'รูปแบบตัวอักษร',
		normal: 'ปกติ',
		italic: 'ตัวเอียง',
		bold: 'ตัวหนา',
		boldItalic: 'ตัวหนาเอียง',
		fontSize: 'ขนาดตัวอักษร'
	},
	input: {
		input: 'ป้อนข้อความ',
		placeholder: 'ป้อนประโยคใหม่ที่นี่…',
		add: 'เพิ่ม',
		modify: 'แก้ไข',
		guidance:
			'คำจะถูกแบ่งอัตโนมัติด้วยการตัดคำตามภาษาหากรองรับ หรือใช้ช่องว่างและเครื่องหมายวรรคตอนเป็นวิธีสำรอง ใช้ {delimiter} เพื่อควบคุมให้ละเอียดขึ้น เช่น {example}'
	},
	tokenEditor: {
		tokens: 'หน่วยคำ',
		mergeSelected: 'รวมที่เลือก',
		splitAtBoundary: 'แยกหน่วยคำที่ขอบเขตนี้',
		selectTokens: 'เลือกหน่วยคำ'
	},
	footer: {
		info: 'แอปนี้ไม่อ้างสิทธิ์ในภาพประกอบที่คุณสร้างที่นี่ คุณจะใช้หรือแชร์อย่างไรก็ขึ้นอยู่กับคุณ หากช่วยแชร์เครื่องมือนี้จะขอบคุณมาก',
		githubRepository: 'คลัง GitHub',
		announcement: 'โพสต์ประกาศ',
		by: 'โดย'
	},
	ui: { selected: 'เลือกแล้ว' },
	dialog: { editing: 'กำลังแก้ไข', confirm: 'ยืนยัน', cancel: 'ยกเลิก' },
	confirm: {
		deleteSentence: 'ต้องการลบประโยคนี้จริงหรือไม่?',
		new: 'ต้องการสร้างภาพประกอบใหม่จริงหรือไม่? ทุกอย่างจะถูกลบ'
	},
	menu: { new: 'ใหม่', import: 'นำเข้า', export: 'ส่งออก', svg: 'ส่งออก SVG', png: 'ส่งออก PNG', scramble: 'สลับสี' }
};

export default th;
