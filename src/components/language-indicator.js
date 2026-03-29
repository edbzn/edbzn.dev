import React from 'react';
import * as styles from './language-indicator.module.css';

const LANGUAGES = {
  en: { label: 'English', flag: '🇬🇧' },
  fr: { label: 'Français', flag: '🇫🇷' },
};

export const LanguageIndicator = ({ lang, style }) => {
  if (!lang || lang === 'en') return null;

  const language = LANGUAGES[lang] ?? { label: lang, flag: '🌐' };

  return (
    <span className={styles.badge} style={style} title={language.label}>
      <span role="img" aria-label={language.label}>
        {language.flag}
      </span>
      {language.label}
    </span>
  );
};
