import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: '🇺🇸 English' },
  { code: 'pt', name: '🇵🇹 Português' },
  { code: 'es', name: '🇪🇸 Español' },
  { code: 'fr', name: '🇫🇷 Français' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18n_language', langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('i18n_language');
    if (savedLang && languages.some(lang => lang.code === savedLang)) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white hover:bg-gray-50 rounded-lg px-3 py-2 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300"
      >
        <span className="text-sm font-medium text-gray-900">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-40 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 ${
                lang.code === i18n.language ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
