"use client";

import { useLanguage } from "../language";

export function LanguageSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-label="English">
        EN
      </button>
      <button type="button" className={lang === "hi" ? "active" : ""} onClick={() => setLang("hi")} aria-label="Romanized Hindi">
        HI <span lang="hi">हिं</span>
      </button>
    </div>
  );
}
