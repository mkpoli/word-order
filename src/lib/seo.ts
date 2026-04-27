export const themeColor = '#2c47ff';

export function getCanonicalUrl(origin: string): string {
	return new URL('/', origin).toString();
}

export function getOgImageUrl(origin: string): string {
	return new URL('/og-image.png', origin).toString();
}

export function getJsonLd(
	origin: string,
	{ name, description, locale }: { name: string; description: string; locale: string }
): string {
	const canonicalUrl = getCanonicalUrl(origin);
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name,
		description,
		url: canonicalUrl,
		inLanguage: locale,
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
