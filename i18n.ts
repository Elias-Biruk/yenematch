import { getRequestConfig } from 'next-intl/server'

const locales = ['en', 'am', 'om', 'ti']

export default getRequestConfig(async ({ locale }) => {
  // Provide a default locale if none is specified
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en'
  }

  return {
    locale: locale as string,
    messages: (await import(`./locales/${locale}/common.json`)).default
  }
})
