import type { Translation } from '../i18n-types';

const vi: Translation = {
	meta: { title: 'Công cụ minh họa trật tự từ' },
	params: {
		options: 'Tùy chọn',
		verticalGap: 'Khoảng cách dọc',
		lineGap: 'Khoảng cách đường',
		straightLength: 'Đoạn thẳng',
		endpointCorrection: 'Hiệu chỉnh điểm cuối',
		textAlignment: 'Căn chỉnh văn bản',
		displayLanguage: 'Ngôn ngữ hiển thị',
		text: 'Văn bản',
		fontFamily: 'Phông chữ',
		default: 'Mặc định',
		serif: 'Serif',
		sansSerif: 'Sans serif',
		monospace: 'Đơn cách',
		fontStyle: 'Kiểu chữ',
		normal: 'Thường',
		italic: 'Nghiêng',
		bold: 'Đậm',
		boldItalic: 'Đậm nghiêng',
		fontSize: 'Cỡ chữ'
	},
	input: {
		input: 'Nhập',
		placeholder: 'Nhập câu mới tại đây…',
		add: 'Thêm',
		modify: 'Sửa',
		guidance:
			'Từ sẽ được tách tự động bằng cách phân đoạn theo ngôn ngữ khi có thể, hoặc dựa vào khoảng trắng và dấu câu. Dùng {delimiter} để kiểm soát chi tiết hơn, ví dụ {example}'
	},
	tokenEditor: {
		tokens: 'Mảnh từ',
		mergeSelected: 'Gộp mục đã chọn',
		splitAtBoundary: 'Tách mảnh tại ranh giới này',
		selectTokens: 'Chọn mảnh từ'
	},
	footer: {
		info: 'Ứng dụng này không tuyên bố quyền sở hữu đối với các minh họa bạn tạo tại đây. Cách bạn sử dụng hoặc chia sẻ chúng hoàn toàn do bạn quyết định. Rất hoan nghênh việc chia sẻ công cụ này.',
		githubRepository: 'Kho GitHub',
		announcement: 'Bài thông báo',
		by: 'bởi'
	},
	ui: { selected: 'Đã chọn' },
	dialog: { editing: 'Đang sửa', confirm: 'Xác nhận', cancel: 'Hủy' },
	confirm: {
		deleteSentence: 'Bạn có chắc muốn xóa câu này không?',
		new: 'Bạn có chắc muốn tạo minh họa mới không? Thao tác này sẽ xóa mọi thứ.'
	},
	menu: { new: 'Mới', import: 'Nhập', export: 'Xuất', svg: 'Xuất SVG', png: 'Xuất PNG', scramble: 'Xáo màu' }
};

export default vi;
