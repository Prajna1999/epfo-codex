"use client";

import { languages, useLanguage } from "../language";

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switch">
      <select value={lang} onChange={(event) => setLang(event.target.value as typeof lang)} aria-label="Romanized Indic language">
        {languages.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select>
    </div>
  );
}
