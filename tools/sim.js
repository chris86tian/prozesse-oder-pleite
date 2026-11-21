// Balancing-Simulation: node tools/sim.js [runs] [skill 0..1]
require('../game/data.js');
require('../game/learn.js');
require('../game/engine.js');
const D = globalThis.PPDATA, E = globalThis.PPENGINE;
const RUNS = +process.argv[2] || 400;
const SKILL = process.argv[3] !== undefined ? +process.argv[3] : 0.6;

function quality(s) {
    const r = E.rand(s);
    if (r < SKILL * 0.75) return 'strong';
    if (r < SKILL * 0.75 + 0.3) return 'okay';
    return 'weak';
}
function hits(s) {
    return [0, 1, 2].map(() => { const r = E.rand(s); return r < SKILL * 0.6 ? 'green' : r < SKILL * 0.6 + 0.3 ? 'yellow' : 'miss'; });
}

function play(caseId, seed) {
    const s = E.newGame(caseId, seed);
    const c = D.cases[caseId];
    for (;;) {
        // Aktionen
        let guard = 0;
        while (s.actionsLeft > 0 && guard++ < 10) {
            const f = E.forecast(s);
            const cap = E.cap(s);
            const free = cap - s.customers.length;
            if (s.energy < 25) { E.spendAction(s, 'rest'); E.rest(s); continue; }
            if (s.chaos > 65 && E.canAct(s, 'care').ok) { E.spendAction(s, 'care'); E.care(s); continue; }
            // Prozess, wenn genug Geld da ist
            const buffer = Math.max(E.mo(s, 6000), -f.cashDelta * 2 + E.mo(s, 3000));
            const order = ['delivery', 'crm', 'books', 'handbook', 'qa', 'auto', 'marketing', 'deputy'];
            const p = order.find(id => E.procState(s, id).state === 'open' && s.cash - E.procCost(s, id) > buffer);
            if (p && s.month <= 10 && (free <= 1 || s.leads.length >= 2)) { E.spendAction(s, 'proc'); E.buildProc(s, p); continue; }
            // Einstellen, wenn Kapazität knapp
            if (free <= 0 && s.cash > buffer + E.mo(s, 3000) && E.canAct(s, 'hire').ok && s.month <= 10) {
                const role = s.leads.length >= 3 || E.count(s, 'delivery') <= E.count(s, 'sales') ? 'delivery' : 'sales';
                E.spendAction(s, 'hire'); E.hire(s, role); continue;
            }
            // Verkaufen
            const good = s.leads.filter(l => !(l.hints.some(h => h.t === 'red') && E.rand(s) < SKILL));
            if (good.length && free > 0 && E.canAct(s, 'sell').ok) {
                E.spendAction(s, 'sell');
                for (let i = 0; i < c.salesCloses; i++) {
                    const pool = s.leads.filter(l => !(l.hints.some(h => h.t === 'red') && E.rand(s) < SKILL));
                    if (!pool.length) break;
                    E.closeDeal(s, pool[0].id, quality(s));
                }
                continue;
            }
            if (E.canAct(s, 'acq').ok) { E.spendAction(s, 'acq'); E.acquire(s, hits(s)); continue; }
            E.spendAction(s, 'rest'); E.rest(s);
        }
        // Kredit, falls nötig
        while (E.forecast(s).cashAfter < 0 && E.takeLoan(s)) {}
        // Ereignis oder Boss
        const b = E.boss(s);
        if (b) E.resolveBoss(s, b, [quality(s), quality(s), quality(s)]);
        else {
            const inst = E.pickEvent(s);
            let idx = inst.def.choices.findIndex(ch => ch.req && E.has(s, ch.req));
            if (idx < 0) idx = Math.floor(E.rand(s) * inst.def.choices.filter(ch => !ch.req).length);
            E.resolveChoice(s, inst, idx);
        }
        E.endMonth(s);
        if (s.over) return { s, over: s.over, month: s.month };
        if (s.month >= E.MONTHS) return { s, over: null, month: s.month };
        E.startMonth(s);
    }
}

for (const id of D.caseOrder) {
    const vals = [], overs = {}; let custs = 0, procs = 0, staff = 0, stars = [0, 0, 0, 0];
    for (let i = 0; i < RUNS; i++) {
        const r = play(id, 1000 + i * 7919);
        if (r.over) { overs[r.over] = (overs[r.over] || 0) + 1; stars[0]++; continue; }
        const v = E.valuation(r.s);
        vals.push(v.total); custs += r.s.customers.length; procs += E.procCount(r.s); staff += r.s.staff.length; stars[v.stars]++;
    }
    vals.sort((a, b) => a - b);
    const q = p => vals.length ? vals[Math.floor(p * (vals.length - 1))] : 0;
    console.log(`${id.padEnd(10)} pleite/chaos: ${JSON.stringify(overs)}  Wert p10 ${q(0.1)} p50 ${q(0.5)} p90 ${q(0.9)}  Ø Kunden ${(custs / vals.length).toFixed(1)} Prozesse ${(procs / vals.length).toFixed(1)} Team ${(staff / vals.length).toFixed(1)}  Sterne 0-3: ${stars.join('/')}`);
}
