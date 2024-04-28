import type { Translation } from '../i18n-types';

const ko: Translation = {
	params: {
		options: '옵션',
		verticalGap: '줄 간격',
		lineGap: '직선 틈',
		straightLength: '직선 길이',
		endpointCorrection: '종점 보정',
		textAlignment: '문자 정렬',
		displayLanguage: '표시 언어',
		text: '문자',
		fontFamily: '글꼴',
		default: '기본',
		serif: '세리프',
		sansSerif: '산세리프',
		monospace: '고정 폭',
		fontStyle: '글꼴 스타일',
		normal: '일반',
		italic: '이탤릭',
		bold: '볼드',
		boldItalic: '볼드 이탤릭',
		fontSize: '글꼴 크기'
	},
	input: {
		input: '입력',
		placeholder: '새로운 문장을 여기에 입력하세요…',
		add: '추가',
		modify: '수정',
		guidance:
			'각 단어는 자동으로 공백 또는 숫자로 분리되어 있습니다. 한층 더 분리하는 경우나, 일본어・중국어・태국어등의 공백 의해 단어가 나뉘어져 있지 않은 언어의 경우는 {delimiter}을 사용하여 해당 문장을 분리하십시오. 예를 들어, {example}'
	},
	footer: {
		info: '이 툴은의해 생성된 삽화는 {license} 라이선스에 따라 제공됩니다. 즉 완전 저작권 무료이며, 자유롭게 사용할 수 있습니다. 또, 강제는 아니지만, 이용할 때에 쉐어나 출처 밝히는 환영합니다.'
	},
	dialog: {
		editing: '편집 중',
		confirm: '확인',
		cancel: '취소'
	},
	confirm: {
		deleteSentence: '이 문장을 삭제하시겠습니까?',
		new: '새로운 삽화를 만드시겠습니까? 이 기능은 모든 데이터를 삭제합니다!'
	},
	menu: {
		new: '새로 만들기',
		import: '가져오기',
		export: '내보내기',
		svg: 'SVG 내보내기',
		png: 'PNG 내보내기'
	}
};

export default ko;
