import { useTranslations } from 'next-intl'

/**
 * Helper hook for common translations
 */
export function useAppTranslations() {
  const t = useTranslations()
  
  return {
    // App
    appName: t('app.name'),
    tagline: t('app.tagline'),
    
    // Common
    welcome: t('common.welcome'),
    loading: t('common.loading'),
    error: t('common.error'),
    retry: t('common.retry'),
    cancel: t('common.cancel'),
    save: t('common.save'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    back: t('common.back'),
    next: t('common.next'),
    skip: t('common.skip'),
    done: t('common.done'),
    submit: t('common.submit'),
    confirm: t('common.confirm'),
    yes: t('common.yes'),
    no: t('common.no'),
    search: t('common.search'),
    filter: t('common.filter'),
    clear: t('common.clear'),
    apply: t('common.apply'),
    close: t('common.close'),
    view: t('common.view'),
    more: t('common.more'),
    less: t('common.less'),
    all: t('common.all'),
    none: t('common.none'),
    select: t('common.select'),
    selected: t('common.selected'),
    
    // Auth
    signIn: t('auth.signIn'),
    signInToStart: t('auth.signInToStart'),
    continueWithTelegram: t('auth.continueWithTelegram'),
    authenticating: t('auth.authenticating'),
    openInTelegram: t('auth.openInTelegram'),
    retryAuth: t('auth.retryAuth'),
    loginFailed: t('auth.loginFailed'),
    authenticatingWithTelegram: t('auth.authenticatingWithTelegram'),
    devLogin: t('auth.devLogin'),
    loggingIn: t('auth.loggingIn'),
    developmentMode: t('auth.developmentMode'),
    devAuthDescription: t('auth.devAuthDescription'),
    termsAndPrivacy: t('auth.termsAndPrivacy'),
    
    // Navigation
    discover: t('navigation.discover'),
    likes: t('navigation.likes'),
    matches: t('navigation.matches'),
    messages: t('navigation.messages'),
    profile: t('navigation.profile'),
    settings: t('navigation.settings'),
    onboarding: t('navigation.onboarding'),
    
    // Gender
    male: t('gender.male'),
    female: t('gender.female'),
    other: t('gender.other'),
    
    // Cities
    addisAbaba: t('cities.addisAbaba'),
    hawassa: t('cities.hawassa'),
    adama: t('cities.adama'),
    mekele: t('cities.mekele'),
    bahirDar: t('cities.bahirDar'),
    
    // Validation
    required: t('validation.required'),
    invalidEmail: t('validation.invalidEmail'),
    minLength: (min: number) => t('validation.minLength', { min }),
    maxLength: (max: number) => t('validation.maxLength', { max }),
    mustBeNumber: t('validation.mustBeNumber'),
    mustBeAtLeast: (min: number) => t('validation.mustBeAtLeast', { min }),
    mustBeAtMost: (max: number) => t('validation.mustBeAtMost', { max }),
  }
}