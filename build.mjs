import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = await readFile('link-na-bio.html', 'utf8');

const css = String.raw`
/* Ajustes pontuais do site do Leandro. Mantém o HTML original intacto. */
.lm-fluxo-arrow-soft {
  box-shadow: 0 4px 12px rgba(27, 190, 245, 0.16) !important;
  filter: none !important;
}

.lm-fluxo-arrow-soft::before,
.lm-fluxo-arrow-soft::after {
  box-shadow: none !important;
  filter: none !important;
  opacity: 0.28 !important;
}

.lm-fluxo-arrow-soft > *,
.lm-fluxo-arrow-soft svg {
  filter: none !important;
  text-shadow: none !important;
}
`;

const js = String.raw`
(() => {
  const TRAFFIC_URL = 'https://nivvo.online/f/linkbio';
  const INSTAGRAM_URL = 'https://www.instagram.com/leandromecenas/';

  const normalize = (value = '') => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const isTrafficText = (text) => {
    const t = normalize(text);
    return t.includes('quero mais leads de imovel todo mes') ||
      t.includes('quero vender mais imoveis') ||
      t.includes('contratar gestor de trafego') ||
      t.includes('gestao de trafego');
  };

  const findTrafficCard = () => {
    const explicit = [...document.querySelectorAll('a[href]')].find((a) =>
      (a.getAttribute('href') || '').includes('nivvo.online/f/linkbio')
    );
    if (explicit) return explicit;

    const candidates = [...document.querySelectorAll('a, button, [role="button"], article, section, div')]
      .filter((el) => isTrafficText(el.textContent || ''))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 220 && r.height > 150;
      })
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return (ra.width * ra.height) - (rb.width * rb.height);
      });

    return candidates[0] || null;
  };

  const configureTraffic = (card) => {
    if (!card) return;

    const anchor = card.matches('a[href]')
      ? card
      : card.querySelector('a[href]') || card.closest('a[href]');

    if (anchor) {
      anchor.setAttribute('href', TRAFFIC_URL);
      anchor.setAttribute('target', '_self');
      anchor.removeAttribute('download');
    }

    const clickable = anchor || card;
    if (!clickable.dataset.lmTrafficBound) {
      clickable.dataset.lmTrafficBound = '1';
      clickable.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.assign(TRAFFIC_URL);
      });
    }
  };

  const configureInstagram = () => {
    document.querySelectorAll('a').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      const meta = normalize([
        anchor.textContent || '',
        anchor.getAttribute('aria-label') || '',
        anchor.getAttribute('title') || '',
        href
      ].join(' '));

      if (/instagram\.com/i.test(href) || meta.includes('instagram')) {
        anchor.setAttribute('href', INSTAGRAM_URL);
        anchor.setAttribute('target', '_self');
        anchor.removeAttribute('download');
      }
    });
  };

  const softenFluxoArrow = (card) => {
    if (!card) return;

    const cardRect = card.getBoundingClientRect();
    let best = null;
    let bestScore = -Infinity;

    [...card.querySelectorAll('*')].forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 38 || r.width > 110 || r.height < 38 || r.height > 110) return;
      if (Math.abs(r.width - r.height) > 16) return;

      const style = getComputedStyle(el);
      const radius = parseFloat(style.borderTopLeftRadius) || 0;
      if (radius < Math.min(r.width, r.height) * 0.32) return;

      const hasArrow = !!el.querySelector('svg') || /[→➜➝›>]/.test(el.textContent || '');
      if (!hasArrow) return;

      const centerX = r.left + r.width / 2;
      const centerY = r.top + r.height / 2;
      const xRatio = (centerX - cardRect.left) / Math.max(cardRect.width, 1);
      const yRatio = (centerY - cardRect.top) / Math.max(cardRect.height, 1);
      const shadowBonus = style.boxShadow && style.boxShadow !== 'none' ? 4 : 0;
      const score = xRatio * 6 + (1 - yRatio) * 5 + shadowBonus;

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    });

    if (!best) return;

    best.classList.add('lm-fluxo-arrow-soft');
    best.style.boxShadow = '0 4px 12px rgba(27, 190, 245, 0.16)';
    best.style.filter = 'none';

    best.querySelectorAll('*').forEach((child) => {
      child.style.filter = 'none';
      child.style.textShadow = 'none';
    });

    const parent = best.parentElement;
    if (parent && card.contains(parent)) {
      const r = parent.getBoundingClientRect();
      if (r.width <= 130 && r.height <= 130) {
        parent.classList.add('lm-fluxo-arrow-soft');
        parent.style.filter = 'none';
      }
    }
  };

  const apply = () => {
    const trafficCard = findTrafficCard();
    configureTraffic(trafficCard);
    configureInstagram();
    softenFluxoArrow(trafficCard);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  window.addEventListener('load', apply, { once: true });
  setTimeout(apply, 500);
})();
`;

const styleTag = `\n<style id="lm-site-patch">${css}</style>\n`;
const scriptTag = `\n<script id="lm-site-patch-js">${js}</script>\n`;

let html = source;
html = /<\/head>/i.test(html)
  ? html.replace(/<\/head>/i, styleTag + '</head>')
  : styleTag + html;
html = /<\/body>/i.test(html)
  ? html.replace(/<\/body>/i, scriptTag + '</body>')
  : html + scriptTag;

await mkdir('dist', { recursive: true });
await Promise.all([
  writeFile('dist/index.html', html, 'utf8'),
  writeFile('dist/link-na-bio.html', html, 'utf8'),
]);
