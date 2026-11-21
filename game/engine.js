/* Prozesse oder Pleite – Spiellogik ohne DOM (auch in Node lauffähig) */
(function (G) {
    'use strict';
    var D = G.PPDATA;
    var E = {};

    E.MONTHS = 12;
    E.BASE_ACTIONS = 3;
    E.LOAN_STEP = 10000;
    E.LOAN_MAX = 30000;
    E.LOAN_RATE = 0.02;
    E.MAX_LEADS = 5;

    E.COST = { acq: 15, sell: 15, proc: 20, hire: 10, care: 10, rest: 0 };

    /* ---------- Zufall (reproduzierbar, im Spielstand gespeichert) ---------- */
    E.rand = function (s) {
        var t = (s.rng += 0x6D2B79F5) | 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    E.pick = function (s, arr) { return arr[Math.floor(E.rand(s) * arr.length)]; };
    E.shuffle = function (s, arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(E.rand(s) * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    };
    function r100(x) { return Math.round(x / 100) * 100; }

    /* ---------- Geldbeträge je Branche (Second-Hand-Shop: Taschengeld-Niveau) ---------- */
    E.ms = function (s) { return E.caseOf(s).moneyScale || 1; };
    E.mo = function (s, v) { var m = E.ms(s); return m === 1 ? v : Math.round(v * m / 10) * 10; };
    E.rnd = function (s, v) { return E.caseOf(s).mrr < 1000 ? Math.round(v / 10) * 10 : r100(v); };
    E.procCost = function (s, id) { return E.mo(s, D.procs[id].cost); };
    E.procUpkeep = function (s, id) { return E.mo(s, D.procs[id].upkeep); };
    E.hireFee = function (s) { return E.mo(s, D.hireFee); };
    E.salaryOf = function (s, role) { return E.rnd(s, D.roles[role].salary * E.caseOf(s).salaryMult * E.ms(s)); };
    E.loanStep = function (s) { return E.mo(s, E.LOAN_STEP); };
    E.loanMax = function (s) { return E.mo(s, E.LOAN_MAX); };
    function fmtEur(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    /* „2.000 €“ in Texten an die Branche anpassen */
    E.moneyText = function (s, text) {
        if (!s || E.ms(s) === 1) return text;
        return text.replace(/(\d{1,3}(?:\.\d{3})+|\d+) €/g, function (m, num) {
            return fmtEur(E.mo(s, parseInt(num.replace(/\./g, ''), 10))) + ' €';
        });
    };

    /* ---------- Business-Skills ---------- */
    E.learn = function (s, id) {
        if (!s.skills) s.skills = {};
        if (!s.skillQueue) s.skillQueue = [];
        if (s.skills[id]) return false;
        s.skills[id] = 1;
        s.skillQueue.push(id);
        return true;
    };
    E.skillCount = function (s) {
        var k = s.skills || {}, n = 0, m = 0;
        Object.keys(k).forEach(function (id) { n++; if (k[id] >= 2) m++; });
        return { learned: n, mastered: m, total: D.skills ? D.skills.length : 0 };
    };

    /* ---------- Fragen fürs Verkaufsgespräch (nicht zu oft dieselbe) ---------- */
    function pickFresh(s, list, key) {
        if (!s.usedQ) s.usedQ = {};
        var used = s.usedQ[key] || [];
        var pool = [];
        list.forEach(function (q, i) {
            if (q.cases && q.cases.indexOf(s.caseId) < 0) return;
            if (used.indexOf(i) >= 0) return;
            pool.push(i);
            if (q.cases) { pool.push(i); pool.push(i); }
        });
        if (!pool.length) { s.usedQ[key] = []; return pickFresh(s, list, key); }
        var idx = E.pick(s, pool);
        used.push(idx); s.usedQ[key] = used;
        return list[idx];
    }
    E.pickNeed = function (s) { return pickFresh(s, D.needs, 'n'); };
    E.pickObjection = function (s) { return pickFresh(s, D.objections, 'o'); };

    /* ---------- Faire Duell-Punkte: Firmenwert im Verhältnis zur Branche (100 = 2 Sterne) ---------- */
    E.score = function (s) {
        if (s.over) return 0;
        return Math.max(0, Math.round(E.valuation(s).total / E.caseOf(s).stars[1] * 100));
    };
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    E.caseOf = function (s) { return D.cases[s.caseId]; };

    /* ---------- Neues Spiel ---------- */
    E.newGame = function (caseId, seed) {
        var c = D.cases[caseId];
        var s = {
            v: 1, caseId: caseId, rng: (seed >>> 0) || 1, nextId: 1,
            month: 1, actionsLeft: E.BASE_ACTIONS,
            cash: c.startCash, energy: 100, chaos: 10, rep: 50,
            leads: [], customers: [], staff: [], procs: {},
            fixExtra: 0, loan: 0, cared: false, monthRev: 0, monthSetup: 0,
            history: [], bosses: {}, signedTotal: 0, lostTotal: 0,
            phase: 'hub', over: null, usedEvents: [], skills: {}, skillQueue: [], usedQ: {}
        };
        // Zwei Interessenten zum Start
        E.addLeads(s, 2);
        return s;
    };

    /* ---------- Kennzahlen ---------- */
    E.count = function (s, role) { return s.staff.filter(function (m) { return m.role === role; }).length; };
    E.procCount = function (s) { return Object.keys(s.procs).length; };
    E.has = function (s, p) { return !!s.procs[p]; };

    E.procCap = function (s, id) {
        var c = E.caseOf(s);
        if (id === 'delivery') return Math.max(1, Math.round(c.cap * 0.5));
        if (id === 'auto') return Math.max(2, Math.round(c.cap * 0.6));
        return 0;
    };
    E.cap = function (s) {
        var c = E.caseOf(s);
        var per = c.staffCap + (E.has(s, 'handbook') ? 1 : 0);
        var cap = c.cap + E.count(s, 'delivery') * per;
        if (E.has(s, 'delivery')) cap += E.procCap(s, 'delivery');
        if (E.has(s, 'auto')) cap += E.procCap(s, 'auto');
        return cap;
    };
    E.mrr = function (s) { return s.customers.reduce(function (a, k) { return a + k.price; }, 0); };
    E.salaries = function (s) { return s.staff.reduce(function (a, m) { return a + m.salary; }, 0); };
    E.upkeep = function (s) { return Object.keys(s.procs).reduce(function (a, p) { return a + E.procUpkeep(s, p); }, 0); };
    E.taxRate = function (s) { return E.has(s, 'books') ? 0.22 : 0.30; };
    E.maxActions = function (s) { return E.BASE_ACTIONS + (E.has(s, 'deputy') ? 1 : 0); };
    E.energyCost = function (s, kind) {
        var c = E.COST[kind] || 0;
        if (c > 0 && E.has(s, 'auto')) c -= 5;
        return c;
    };

    /* Prognose für den Monatsabschluss (mit heutigem Kundenstand) */
    E.forecast = function (s) {
        var c = E.caseOf(s);
        var rec = E.mrr(s);
        var rev = rec + s.monthSetup;
        var variable = Math.round(rev * c.varPct);
        var fixed = c.fix + s.fixExtra;
        var upkeep = E.upkeep(s);
        var salaries = E.salaries(s);
        var interest = Math.round(s.loan * E.LOAN_RATE);
        var profit = rev - variable - fixed - upkeep - salaries - interest;
        var tax = profit > 0 ? Math.round(profit * E.taxRate(s)) : 0;
        var cashDelta = rec - variable - fixed - upkeep - salaries - interest - tax; // Setup ist schon auf dem Konto
        // Laufender Gewinn ohne Einmal-Effekte (für die Firmenbewertung)
        var runVar = Math.round(rec * c.varPct);
        var runProfit = rec - runVar - fixed - upkeep - salaries - interest;
        var runNet = runProfit > 0 ? Math.round(runProfit * (1 - E.taxRate(s))) : runProfit;
        return {
            rec: rec, setup: s.monthSetup, rev: rev, variable: variable, fixed: fixed, upkeep: upkeep,
            salaries: salaries, interest: interest, profit: profit, tax: tax, cashDelta: cashDelta,
            cashAfter: s.cash + cashDelta, runNet: runNet
        };
    };

    /* ---------- Aktionen ---------- */
    E.canAct = function (s, kind) {
        if (s.actionsLeft <= 0) return { ok: false, why: 'Keine Aktionen mehr in diesem Monat.' };
        var cost = E.energyCost(s, kind);
        if (cost > s.energy) return { ok: false, why: 'Zu wenig Energie. Gönn dir eine Pause.' };
        if (kind === 'sell' && s.leads.length === 0) return { ok: false, why: 'Keine Interessenten. Erst Akquise machen.' };
        if (kind === 'hire' && s.staff.length >= D.maxStaff) return { ok: false, why: 'Das Büro ist voll.' };
        return { ok: true };
    };
    E.spendAction = function (s, kind) {
        s.actionsLeft -= 1;
        s.energy = clamp(s.energy - E.energyCost(s, kind), 0, 100);
    };

    /* Interessenten */
    E.makeLead = function (s) {
        var c = E.caseOf(s);
        var toxicP = s.rep >= 70 ? 0.2 : (s.rep < 30 ? 0.4 : 0.3);
        var toxic = E.rand(s) < toxicP;
        var tr = E.rand(s);
        var tier = toxic ? (tr < 0.5 ? 'L' : tr < 0.8 ? 'M' : 'S') : (tr < 0.25 ? 'L' : tr < 0.7 ? 'M' : 'S');
        var hints;
        if (toxic) {
            hints = [{ t: 'red', x: E.pick(s, D.hints.red) }, E.rand(s) < 0.5 ? { t: 'green', x: E.pick(s, D.hints.green) } : { t: 'neutral', x: E.pick(s, D.hints.neutral) }];
            if (E.has(s, 'crm')) hints.push({ t: 'red', x: E.pick(s, D.hints.red) });
        } else {
            hints = E.rand(s) < 0.6 ? [{ t: 'green', x: E.pick(s, D.hints.green) }, { t: 'neutral', x: E.pick(s, D.hints.neutral) }]
                : [{ t: 'neutral', x: E.pick(s, D.hints.neutral) }, { t: 'green', x: E.pick(s, D.hints.green) }];
            if (E.has(s, 'crm')) hints.push({ t: 'green', x: E.pick(s, D.hints.green) });
        }
        // doppelte Texte vermeiden
        var seen = {};
        hints = hints.filter(function (h) { if (seen[h.x]) return false; seen[h.x] = 1; return true; });
        hints = E.shuffle(s, hints);
        var mult = D.tiers[tier].mult;
        return {
            id: s.nextId++, name: E.freshName(s), want: E.pick(s, c.wants), tier: tier, toxic: toxic,
            hints: hints, age: 0, face: Math.floor(E.rand(s) * 1e9),
            price: E.rnd(s, c.mrr * mult), setup: E.rnd(s, c.setup * mult)
        };
    };
    /* Firmenname, der gerade weder Interessent noch Kunde ist */
    E.freshName = function (s) {
        var used = {};
        s.leads.forEach(function (l) { used[l.name] = 1; });
        s.customers.forEach(function (k) { used[k.name] = 1; });
        var free = E.caseOf(s).companies.filter(function (n) { return !used[n]; });
        if (free.length) return E.pick(s, free);
        for (var i = 0; i < 20; i++) {
            var n = E.pick(s, D.last) + ' ' + E.pick(s, ['GmbH', '& Söhne', '& Partner', 'Gruppe', 'AG', 'KG']);
            if (!used[n]) return n;
        }
        return 'Firma ' + s.nextId;
    };
    E.addLeads = function (s, n) {
        var added = [];
        for (var i = 0; i < n; i++) {
            var l = E.makeLead(s);
            s.leads.push(l);
            added.push(l);
        }
        while (s.leads.length > E.MAX_LEADS) s.leads.shift();
        return added;
    };

    /* Akquise: hits = Liste aus 'green' | 'yellow' | 'miss' */
    E.acquire = function (s, hits) {
        var c = E.caseOf(s);
        var n = 0;
        hits.forEach(function (h) {
            if (h === 'green') n += c.hitLeads;
            else if (h === 'yellow') n += (c.hitLeads >= 2 || E.rand(s) < 0.5) ? 1 : 0;
        });
        E.learn(s, 'marketing');
        return E.addLeads(s, n);
    };

    E.rejectLead = function (s, id, byPlayer) {
        if (byPlayer) { var l0 = E.findLead(s, id); if (l0 && l0.hints.some(function (h) { return h.t === 'red'; })) E.learn(s, 'warnzeichen'); }
        s.leads = s.leads.filter(function (l) { return l.id !== id; });
    };
    E.findLead = function (s, id) {
        for (var i = 0; i < s.leads.length; i++) if (s.leads[i].id === id) return s.leads[i];
        return null;
    };

    E.signCustomer = function (s, src, priceMult, extra) {
        var c = E.caseOf(s);
        var k = {
            id: s.nextId++, name: src.name, price: E.rnd(s, src.price * priceMult), setup: src.setup,
            toxic: !!src.toxic, tier: src.tier || 'M', face: src.face || Math.floor(E.rand(s) * 1e9),
            left: c.duration || null, since: s.month
        };
        if (extra) for (var key in extra) k[key] = extra[key];
        s.customers.push(k);
        s.cash += k.setup;
        s.monthSetup += k.setup;
        s.signedTotal += 1;
        return k;
    };

    /* Verkaufsgespräch: quality 'strong' | 'okay' | 'weak' */
    E.closeDeal = function (s, leadId, quality) {
        var l = E.findLead(s, leadId);
        if (!l) return null;
        E.rejectLead(s, leadId);
        if (quality === 'weak') {
            s.rep = clamp(s.rep - 1, 0, 100);
            return { signed: false, lead: l };
        }
        var mult = quality === 'strong' ? 1 : 0.85;
        if (quality !== 'strong') E.learn(s, 'preis');
        if (quality === 'strong') s.rep = clamp(s.rep + 1, 0, 100);
        var k = E.signCustomer(s, l, mult);
        return { signed: true, lead: l, customer: k, discount: quality !== 'strong', overload: s.customers.length > E.cap(s) };
    };

    /* Prozesse */
    E.procState = function (s, id) {
        var p = D.procs[id];
        if (s.procs[id]) return { state: 'built' };
        if (p.req && !s.procs[p.req]) return { state: 'locked', why: 'Benötigt zuerst: ' + E.caseOf(s).procs[p.req] };
        if (p.reqCount && E.procCount(s) < p.reqCount) return { state: 'locked', why: 'Benötigt ' + p.reqCount + ' andere Prozesse.' };
        if (s.cash < E.procCost(s, id)) return { state: 'poor', why: 'Zu wenig Geld.' };
        return { state: 'open' };
    };
    E.buildProc = function (s, id) {
        s.cash -= E.procCost(s, id);
        s.procs[id] = s.month;
        E.learn(s, 'prozesse');
        if (id === 'delivery') s.chaos = clamp(s.chaos - 10, 0, 100);
        if (id === 'deputy') s.actionsLeft += 1;
    };

    /* Team */
    E.hire = function (s, role, free) {
        var c = E.caseOf(s);
        var m = {
            id: s.nextId++, role: role, name: E.pick(s, D.first) + ' ' + E.pick(s, D.last),
            salary: E.salaryOf(s, role), face: Math.floor(E.rand(s) * 1e9), since: s.month
        };
        if (!free) { s.cash -= E.hireFee(s); E.learn(s, 'team'); }
        s.staff.push(m);
        return m;
    };
    E.fire = function (s, id) {
        var m = null;
        s.staff = s.staff.filter(function (x) { if (x.id === id) { m = x; return false; } return true; });
        if (m) { s.cash -= m.salary; s.chaos = clamp(s.chaos + 3, 0, 100); } // ein Monatsgehalt Abfindung
        return m;
    };

    E.care = function (s) {
        s.cared = true;
        E.learn(s, 'kunden');
        s.chaos = clamp(s.chaos - 20, 0, 100);
        s.rep = clamp(s.rep + 6, 0, 100);
    };
    E.rest = function (s) {
        s.energy = clamp(s.energy + 40, 0, 100);
    };

    E.takeLoan = function (s) {
        if (s.loan >= E.loanMax(s)) return false;
        var st = E.loanStep(s);
        s.loan += st; s.cash += st; E.learn(s, 'kredit'); return true;
    };
    E.repayLoan = function (s) {
        var st = E.loanStep(s);
        if (s.loan <= 0 || s.cash < st) return false;
        s.loan -= st; s.cash -= st; return true;
    };

    /* ---------- Ereignisse ---------- */
    E.isBossMonth = function (s) { return !!D.bosses[s.month]; };

    /* rival = Spielstand des anderen Spielers (nur im 2-Spieler-Modus) */
    E.pickEvent = function (s, rival) {
        var cid = s.caseId;
        var pool = D.events.filter(function (ev) {
            if (ev.cases && ev.cases.indexOf(cid) < 0) return false;
            if (ev.duel && !rival) return false;
            if (ev.cond && !ev.cond(s, rival)) return false;
            return s.usedEvents.indexOf(ev.id) < 0;
        });
        if (!pool.length) { s.usedEvents = []; return E.pickEvent(s, rival); }
        // Branchen- und Duell-Ereignisse etwas häufiger
        var weighted = [];
        pool.forEach(function (ev) { weighted.push(ev); if (ev.cases) weighted.push(ev); if (ev.duel) { weighted.push(ev); weighted.push(ev); } });
        var ev = E.pick(s, weighted);
        s.usedEvents.push(ev.id);
        var inst = { def: ev, s: s, rival: rival || null, staff: s.staff.length ? E.pick(s, s.staff) : null, cust: s.customers.length ? E.pick(s, s.customers) : null };
        return inst;
    };
    E.fill = function (inst, text) {
        return text.replace(/\{staff\}/g, inst.staff ? inst.staff.name.split(' ')[0] : 'Jemand')
            .replace(/\{cust\}/g, inst.cust ? inst.cust.name : 'Ein Kunde')
            .replace(/\{rival\}/g, inst.rival ? (inst.rival.playerName || 'Die Konkurrenz') : 'Die Konkurrenz')
            .replace(/(\d{1,3}(?:\.\d{3})+|\d+) €/g, function (m) { return E.moneyText(inst.s, m); });
    };
    E.choiceAllowed = function (s, choice) { return !choice.req || E.has(s, choice.req); };

    E.applyFx = function (s, fx, inst) {
        var c = E.caseOf(s);
        var out = [];
        if (fx.cash) { var cv = E.mo(s, fx.cash); s.cash += cv; out.push({ k: 'cash', v: cv }); }
        if (fx.mrrCash && inst && inst.cust) {
            var v = Math.round(inst.cust.price * fx.mrrCash); s.cash += v; out.push({ k: 'cash', v: v });
        }
        if (fx.energy) { var e0 = s.energy; s.energy = clamp(s.energy + fx.energy, 0, 100); out.push({ k: 'energy', v: s.energy - e0 }); }
        if (fx.chaos) { var c0 = s.chaos; s.chaos = clamp(s.chaos + fx.chaos, 0, 100); out.push({ k: 'chaos', v: s.chaos - c0 }); }
        if (fx.rep) { var r0 = s.rep; s.rep = clamp(s.rep + fx.rep, 0, 100); out.push({ k: 'rep', v: s.rep - r0 }); }
        if (fx.leads) { E.addLeads(s, fx.leads); out.push({ k: 'leads', v: fx.leads }); }
        if (fx.fix) { var fv = E.mo(s, fx.fix); s.fixExtra += fv; out.push({ k: 'fix', v: fv }); }
        if (fx.raise && inst && inst.staff) {
            var rv0 = E.mo(s, fx.raise); inst.staff.salary += rv0; out.push({ k: 'salary', v: rv0 });
        }
        if (fx.loseStaff && inst && inst.staff) {
            s.staff = s.staff.filter(function (m) { return m.id !== inst.staff.id; });
            out.push({ k: 'staffLost', v: -1, name: inst.staff.name });
        }
        if (fx.loseCustomer && inst && inst.cust) {
            s.customers = s.customers.filter(function (k) { return k.id !== inst.cust.id; });
            s.lostTotal += 1;
            out.push({ k: 'custLost', v: -1, name: inst.cust.name });
        }
        if (fx.hire) {
            if (s.staff.length < D.maxStaff) { var m = E.hire(s, fx.hire, true); out.push({ k: 'staffNew', v: 1, name: m.name }); }
        }
        if (fx.custDiscount && inst && inst.cust) {
            var cut = E.rnd(s, inst.cust.price * fx.custDiscount / 100);
            inst.cust.price -= cut; out.push({ k: 'discount', v: -cut, name: inst.cust.name });
        }
        var rv = inst && inst.rival;
        if (rv) {
            if (fx.stealToRival && inst.cust) {
                s.customers = s.customers.filter(function (k) { return k.id !== inst.cust.id; });
                s.lostTotal += 1;
                var stolen = JSON.parse(JSON.stringify(inst.cust)); stolen.id = rv.nextId++; stolen.since = rv.month;
                rv.customers.push(stolen); rv.signedTotal += 1;
                out.push({ k: 'stolen', v: -1, name: inst.cust.name, rival: rv.playerName });
            }
            if (fx.rivalLeads) { E.addLeads(rv, fx.rivalLeads); out.push({ k: 'rivalLeads', v: fx.rivalLeads, rival: rv.playerName }); }
            if (fx.rivalCash) { var rc = E.mo(rv, fx.rivalCash); rv.cash += rc; out.push({ k: 'rivalCash', v: rc, rival: rv.playerName }); }
            if (fx.rivalHire && rv.staff.length < D.maxStaff) { var rm = E.hire(rv, fx.rivalHire, true); out.push({ k: 'rivalHire', v: 1, name: rm.name, rival: rv.playerName }); }
        }
        if (fx.gainCustomer) {
            var src = { name: fx.gainCustomer.name || E.freshName(s), price: E.rnd(s, c.mrr * fx.gainCustomer.mult), setup: E.rnd(s, c.setup * fx.gainCustomer.mult), toxic: !!fx.gainCustomer.toxic, tier: 'L' };
            var k = E.signCustomer(s, src, 1, fx.gainCustomer.extra);
            out.push({ k: 'custNew', v: 1, name: k.name, price: k.price });
        }
        return out;
    };

    E.resolveChoice = function (s, inst, idx) {
        var ch = inst.def.choices[idx];
        var outs = ch.out;
        var o = outs[0];
        if (outs.length > 1) {
            var r = E.rand(s), acc = 0;
            for (var i = 0; i < outs.length; i++) { acc += outs[i].p || 0; if (r < acc) { o = outs[i]; break; } o = outs[i]; }
        }
        var eff = E.applyFx(s, o.fx || {}, inst);
        E.learn(s, 'risiko');
        return { text: E.fill(inst, o.text), effects: eff };
    };

    /* ---------- Bewährungsprobe ---------- */
    E.bossAt = function (s, m) { var bc = D.bossesByCase && D.bossesByCase[s.caseId]; return (bc && bc[m]) || D.bosses[m] || null; };
    E.boss = function (s) { return E.bossAt(s, s.month); };
    E.bossRounds = function (s, b) {
        return b.rounds.map(function (r) {
            var opts = r.a.map(function (txt, i) { return { text: txt, q: i === 0 ? 'strong' : i === 1 ? 'okay' : 'weak' }; });
            return { q: r.q, opts: E.shuffle(s, opts) };
        });
    };
    E.resolveBoss = function (s, b, qualities) {
        var score = 0;
        qualities.forEach(function (q) { score += q === 'strong' ? 2 : q === 'okay' ? 1 : 0; });
        var bonus = E.has(s, b.bonusProc);
        if (bonus) score += 1;
        var res = score >= 5 ? 'win' : score >= 3 ? 'mid' : 'lose';
        var fx = {};
        if (b.id === 'grosskunde') {
            if (res === 'win') fx = { gainCustomer: { mult: 3 }, rep: 5 };
            else if (res === 'mid') fx = { gainCustomer: { mult: 2 }, chaos: 10 };
            else fx = { gainCustomer: { mult: 1.5, toxic: true }, chaos: 20, energy: -20 };
            fx.gainCustomer.name = b.customerName || 'Brandt Holding AG';
            // Großkunde läuft beim Handwerk länger
            if (E.caseOf(s).duration) fx.gainCustomer.extra = { left: 4 };
        } else if (b.id === 'pruefung') {
            if (res === 'win') fx = { rep: 3 };
            else if (res === 'mid') fx = { cash: -4000 };
            else fx = { cash: -10000, chaos: 15 };
        } else if (b.id === 'investorin') {
            fx = {};
        }
        var eff = E.applyFx(s, fx, null);
        s.bosses[b.id] = res;
        return { res: res, score: score, bonus: bonus, text: E.moneyText(s, b.out[res]), effects: eff };
    };

    /* ---------- Monatsabschluss ---------- */
    E.endMonth = function (s) {
        var c = E.caseOf(s);
        var rep = { month: s.month, autoSales: [], unpaid: [], churned: [], finished: [], notes: [] };

        // 1. Vertriebsteam schließt selbstständig ab
        var sellers = E.count(s, 'sales');
        for (var i = 0; i < sellers; i++) {
            var pool = s.leads.filter(function (l) { return !(E.has(s, 'crm') && l.toxic); });
            if (!pool.length) break;
            var l = E.pick(s, pool);
            var p = 0.5 + (E.has(s, 'crm') ? 0.15 : 0) + (s.rep - 50) / 200;
            E.rejectLead(s, l.id);
            if (E.rand(s) < p) {
                var k = E.signCustomer(s, l, 0.9);
                rep.autoSales.push({ name: k.name, price: k.price, ok: true });
            } else rep.autoSales.push({ name: l.name, ok: false });
        }

        // 2. Einnahmen
        var rec = 0;
        s.customers.forEach(function (k) {
            if (k.toxic && E.rand(s) < 0.35) { rep.unpaid.push(k.name); return; }
            rec += k.price;
        });
        var rev = rec + s.monthSetup;
        var variable = Math.round(rev * c.varPct);
        var fixed = c.fix + s.fixExtra;
        var upkeep = E.upkeep(s);
        var salaries = E.salaries(s);
        var interest = Math.round(s.loan * E.LOAN_RATE);
        var profit = rev - variable - fixed - upkeep - salaries - interest;
        var tax = profit > 0 ? Math.round(profit * E.taxRate(s)) : 0;
        var cash0 = s.cash;
        s.cash += rec - variable - fixed - upkeep - salaries - interest - tax;
        E.learn(s, 'fixkosten');
        if (rev > 0) E.learn(s, 'marge');
        if (tax > 0) E.learn(s, 'steuern');
        rep.money = { rec: rec, setup: s.monthSetup, rev: rev, variable: variable, fixed: fixed, upkeep: upkeep, salaries: salaries, interest: interest, profit: profit, tax: tax, cash0: cash0, cash: s.cash };

        // 3. Chaos, Ruf
        var cap = E.cap(s);
        var over = Math.max(0, s.customers.length - cap);
        var toxicN = s.customers.filter(function (k) { return k.toxic; }).length;
        var chaos0 = s.chaos, rep0 = s.rep;
        var gain = 3 + s.customers.length * (2.4 / c.cap) + toxicN * 5 + over * 9;
        if (!E.has(s, 'handbook')) gain += s.staff.length * 1.5;
        if (E.has(s, 'delivery')) gain -= 5;
        gain -= E.count(s, 'assist') * 4;
        s.chaos = clamp(Math.round(s.chaos + gain), 0, 100);
        if (over > 0) { s.rep -= over * 4; rep.notes.push({ t: 'warn', x: 'Überlastet: ' + over + ' ' + (over === 1 ? c.unit : c.units) + ' mehr als deine Kapazität. Qualität und Ruf leiden.' }); }
        if (s.chaos > 60) s.rep -= 3;
        if (E.has(s, 'qa')) s.rep += 2;
        s.rep = clamp(Math.round(s.rep), 0, 100);
        rep.chaos = { from: chaos0, to: s.chaos };
        rep.rep = { from: rep0, to: s.rep };

        // 4. Kündigungen / abgeschlossene Aufträge
        var keep = [];
        s.customers.forEach(function (k) {
            if (c.duration) {
                if (k.since === s.month && !k.extended) { keep.push(k); return; }
                k.left -= 1;
                if (k.left <= 0) { rep.finished.push(k.name); s.rep = clamp(s.rep + (s.chaos < 50 ? 2 : -1), 0, 100); return; }
                keep.push(k); return;
            }
            if (k.since === s.month) { keep.push(k); return; }
            var p = c.churn * (1 + s.chaos / 50) * (E.has(s, 'qa') ? 0.5 : 1) * (s.rep < 30 ? 1.5 : 1) * (s.cared ? 0.5 : 1) + (k.toxic ? 0.1 : 0);
            if (E.rand(s) < p) { rep.churned.push(k.name); s.lostTotal += 1; return; }
            keep.push(k);
        });
        s.customers = keep;
        if (rep.churned.length) E.learn(s, 'kunden');
        if (rep.unpaid.length) E.learn(s, 'warnzeichen');

        // 5. Energie
        var e0 = s.energy;
        s.energy = clamp(s.energy + 20 + E.count(s, 'assist') * 15 + (E.has(s, 'deputy') ? 10 : 0), 0, 100);
        rep.energy = { from: e0, to: s.energy };

        // 6. Verlauf
        s.history.push({ m: s.month, cash: s.cash, mrr: E.mrr(s), cust: s.customers.length });

        // 7. Ende?
        if (s.cash < 0) s.over = 'pleite';
        else if (s.chaos >= 100) s.over = 'chaos';
        rep.over = s.over;
        return rep;
    };

    /* Neuer Monat: Aktionen auffrischen, Interessenten kommen von allein */
    E.startMonth = function (s) {
        s.month += 1;
        s.actionsLeft = E.maxActions(s);
        s.cared = false;
        s.monthSetup = 0;
        var info = { expired: [], passive: 0 };
        s.leads.forEach(function (l) { l.age += 1; });
        s.leads = s.leads.filter(function (l) { if (l.age >= 3) { info.expired.push(l.name); return false; } return true; });
        var n = (E.has(s, 'crm') ? 1 : 0) + (E.has(s, 'marketing') ? 2 : 0) + E.count(s, 'sales') + (s.rep >= 70 ? 1 : 0);
        if (n) E.addLeads(s, n);
        info.passive = n;
        return info;
    };

    /* ---------- Firmenwert ---------- */
    E.valuation = function (s) {
        var f = E.forecast(s);
        var annual = Math.max(0, f.runNet) * 12;
        var sys = 1 + 0.12 * E.procCount(s);
        var repF = 0.8 + s.rep / 250;
        var inv = s.bosses.investorin === 'win' ? 1.3 : s.bosses.investorin === 'mid' ? 1.1 : 1;
        var business = Math.round(annual * sys * repF * inv);
        var total = Math.round(s.cash - s.loan + business);
        var c = E.caseOf(s);
        var stars = 0;
        c.stars.forEach(function (t) { if (total >= t) stars += 1; });
        return { annual: annual, sys: sys, repF: repF, inv: inv, business: business, cash: s.cash, loan: s.loan, total: total, stars: stars };
    };

    G.PPENGINE = E;
})(typeof window !== 'undefined' ? window : globalThis);
