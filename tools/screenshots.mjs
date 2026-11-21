// Nimmt die README-Screenshots mit Chrome headless auf (1280 × 720).
// Aufruf: node tools/screenshots.mjs   → docs/screenshots/*.png
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screenshots');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HTTP_PORT = 8799, CDP_PORT = 9333;
const sleep = ms => new Promise(r => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const server = spawn('python3', ['-m', 'http.server', String(HTTP_PORT), '--directory', join(ROOT, 'game')], { stdio: 'ignore' });
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`, '--window-size=1280,720', '--hide-scrollbars',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio', '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pp-shots-'))}`], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
function cdp(method, params = {}) {
    return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
}
async function run(js, wait = 900) {
    const r = await cdp('Runtime.evaluate', { expression: `(async () => { ${js} })()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    await sleep(wait);
}
async function shot(name) {
    const r = await cdp('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
    console.log('✓', name);
}

try {
    let target;
    for (let i = 0; i < 40 && !target; i++) {
        try { target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(250); }
    }
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id).res(m.result || {}); pending.delete(m.id); } });
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/` });
    await sleep(3500);

    await run(`localStorage.clear();`, 200);
    await shot('01-titel');
    await run(`PPDEBUG.H.newgame();`); await shot('02-branchen');

    // Duell mit gewachsenen Firmen aufbauen
    await run(`
        const E = PPENGINE, P = PPDEBUG;
        P.H.newgame2(); P.H.pickcase('reselling'); P.H.pickcase('agentur'); P.H.startDuel();
        const M = P.match(), a = M.players[0].S, b = M.players[1].S;
        ['delivery','crm','books','handbook','qa'].forEach(x => E.buildProc(a, x)); for (let i = 0; i < 9; i++) E.signCustomer(a, E.makeLead(a), 1); E.hire(a,'delivery'); E.hire(a,'sales'); a.cash = 4200;
        ['delivery','crm','books','auto','qa','handbook','marketing'].forEach(x => E.buildProc(b, x)); for (let i = 0; i < 12; i++) E.signCustomer(b, E.makeLead(b), 1); E.hire(b,'delivery'); E.hire(b,'sales'); E.hire(b,'assist'); b.cash = 86000;
        a.month = 6; b.month = 6; [a, b].forEach(s => { s.skills.skalierung = 2; s.skillQueue = []; });
        P.handover();`, 2600);
    await shot('03-duell-wechsel');
    await run(`PPDEBUG.H.hub();`, 2600); await shot('04-uebersicht-3d');
    await run(`const S = PPDEBUG.state(); if (!S.leads.length) PPENGINE.addLeads(S, 3); S.actionsLeft = 3; PPDEBUG.H.leads();`); await shot('05-interessenten');
    await run(`const S = PPDEBUG.state(); PPDEBUG.H.call(S.leads[0].id);`, 1200); await shot('06-verkaufsgespraech');
    await run(`PPDEBUG.H.answer(0);`, 300); await run(`PPDEBUG.H.answer(1);`, 1500); await shot('07-gespraech-auswertung');
    await run(`const S = PPDEBUG.state(); PPDATA.skills.forEach((k, i) => { if (i < 10) S.skills[k.id] = i % 3 ? 1 : 2; }); S.skillQueue = []; PPDEBUG.H.skills();`); await shot('08-business-skills');
    await run(`const S = PPDEBUG.state(); S.usedEvents = PPDATA.events.filter(e => e.id !== 'duell_preis').map(e => e.id); PPDEBUG.event();`); await shot('09-duell-ereignis');
    await run(`const M = PPDEBUG.match(); M.players.forEach(p => p.S.month = 12); PPDEBUG.H.duelFinal();`, 2800); await shot('10-duell-sieger');
    await run(`PPDEBUG.H.title(); PPDEBUG.H.info();`); await shot('11-handy-qr-code');
} finally {
    try { ws && ws.close(); } catch { }
    chrome.kill(); server.kill();
}
