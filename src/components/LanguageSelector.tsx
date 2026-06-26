import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '../translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'pt-BR', label: t.langPt, flag: '🇧🇷' },
    { code: 'en', label: t.langEn, flag: '🇺🇸' },
    { code: 'es', label: t.langEs, flag: '🇪🇸' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div id="language-selector-wrapper" className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="btn-language-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
      >
        <span className="text-sm shrink-0">{currentLang.flag}</span>
        <span className="hidden sm:inline text-slate-600">{currentLang.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-450 shrink-0" />
      </button>

      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-lg z-50 py-1.5 animate-scaleUp"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              id={`lang-option-${lang.code}`}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium cursor-pointer transition-colors ${
                language === lang.code
                  ? 'bg-slate-50 text-indigo-600 font-semibold'
                  : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0">{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
