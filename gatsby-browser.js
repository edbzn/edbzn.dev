import '@fontsource/merriweather/300.css';
import '@fontsource/merriweather/400.css';
import '@fontsource/merriweather/900.css';

import '@fontsource/public-sans/100.css';
import '@fontsource/public-sans/200.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/900.css';

import './static/css/code-theme.css';
import './static/css/main.css';

export const onRouteUpdate = () => {
  const main = document.querySelector('main');
  if (!main) return;
  main.classList.remove('page-enter');
  // Force reflow so the animation restarts
  void main.offsetWidth;
  main.classList.add('page-enter');
};
