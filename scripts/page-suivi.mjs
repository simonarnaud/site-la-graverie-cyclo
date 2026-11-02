// Page de suivi partagée au bureau, générée depuis TODO-MISE-EN-LIGNE.md (cases, rôles, encadré « Où on en est »).
// Usage : node scripts/page-suivi.mjs TODO-MISE-EN-LIGNE.md sortie.html   (puis publier sortie.html comme page Claude)
import { readFileSync, writeFileSync } from 'node:fs';

const [, , source, cible] = process.argv;
const md = readFileSync(source, 'utf8').replace(/\r\n/g, '\n');
const DEPOT = 'https://github.com/simonarnaud/site-la-graverie-cyclo/blob/main/';

const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ROLES = { '🏛️': ['bureau', 'Bureau'], '✍️': ['redac', 'Rédacteur'], '🛠️': ['tech', 'Technique'] };
const pastilles = (t) =>
  t.replace(/(🏛️|✍️|🛠️)/g, (e) => `<span class="role ${ROLES[e][0]}">${ROLES[e][1]}</span>`);
function enLigne(t) {
  let h = echapper(t);
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => {
    const href = /^https?:/.test(url) ? url : DEPOT + url;
    return `<a href="${href}" target="_blank" rel="noopener">${txt}</a>`;
  });
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[\s(])(https:\/\/[^\s<)]+[^\s<).,])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  return pastilles(h);
}

const lignes = md.split('\n');
let intro = [];
const sections = [];
let fin = '';
let courante;
// Section « ▶ Où on en est » : état et suite des opérations, affichés dans un encadré
let etatTitre = '';
const etat = [];
let dansEtat = false;
for (const l of lignes) {
  if (l.startsWith('# ')) continue;
  if (l.startsWith('## ▶')) { dansEtat = true; etatTitre = l.replace(/^## ▶/, '').replace(/^[^\p{L}]+/u, ''); continue; }
  if (dansEtat) {
    if (l === '---') { dansEtat = false; continue; }
    if (l.trim()) etat.push(l);
    continue;
  }
  const titre = l.match(/^## (\d+)\. (.+)$/);
  if (titre) {
    const [, num, reste] = titre;
    courante = { num, titre: reste.replace(/\s*(🏛️|✍️|🛠️)/g, '').trim(), roles: reste.match(/🏛️|✍️|🛠️/g) ?? [], notes: [], items: [] };
    sections.push(courante);
    continue;
  }
  const item = l.match(/^- \[( |x)\] (.+)$/);
  if (item && courante) { courante.items.push({ fait: item[1] === 'x', texte: item[2] }); continue; }
  if (l.startsWith('**Après la mise en ligne**')) { fin = l; continue; }
  if (!l.trim() || l === '---') continue;
  if (courante) courante.notes.push(l); else intro.push(l);
}

// Rendu de l'encadré : paragraphes, liste numérotée « 1. », sous-listes « - »
function rendreEtat() {
  let h = '';
  let ol = false, ul = false;
  for (const l of etat) {
    const num = l.match(/^d+. (.+)$/);
    const puce = l.match(/^s+- (.+)$/);
    if (puce) { if (!ul) { h += '<ul>'; ul = true; } h += `<li>${enLigne(puce[1])}</li>`; continue; }
    if (ul) { h += '</ul>'; ul = false; }
    if (num) { if (ol) h += '</li>'; else { h += '<ol>'; ol = true; } h += `<li>${enLigne(num[1])}`; continue; }
    if (ol) { h += '</li></ol>'; ol = false; }
    h += `<p>${enLigne(l)}</p>`;
  }
  if (ul) h += '</ul>';
  if (ol) h += '</li></ol>';
  return h;
}

let n = 0;
const html = sections.map((s) => {
  const faits = s.items.filter((i) => i.fait).length;
  return `
  <section class="etape" id="etape-${s.num}" aria-labelledby="titre-${s.num}">
    <header class="etape-tete">
      <span class="num" aria-hidden="true">${s.num}</span>
      <div class="etape-titres">
        <h2 id="titre-${s.num}">${echapper(s.titre)}</h2>
        <p class="etape-meta">${s.roles.map((r) => `<span class="role ${ROLES[r][0]}">${ROLES[r][1]}</span>`).join('')}<span class="compte" data-section="${s.num}">${faits} / ${s.items.length}</span></p>
      </div>
    </header>
    ${s.notes.map((t) => `<p class="note">${enLigne(t)}</p>`).join('\n    ')}
    <ul class="liste">
      ${s.items.map((i) => {
        n++;
        return `<li><label for="c${n}"><input type="checkbox" id="c${n}" data-section="${s.num}" data-defaut="${i.fait ? 1 : 0}"${i.fait ? ' checked' : ''}><span class="case" aria-hidden="true"></span><span class="texte">${enLigne(i.texte)}</span></label></li>`;
      }).join('\n      ')}
    </ul>
  </section>`;
}).join('\n');

const total = n;
const page = `<title>Mise en ligne · La Graverie Cyclos</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap">
<style>
  /* Carnet de route : colonne de lecture unique, étapes numérotées (l'ordre compte), couleurs du club */
  :root {
    --fond: #faf8f6; --surface: #ffffff; --texte: #2a2522; --doux: #6b625b; --trait: #e7e1dc;
    --rouge: #b5121b; --rouge-doux: #fbeceb; --jaune: #f2c200; --jaune-doux: #fdf6d8;
    --vert: #3f7a35; --vert-doux: #e9f2e6; --bleu: #2d5d8a; --bleu-doux: #e7eff7;
    --titre: 'Barlow Condensed', 'Arial Narrow', 'Roboto Condensed', sans-serif;
    --corps: 'Source Sans 3', 'Segoe UI', system-ui, -apple-system, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --fond: #171413; --surface: #211d1b; --texte: #efe9e4; --doux: #a89e96; --trait: #39322e;
    --rouge: #f0656b; --rouge-doux: #3a1d1e; --jaune: #f2c94c; --jaune-doux: #352d14;
    --vert: #8cc47f; --vert-doux: #1f2d1c; --bleu: #8db7e0; --bleu-doux: #1a2633; color-scheme: dark;
  } }
  :root[data-theme="dark"] {
    --fond: #171413; --surface: #211d1b; --texte: #efe9e4; --doux: #a89e96; --trait: #39322e;
    --rouge: #f0656b; --rouge-doux: #3a1d1e; --jaune: #f2c94c; --jaune-doux: #352d14;
    --vert: #8cc47f; --vert-doux: #1f2d1c; --bleu: #8db7e0; --bleu-doux: #1a2633; color-scheme: dark;
  }
  body { background: var(--fond); color: var(--texte); font: 17px/1.55 var(--corps); }
  .page { max-width: 760px; margin: 0 auto; padding-block: 40px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 28px; }
  h1, h2 { font-family: var(--titre); text-wrap: balance; line-height: 1.05; margin: 0; }
  h1 { font-size: clamp(2.2rem, 7vw, 3.2rem); font-weight: 700; letter-spacing: .005em; }
  .surtitre { font: 700 .8rem/1 var(--corps); text-transform: uppercase; letter-spacing: .12em; color: var(--rouge); margin: 0 0 10px; }
  .chapo { display: grid; gap: 12px; }
  .chapo p { margin: 0; max-width: 62ch; }
  .chapo .devise { font-style: italic; color: var(--doux); }
  a { color: var(--rouge); text-underline-offset: 2px; }
  a:focus-visible, input:focus-visible + .case { outline: 2px solid var(--rouge); outline-offset: 2px; }
  code { font: .88em ui-monospace, 'Cascadia Mono', Consolas, monospace; background: var(--jaune-doux); padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere; }

  .bilan { display: grid; gap: 10px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--trait); border-radius: 14px; }
  .bilan-ligne { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 16px; }
  .bilan strong { font: 700 1.6rem/1 var(--titre); font-variant-numeric: tabular-nums; }
  .jauge { height: 8px; border-radius: 99px; background: var(--trait); overflow: hidden; }
  .jauge span { display: block; height: 100%; width: 0; background: var(--vert); border-radius: inherit; transition: width .3s ease; }
  .legende { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: .92rem; color: var(--doux); }
  .bilan .aide { margin: 0; font-size: .9rem; color: var(--doux); }

  .role { display: inline-block; font: 700 .72rem/1 var(--corps); text-transform: uppercase; letter-spacing: .07em; padding: 4px 7px 3px; border-radius: 5px; white-space: nowrap; vertical-align: 1px; }
  .role.bureau { background: var(--jaune-doux); color: var(--texte); box-shadow: inset 0 0 0 1px var(--jaune); }
  .role.redac { background: var(--bleu-doux); color: var(--bleu); }
  .role.tech { background: var(--rouge-doux); color: var(--rouge); }

  .sommaire { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0; list-style: none; }
  .sommaire a { display: inline-flex; gap: 6px; align-items: baseline; text-decoration: none; color: var(--texte); font-size: .9rem; padding: 5px 10px; border: 1px solid var(--trait); border-radius: 99px; background: var(--surface); }
  .sommaire a b { font-family: var(--titre); color: var(--rouge); }
  .sommaire a:hover { border-color: var(--rouge); }

  .etape { display: grid; gap: 10px; padding-top: 22px; border-top: 2px solid var(--trait); }
  .etape-tete { display: flex; gap: 14px; align-items: flex-start; }
  .num { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: var(--rouge); color: #fff; font: 700 1.4rem/1 var(--titre); }
  .etape.terminee .num { background: var(--vert); }
  .etape-titres { min-width: 0; display: grid; gap: 6px; }
  h2 { font-size: 1.75rem; font-weight: 700; }
  .etape-meta { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .compte { font-size: .85rem; color: var(--doux); font-variant-numeric: tabular-nums; margin-left: 4px; }
  .note { margin: 0; color: var(--doux); font-size: .95rem; max-width: 64ch; }

  .liste { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 2px; }
  .liste label { display: grid; grid-template-columns: 22px 1fr; gap: 12px; align-items: start; padding: 9px 10px; margin: 0 -10px; border-radius: 8px; cursor: pointer; }
  .liste label:hover { background: var(--surface); }
  .liste input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .case { width: 20px; height: 20px; margin-top: 3px; border: 2px solid var(--doux); border-radius: 5px; display: grid; place-items: center; background: var(--surface); }
  .case::after { content: ''; width: 10px; height: 6px; border: solid #fff; border-width: 0 0 2.5px 2.5px; transform: rotate(-45deg) translate(1px, -1px); opacity: 0; }
  .liste input:checked + .case { background: var(--vert); border-color: var(--vert); }
  .liste input:checked + .case::after { opacity: 1; }
  .texte { min-width: 0; overflow-wrap: anywhere; }
  .liste input:checked ~ .texte { color: var(--doux); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--doux) 55%, transparent); }

  .etat { display: grid; gap: 10px; padding: 18px 20px; background: var(--surface); border: 2px solid var(--jaune); border-radius: 14px; }
  .etat h2 { font-size: 1.6rem; }
  .etat p { margin: 0; }
  .etat ol { margin: 0; padding-left: 1.3em; display: grid; gap: 8px; }
  .etat ul { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 4px; font-size: .95rem; }
  .fin { padding: 18px 20px; background: var(--jaune-doux); border-radius: 14px; margin: 0; font-size: .95rem; }
  .bouton { font: 600 .9rem var(--corps); color: var(--doux); background: none; border: 1px solid var(--trait); border-radius: 99px; padding: 6px 12px; cursor: pointer; justify-self: start; }
  .bouton:hover { color: var(--rouge); border-color: var(--rouge); }
  @media (prefers-reduced-motion: reduce) { .jauge span { transition: none; } }
  @media (max-width: 480px) { body { font-size: 16px; } h2 { font-size: 1.5rem; } .num { width: 38px; height: 38px; font-size: 1.2rem; } }
</style>

<main class="page">
  <header class="chapo">
    <p class="surtitre">La Graverie Cyclos · site du club</p>
    <h1>Avant la mise en ligne officielle</h1>
    <p class="devise">« Si tu t’arrêtes de pédaler, tu tombes ! »</p>
    ${intro.map((t) => `<p>${enLigne(t)}</p>`).join('\n    ')}
  </header>

  <div class="bilan" role="status" aria-live="polite">
    <div class="bilan-ligne">
      <span><strong id="faits">0</strong> sur <span id="total">${total}</span> tâches faites</span>
      <span class="legende"><span class="role bureau">Bureau</span><span class="role redac">Rédacteur</span><span class="role tech">Technique</span></span>
    </div>
    <div class="jauge" aria-hidden="true"><span id="jauge"></span></div>
    <p class="aide">Les cases cochées en arrivant sont celles déjà faites. Vous pouvez en cocher d'autres pour suivre votre lecture : c'est mémorisé sur cet appareil uniquement.</p>
  </div>

  ${etat.length ? `<section class="etat" aria-labelledby="titre-etat"><h2 id="titre-etat">${echapper(etatTitre)}</h2>${rendreEtat()}</section>` : ''}

  <nav aria-label="Étapes">
    <ul class="sommaire">
      ${sections.map((s) => `<li><a href="#etape-${s.num}"><b>${s.num}</b>${echapper(s.titre)}</a></li>`).join('\n      ')}
    </ul>
  </nav>
${html}

  <p class="fin">${enLigne(fin)}</p>
  <button type="button" class="bouton" id="reinitialiser">Revenir aux cases d'origine</button>
</main>

<script>
  (() => {
    const CLE = 'mise-en-ligne-graverie';
    const cases = [...document.querySelectorAll('.liste input')];
    let memo = {};
    try { memo = JSON.parse(localStorage.getItem(CLE) || '{}'); } catch {}
    for (const c of cases) if (c.id in memo) c.checked = memo[c.id];

    function bilan() {
      const faits = cases.filter((c) => c.checked).length;
      document.getElementById('faits').textContent = faits;
      document.getElementById('jauge').style.width = (100 * faits / cases.length) + '%';
      for (const s of document.querySelectorAll('.etape')) {
        const siennes = [...s.querySelectorAll('.liste input')];
        const ok = siennes.filter((c) => c.checked).length;
        s.querySelector('.compte').textContent = ok + ' / ' + siennes.length;
        s.classList.toggle('terminee', ok === siennes.length);
      }
    }
    for (const c of cases) c.addEventListener('change', () => {
      memo[c.id] = c.checked;
      try { localStorage.setItem(CLE, JSON.stringify(memo)); } catch {}
      bilan();
    });
    document.getElementById('reinitialiser').addEventListener('click', () => {
      memo = {};
      try { localStorage.removeItem(CLE); } catch {}
      for (const c of cases) c.checked = c.dataset.defaut === '1';
      bilan();
    });
    bilan();
  })();
</script>
`;
writeFileSync(cible, page);
console.log(sections.length, 'étapes,', total, 'tâches');
