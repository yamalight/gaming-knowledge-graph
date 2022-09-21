import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export const extractMainContentFromURL = async (url) => {
  const html = await fetch(url).then((r) => r.text());
  const doc = new JSDOM(html, { url });
  const reader = new Readability(doc.window.document);
  const parsed = reader.parse();
  if (!parsed) {
    return { html };
  }
  const { title, lang, textContent, excerpt } = parsed;
  return {
    title,
    excerpt,
    lang,
    html,
    textContent: textContent.replace(/\n+/g, '\n'),
  };
};
