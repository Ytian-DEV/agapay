import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe, Search, X } from 'lucide-react';
import {
  changeAppLanguage,
  getLanguageOption,
  PHILIPPINE_LANGUAGES,
  type SupportedLanguageCode,
} from '../i18n';
import { useAppState } from '../context/AppStateContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'row';
  className?: string;
}

export function LanguageSwitcher({ variant = 'pill', className = '' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const { updateProfile } = useAppState();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = getLanguageOption(i18n.language);

  const filtered = PHILIPPINE_LANGUAGES.filter((lang) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      lang.nativeName.toLowerCase().includes(q) ||
      lang.englishName.toLowerCase().includes(q) ||
      lang.regionHint.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: SupportedLanguageCode) => {
    changeAppLanguage(code);
    void updateProfile({ preferred_language: code });
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('common.chooseLanguage')}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--ink)] shadow-xs transition hover:border-[var(--accent)] ${className}`}
        >
          <Globe size={17} className="text-[var(--accent)]" />
          <span className="max-w-[130px] truncate">{current.nativeName}</span>
          <ChevronDown size={15} className="text-[var(--sub)]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[var(--surface-muted)] ${className}`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Globe size={18} />
            </span>
            <span className="text-[15px] font-semibold text-[var(--ink)]">
              {t('common.language')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--sub)]">
            <span>{current.nativeName}</span>
            <ChevronDown size={16} />
          </div>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('common.chooseLanguage')}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--ink)]">
                  {t('common.chooseLanguage')}
                </h2>
                <p className="text-xs text-[var(--sub)]">{t('welcome.chooseLangHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pt-3">
              <label className="relative block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--sub)]"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('common.searchLanguage')}
                  className="min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] pl-10 pr-4 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-2 flex-1 overflow-y-auto px-3 pb-safe">
              <ul className="space-y-1 py-2">
                {filtered.map((lang) => {
                  const selected = lang.code === current.code;
                  return (
                    <li key={lang.code}>
                      <button
                        type="button"
                        onClick={() => handleSelect(lang.code)}
                        className={`flex min-h-[56px] w-full items-center justify-between rounded-2xl px-4 py-2.5 text-left transition ${
                          selected
                            ? 'bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]'
                            : 'hover:bg-[var(--surface-muted)]'
                        }`}
                      >
                        <div>
                          <div className="text-[15px] font-semibold text-[var(--ink)]">
                            {lang.nativeName}
                          </div>
                          <div className="text-xs text-[var(--sub)]">{lang.regionHint}</div>
                        </div>
                        {selected && (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
                            <Check size={16} strokeWidth={2.8} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
