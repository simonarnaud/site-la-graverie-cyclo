// Génère les QR codes du site dans docs/qrcode/ (affiches, flyers, documents d'adhésion).
// L'adresse est lue dans astro.config.mjs : après le passage au domaine du club,
// relancez simplement « npm run qrcode » et remplacez les fichiers imprimés.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';
import sharp from 'sharp';
import config from '../astro.config.mjs';

const ROUGE = '#b5121b'; // rouge foncé du site : assez contrasté pour tous les lecteurs
const DOSSIER = 'docs/qrcode';
const url = new URL((config.base ?? '/').replace(/\/?$/, '/'), config.site).href;
const club = JSON.parse(readFileSync('src/data/club.json', 'utf-8'));

mkdirSync(DOSSIER, { recursive: true });

// Correction d'erreur maximale (H) : le code reste lisible malgré le logo au centre
const svgBrut = await QRCode.toString(url, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  color: { dark: ROUGE, light: '#ffffff' },
});
const taille = Number(svgBrut.match(/viewBox="0 0 (\d+) \d+"/)[1]);

// Logo dans une pastille blanche, environ 22 % de la largeur du code
const logo = await sharp('src/assets/logo.png').resize(256, 256).png().toBuffer();
const diametre = taille * 0.22;
const centre = taille / 2;
const pastille = `
  <circle cx="${centre}" cy="${centre}" r="${diametre / 2 + taille * 0.012}" fill="#ffffff"/>
  <image x="${centre - diametre / 2}" y="${centre - diametre / 2}" width="${diametre}" height="${diametre}"
         href="data:image/png;base64,${logo.toString('base64')}"/>`;
const svgLogo = svgBrut.replace('</svg>', `${pastille}</svg>`);

writeFileSync(`${DOSSIER}/qrcode.svg`, svgLogo);
await sharp(Buffer.from(svgLogo)).resize(1200, 1200).png().toFile(`${DOSSIER}/qrcode.png`);

// Version avec légende, prête à coller sur une affiche
const legende = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500">
  <rect width="1200" height="1500" fill="#ffffff"/>
  <rect width="1200" height="14" fill="#e30613"/>
  <image x="100" y="90" width="1000" height="1000" href="data:image/png;base64,${(await sharp(Buffer.from(svgLogo)).resize(1000, 1000).png().toBuffer()).toString('base64')}"/>
  <text x="600" y="1215" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="800" fill="#2a2522">${club.nom}</text>
  <rect x="560" y="1245" width="80" height="8" rx="4" fill="#f2c200"/>
  <text x="600" y="1330" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#6b625b">Calendrier, parcours et actualités du club</text>
  <text x="600" y="1405" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#6b625b">${url.replace(/^https:\/\//, '')}</text>
</svg>`;
await sharp(Buffer.from(legende)).png().toFile(`${DOSSIER}/qrcode-affiche.png`);

console.log(`QR codes générés dans ${DOSSIER}/ pour ${url}`);
