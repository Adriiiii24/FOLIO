// Genera tickets SINTÉTICOS (comercios ficticios) como PNG, con su verdad de referencia en JSON.
// Uso, desde la raíz: npx -y -p playwright@1 node evals/scripts/make-tickets.mjs (Playwright no es dependencia
// del proyecto: solo hace falta para regenerar las imágenes).
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../fixtures/tickets/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const eur = (n) => n.toFixed(2).replace('.', ',');

const tickets = [
  {
    id: 'super-mixto',
    merchant: 'SUPERMERCADOS LA ESQUINA S.L.',
    taxId: 'B12345678',
    address: 'C/ Mayor 14, 28013 Madrid',
    date: '26/09/2026',
    time: '19:42',
    pay: 'TARJETA',
    category: 'groceries',
    payment: 'card',
    lines: [
      ['LECHE ENTERA 1L', 2, 0.99],
      ['PAN DE PUEBLO', 1, 1.35],
      ['TOMATE RAMA KG', 1, 2.48],
      ['ACEITE OLIVA 1L', 1, 8.95],
      ['DETERGENTE 2L', 1, 4.75],
    ],
    vat: { 4: ['LECHE ENTERA 1L', 'PAN DE PUEBLO', 'TOMATE RAMA KG'], 10: ['ACEITE OLIVA 1L'], 21: ['DETERGENTE 2L'] },
  },
  {
    id: 'restaurante',
    merchant: 'TABERNA EL PATIO',
    taxId: 'B87654321',
    address: 'Plaza Nueva 3, 41001 Sevilla',
    date: '27/09/2026',
    time: '14:18',
    pay: 'EFECTIVO',
    category: 'restaurants',
    payment: 'cash',
    lines: [
      ['MENU DEL DIA', 2, 13.5],
      ['CAFE SOLO', 2, 1.4],
      ['AGUA 50CL', 1, 1.8],
    ],
    vat: { 10: ['MENU DEL DIA', 'CAFE SOLO', 'AGUA 50CL'] },
  },
  {
    id: 'gasolinera',
    merchant: 'ESTACION DE SERVICIO RUTA 5',
    taxId: 'A11223344',
    address: 'Autovía A-5 km 22, Móstoles',
    date: '25/09/2026',
    time: '08:05',
    pay: 'TARJETA',
    category: 'transport',
    payment: 'card',
    lines: [['GASOLINA 95 32,15 L', 1, 52.4]],
    vat: { 21: ['GASOLINA 95 32,15 L'] },
  },
];

function render(t) {
  const lineTotal = (l) => Math.round(l[1] * l[2] * 100) / 100;
  const total = Math.round(t.lines.reduce((s, l) => s + lineTotal(l), 0) * 100) / 100;
  const vat = Object.entries(t.vat).map(([rate, names]) => {
    const gross = names.reduce((s, n) => s + lineTotal(t.lines.find((l) => l[0] === n)), 0);
    const base = Math.round((gross / (1 + rate / 100)) * 100) / 100;
    return { ratePct: Number(rate), base, amount: Math.round((gross - base) * 100) / 100 };
  });
  const rows = t.lines
    .map(
      (l) =>
        `<tr><td>${l[1]}</td><td>${l[0]}</td><td class=r>${eur(l[2])}</td><td class=r>${eur(lineTotal(l))}</td></tr>`,
    )
    .join('');
  const vatRows = vat
    .map((v) => `<tr><td>${v.ratePct}%</td><td class=r>${eur(v.base)}</td><td class=r>${eur(v.amount)}</td></tr>`)
    .join('');
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;background:#e8e4dc;display:flex;justify-content:center;padding:24px}
    .t{width:320px;background:#fffdf8;padding:18px 16px;font:13px/1.35 'Courier New',monospace;color:#222;box-shadow:0 2px 6px #0003;transform:rotate(-1.2deg)}
    h1{font-size:15px;text-align:center;margin:0 0 4px} p{margin:0;text-align:center} table{width:100%;border-collapse:collapse;margin:8px 0}
    td{padding:1px 0}.r{text-align:right}.tot{font-size:17px;font-weight:bold;border-top:1px dashed #333;border-bottom:1px dashed #333;padding:6px 0;display:flex;justify-content:space-between}
    hr{border:0;border-top:1px dashed #333}</style>
    <div class=t><h1>${t.merchant}</h1><p>CIF ${t.taxId}</p><p>${t.address}</p><hr>
    <p>FACTURA SIMPLIFICADA</p><p>${t.date} ${t.time}</p><hr>
    <table>${rows}</table><div class=tot><span>TOTAL EUR</span><span>${eur(total)}</span></div>
    <table><tr><td>IVA</td><td class=r>BASE</td><td class=r>CUOTA</td></tr>${vatRows}</table>
    <p>PAGO: ${t.pay}</p><hr><p>GRACIAS POR SU VISITA</p></div>`;
  const [d, m, y] = t.date.split('/');
  const truth = {
    merchant: t.merchant,
    merchantTaxId: t.taxId,
    issuedAt: `${y}-${m}-${d}T${t.time}`,
    currency: 'EUR',
    total,
    category: t.category,
    paymentMethod: t.payment,
    vat,
  };
  return { html, truth };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 700 }, deviceScaleFactor: 2 });
for (const t of tickets) {
  const { html, truth } = render(t);
  await page.setContent(html);
  await page.locator('.t').screenshot({ path: `${OUT}/${t.id}.png` });
  writeFileSync(`${OUT}/${t.id}.json`, JSON.stringify(truth, null, 2) + '\n');
  console.log(t.id, truth.total, JSON.stringify(truth.vat));
}
await browser.close();
