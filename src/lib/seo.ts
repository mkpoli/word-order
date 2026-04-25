export const siteName = 'Word Order Illustrator';
export const siteDescription =
	'Create clear, shareable word-order diagrams for translations, interlinear examples, language learning, and linguistics teaching.';
export const siteKeywords = [
	'word order',
	'linguistics',
	'translation',
	'interlinear gloss',
	'language learning',
	'sentence alignment',
	'syntax visualization'
];
export const themeColor = '#2c47ff';

export function getCanonicalUrl(origin: string): string {
	return new URL('/', origin).toString();
}

export function getOgImageUrl(origin: string): string {
	return new URL('/og-image.png', origin).toString();
}

export function getJsonLd(origin: string): string {
	const canonicalUrl = getCanonicalUrl(origin);
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: siteName,
		description: siteDescription,
		url: canonicalUrl,
		applicationCategory: 'EducationalApplication',
		operatingSystem: 'Any',
		browserRequirements: 'Requires JavaScript and a modern web browser',
		isAccessibleForFree: true,
		creator: {
			'@type': 'Person',
			name: 'mkpoli',
			url: 'https://mkpo.li/'
		},
		sameAs: ['https://github.com/mkpoli/word-order/', 'https://twitter.com/mkpoli/'],
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		}
	};

	return JSON.stringify(jsonLd);
}
