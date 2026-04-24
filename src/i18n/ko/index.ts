import type { Translation } from '../i18n-types';

const ko: Translation = {
	meta: {
		title: '어순 일러스트레이터'
	},
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
			'단어는 지원되는 환경에서는 언어에 맞게 자동 분리되며, 사용할 수 없을 때는 공백과 문장 부호를 기준으로 분리됩니다. 더 세밀하게 나누려면 {delimiter}을 사용하세요. 예: {example}'
	},
	tokenEditor: {
		tokens: '토큰',
		mergeSelected: '선택 병합',
		splitAtBoundary: '이 경계에서 토큰 분할',
		selectTokens: '토큰 선택'
	},
	footer: {
		info: '이 도구로 생성한 이미지에 대해 본 도구는 어떠한 권리도 주장하지 않습니다. 사용하거나 공개하는 방식은 자유롭게 결정하실 수 있습니다. 이 도구를 공유해 주시거나 출처를 남겨 주시면 제작자에게 큰 기쁨이 됩니다.',
		githubRepository: 'GitHub 저장소',
		announcement: '안내 게시물',
		by: '제작'
	},
	ui: {
		selected: '선택됨'
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
		png: 'PNG 내보내기',
		scramble: '색상 섞기'
	}
};

export default ko;
