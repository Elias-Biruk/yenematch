'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Globe } from 'lucide-react'

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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(l => l.code === locale)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" data-language-selector-container ref={dropdownRef}>
      <button
        data-language-selector-trigger
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-cream-100 transition-all duration-200 active:scale-95"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-5 h-5 text-ink-600" />
        <span className="text-sm font-medium text-ink-700">
          {currentLanguage?.nativeName}
        </span>
        <svg 
          className={`w-4 h-4 text-ink-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium-lg border border-cream-400 z-50 animate-slide-down">
          <div className="p-2">
            {languages.map((lang) => (
              <Link
                key={lang.code}
                href={pathname}
                locale={lang.code}
                onClick={() => {
                  localStorage.setItem('preferred-locale', lang.code)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors block ${
                  locale === lang.code ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-ink-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{lang.nativeName}</span>
                  <span className="text-xs text-ink-500">{lang.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}