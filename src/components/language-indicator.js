import React from 'react';
import * as styles from './language-indicator.module.css';

const LANGUAGES = {
  en: { label: 'English', flag: '🇬🇧' },
  fr: { label: 'Français', flag: '🇫🇷' },
};

/**
 * Language of a non-English post: a flag badge, or with `plain` just the
 * language name, to sit in a line of muted text (the post list).
 */
export const LanguageIndicator = ({ lang, style, plain = false }) => {
  if (!lang || lang === 'en') return null;

  const language = LANGUAGES[lang] ?? { label: lang, flag: '🌐' };

  if (plain) {
    return (
      <span style={style} lang={lang}>
        {language.label}
      </span>
    );
  }

  return (
    <span className={styles.badge} style={style} title={language.label}>
      <span role="img" aria-label={language.label}>
        {language.flag}
      </span>
      {language.label}
    </span>
  );
};
