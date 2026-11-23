/** Composes real app captures into 1270x760 launch-gallery slides (rendered at 2x). */
export const SLIDE = { width: 1270, height: 760 };

const css = `
*{box-sizing:border-box;margin:0}
body{width:1270px;height:760px;overflow:hidden;font-family:Geist,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.slide{position:relative;width:1270px;height:760px;overflow:hidden;color:var(--ink)}
.green{--ink:#fff;--soft:#bfe3d6;--pill:rgba(255,255,255,.12);--pillInk:#d8f3e8;background:radial-gradient(900px 600px at 85% 0%,#2c9a7b 0%,transparent 65%),radial-gradient(800px 600px at 0% 100%,#0b3d31 0%,transparent 70%),#14584a}
.cream{--ink:#14201c;--soft:#5d665f;--pill:#dcefe6;--pillInk:#134537;background:radial-gradient(800px 560px at 100% 0%,#d5ece1 0%,transparent 70%),radial-gradient(700px 500px at 0% 100%,#f6e6c8 0%,transparent 70%),#f7f6f0}
.night{--ink:#f1f3ef;--soft:#9fb0a8;--pill:rgba(92,196,160,.16);--pillInk:#8fe0c2;background:radial-gradient(800px 600px at 80% 10%,#1d4f41 0%,transparent 70%),#0b0f0d}
.sand{--ink:#14201c;--soft:#6b6149;--pill:#f5dfb3;--pillInk:#6b4300;background:radial-gradient(800px 560px at 100% 100%,#f3d9a4 0%,transparent 70%),radial-gradient(600px 500px at 0% 0%,#fffdf6 0%,transparent 70%),#f8f0df}
.slide::before{content:"";position:absolute;inset:0;background-image:radial-gradient(currentColor 1px,transparent 1.2px);background-size:22px 22px;opacity:.07;-webkit-mask-image:linear-gradient(120deg,#000,transparent 60%)}
.brand{position:absolute;display:flex;align-items:center;gap:10px;font-weight:650;font-size:18px;letter-spacing:-.02em}
.brand svg{width:32px;height:32px}
.pill{display:inline-block;padding:7px 14px;border-radius:99px;background:var(--pill);color:var(--pillInk);font-size:14px;font-weight:600}
h1{font-weight:720;letter-spacing:-.045em;line-height:1.02;text-wrap:balance}
p{color:var(--soft);line-height:1.45;text-wrap:pretty}
.copy{position:absolute;z-index:3}
.copy h1{font-size:54px;margin:18px 0 16px}
.copy p{font-size:20px}
.win{position:absolute;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(10,30,24,.1),0 50px 90px -20px rgba(6,28,22,.45),0 18px 36px -14px rgba(6,28,22,.3)}
.bar{height:34px;display:flex;align-items:center;gap:8px;padding:0 14px;background:#efeee8;border-bottom:1px solid #dddad0}
.bar i{width:11px;height:11px;border-radius:50%;background:#e0705f}.bar i:nth-child(2){background:#e6b655}.bar i:nth-child(3){background:#63b56f}
.dark .bar{background:#1c2220;border-color:#2a302d}
.win img{display:block;width:100%}
.phone{position:absolute;padding:9px;border-radius:44px;background:#0d1210;box-shadow:0 0 0 1.5px #3a4642,0 50px 80px -20px rgba(4,20,16,.6)}
.phone div{padding-top:24px;border-radius:35px;overflow:hidden;background:var(--status)}
.phone::before{content:"";position:absolute;z-index:1;top:16px;left:50%;width:58px;height:15px;margin-left:-29px;border-radius:9px;background:#0d1210}
.phone img{display:block;width:100%}
.pop{position:absolute;z-index:4;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(10,30,24,.1),0 0 0 6px rgba(255,255,255,.45),0 34px 60px -16px rgba(6,28,22,.5)}
.pop img{display:block;width:100%}
`;

const logo = `<svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#1b6b57"/><g transform="translate(8 8) scale(.667)" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></g></svg>`;
const uri = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;
const box = ({ x, y, w, t = '' }) => `left:${x}px;top:${y}px;width:${w}px;${t ? `transform:${t};` : ''}`;

export const brand = (x, y) => `<div class="brand" style="left:${x}px;top:${y}px">${logo}Let's Learn</div>`;
export const copy = ({ x, y, w, pill, title, text, size = 54, align = 'left' }) =>
  `<div class="copy" style="left:${x}px;top:${y}px;width:${w}px;text-align:${align}"><span class="pill">${pill}</span><h1 style="font-size:${size}px">${title}</h1><p>${text}</p></div>`;
export const win = (shot, at, dark = false) =>
  `<div class="win ${dark ? 'dark' : ''}" style="${box(at)}"><div class="bar"><i></i><i></i><i></i></div><img src="${uri(shot)}"></div>`;
export const phone = (shot, at, dark = false) =>
  `<div class="phone" style="${box(at)}--status:${dark ? '#0f1211' : '#f8f8f5'}"><div><img src="${uri(shot)}"></div></div>`;
export const pop = (shot, at) => `<div class="pop" style="${box(at)}"><img src="${uri(shot)}"></div>`;

/** Enlarges a captured element in place, anchored to where it sits in an untilted window. */
export const popFrom = ({ shot, rect }, at, zoom, viewport = 1280) => {
  const scale = at.w / viewport;
  const w = rect.width * scale * zoom;
  const x = at.x + (rect.x + rect.width / 2) * scale - w / 2;
  return pop(shot, { x: Math.max(16, Math.min(SLIDE.width - w - 16, x)), y: at.y + 34 + rect.y * scale, w });
};

export async function renderSlide(browser, fontFaces, theme, parts, path) {
  const page = await browser.newPage({ viewport: SLIDE, deviceScaleFactor: 2 });
  await page.setContent(`<style>${fontFaces}${css}</style><div class="slide ${theme}">${parts.join('')}</div>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode()));
  });
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  await page.close();
}

/** Inlines the app's own Geist font so slides match the product's typography. */
export async function appFont(page) {
  const faces = await page.evaluate(async () => {
    const out = [];
    for (const sheet of document.styleSheets)
      for (const rule of sheet.cssRules)
        if (rule instanceof CSSFontFaceRule && /geist/i.test(rule.cssText) && !/mono|fallback/i.test(rule.style.fontFamily || rule.cssText)) {
          const url = /url\("?([^")]+)"?\)/.exec(rule.cssText)?.[1];
          if (!url) continue;
          const bytes = new Uint8Array(await (await fetch(new URL(url, sheet.href || location.href))).arrayBuffer());
          let binary = '';
          for (const byte of bytes) binary += String.fromCharCode(byte);
          out.push({ data: btoa(binary), range: /unicode-range:\s*([^;}]+)/i.exec(rule.cssText)?.[1] });
        }
    return out;
  });
  return faces
    .map((f) => `@font-face{font-family:Geist;font-weight:100 900;src:url(data:font/woff2;base64,${f.data}) format("woff2");${f.range ? `unicode-range:${f.range}` : ''}}`)
    .join('');
}
