import type { Translation } from '../i18n-types';

const bn: Translation = {
	meta: { title: 'শব্দক্রম চিত্রকর' },
	params: {
		options: 'বিকল্প',
		verticalGap: 'উল্লম্ব ফাঁক',
		lineGap: 'রেখার ফাঁক',
		straightLength: 'সোজা অংশ',
		endpointCorrection: 'শেষবিন্দু সংশোধন',
		textAlignment: 'পাঠ্য সারিবদ্ধকরণ',
		displayLanguage: 'প্রদর্শনের ভাষা',
		text: 'পাঠ্য',
		fontFamily: 'ফন্ট পরিবার',
		default: 'ডিফল্ট',
		serif: 'সেরিফ',
		sansSerif: 'সান্স সেরিফ',
		monospace: 'সমান প্রস্থ',
		fontStyle: 'ফন্টের ধরন',
		normal: 'স্বাভাবিক',
		italic: 'ইটালিক',
		bold: 'বোল্ড',
		boldItalic: 'বোল্ড ইটালিক',
		fontSize: 'ফন্টের আকার'
	},
	input: {
		input: 'ইনপুট',
		placeholder: 'এখানে নতুন বাক্য লিখুন…',
		add: 'যোগ করুন',
		modify: 'পরিবর্তন করুন',
		guidance:
			'সম্ভব হলে ভাষা-সচেতন বিভাজন দিয়ে শব্দগুলো স্বয়ংক্রিয়ভাবে ভাগ করা হয়, নইলে ফাঁক ও যতিচিহ্ন দিয়ে ভাগ করা হয়। আরও সূক্ষ্ম নিয়ন্ত্রণের জন্য {delimiter} ব্যবহার করুন, যেমন {example}'
	},
	tokenEditor: {
		tokens: 'টোকেন',
		mergeSelected: 'নির্বাচিতগুলো মেলান',
		splitAtBoundary: 'এই সীমানায় টোকেন ভাগ করুন',
		selectTokens: 'টোকেন নির্বাচন করুন'
	},
	footer: {
		info: 'এই অ্যাপ এখানে আপনার তৈরি করা চিত্রের ওপর কোনো অধিকার দাবি করে না। আপনি সেগুলো কীভাবে ব্যবহার বা ভাগ করবেন, তা সম্পূর্ণ আপনার ইচ্ছা। এই সরঞ্জামটি ভাগ করলে আমরা কৃতজ্ঞ থাকব।',
		githubRepository: 'GitHub রিপোজিটরি',
		announcement: 'ঘোষণার পোস্ট',
		by: 'দ্বারা'
	},
	ui: { selected: 'নির্বাচিত' },
	dialog: { editing: 'সম্পাদনা চলছে', confirm: 'নিশ্চিত করুন', cancel: 'বাতিল' },
	confirm: {
		deleteSentence: 'আপনি কি নিশ্চিত যে এই বাক্যটি মুছতে চান?',
		new: 'আপনি কি নিশ্চিত যে নতুন চিত্র তৈরি করতে চান? এতে সবকিছু মুছে যাবে।'
	},
	menu: { new: 'নতুন', import: 'আমদানি', export: 'রপ্তানি', svg: 'SVG রপ্তানি', png: 'PNG রপ্তানি', scramble: 'রং এলোমেলো করুন' }
};

export default bn;
