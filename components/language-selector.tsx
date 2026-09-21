'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Afaan Oromoo', nativeName: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
]

export function LanguageSelector() {
  const locale = useLocale()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(l => l.code === locale)

  return (
    <div className="relative" data-language-selector-container>
      <button
        data-language-selector-trigger
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cream-400 transition-colors"
      >
        <span className="text-sm font-medium">
          {currentLanguage?.nativeName}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-cream-400 z-50">
          {languages.map((lang) => (
            <Link
              key={lang.code}
              href={pathname}
              locale={lang.code}
              onClick={() => {
                localStorage.setItem('preferred-locale', lang.code)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 hover:bg-cream-400 first:rounded-t-lg last:rounded-b-lg transition-colors block ${
                locale === lang.code ? 'bg-emerald-100 text-emerald-700' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.nativeName}</span>
                <span className="text-xs text-ink-500">{lang.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}