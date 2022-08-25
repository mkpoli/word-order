import type { Locales } from '$i18n/i18n-types'
import { detectLocale } from '$i18n/i18n-util'
import { initAcceptLanguageHeaderDetector } from 'typesafe-i18n/detectors'
import type { LayoutServerLoad } from './$types'


function getHeaders(request: Request) {
  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => { headers[key] = value })
  return headers
}

export const load: LayoutServerLoad<{ locale: Locales }> = ({ request }) => {
  const headers = getHeaders(request)
  const acceptLanguageDetector = initAcceptLanguageHeaderDetector({ headers })
  const locale = detectLocale(acceptLanguageDetector)

  console.log('+layout.server.ts: locale', locale)

  return {
    locale
  };
}
