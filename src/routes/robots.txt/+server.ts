import { getCanonicalUrl } from '$lib/seo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const body = [`User-agent: *`, `Allow: /`, `Sitemap: ${new URL('/sitemap.xml', getCanonicalUrl(url.origin)).toString()}`, ''].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
