/* Prozesse oder Pleite – Bildschirme, Fernbedienungs-Navigation, Sound, Spielstand */
(function () {
    'use strict';
    var D = window.PPDATA, E = window.PPENGINE, A = window.PPART;
    var app = document.getElementById('app');
    var S = null;                 // Spielstand
    var ctx = {};                 // Daten des aktuellen Bildschirms
    var timers = [];
    var backFn = null;
    var focused = null;
    var SAVE_KEY = 'pp_save_v2', BEST_KEY = 'pp_best_v1';
    var M = null;                 // Partie: { mode: 1|2, cur, players: [{ name, color, S }] }
    var pending = { coins: 0 };   // 3D-Effekte, die beim nächsten 3D-Bild abgespielt werden
    var PP3D = window.PP3D;
    var learnMode = false;
    try { learnMode = localStorage.getItem('pp_learn') === '1'; } catch (e) { }

    /* ================= Hilfsfunktionen ================= */
    function eur(n) {
        var neg = n < 0; n = Math.abs(Math.round(n));
        return (neg ? '−' : '') + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
    }
    function sgn(n, unit) { return (n >= 0 ? '+' : '−') + (unit === '€' ? eur(Math.abs(n)) : Math.abs(n) + (unit || '')); }
    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function C() { return E.caseOf(S); }
    function duel() { return M && M.mode === 2; }
    function me() { return M.players[M.cur]; }
    function rivalP() { return duel() ? M.players[1 - M.cur] : null; }
    function accentOf() { return duel() ? me().color : C().color; }
    function lvlOf(s) {
        var score = s.customers.length * (3 / D.cases[s.caseId].cap) * 1.2 + s.staff.length * 2 + E.procCount(s) * 1.5;
        return score < 4 ? 0 : score < 9 ? 1 : score < 16 ? 2 : 3;
    }
    function setup3d() {
        if (!PP3D.ok || !M) return;
        PP3D.setPlayers(M.players.map(function (p) {
            var c = D.cases[p.S.caseId];
            return { name: duel() ? p.name : c.name, color: duel() ? p.color : c.color, caseColor: c.color };
        }));
        sync3d();
    }
    function sync3d() {
        if (!PP3D.ok || !M) return;
        M.players.forEach(function (p, i) {
            var s = p.S;
            PP3D.update(i, { level: lvlOf(s), procs: E.procCount(s), staff: s.staff.map(function (m) { return m.role; }), customers: s.customers.length, cash: s.cash / E.ms(s), chaos: s.chaos });
        });
    }
    function newMatch(mode, picks) {
        var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
        M = { mode: mode, cur: 0, players: picks.map(function (id, i) {
            var st = E.newGame(id, seed + i * 7919);
            var pl = D.players[i];
            st.playerName = mode === 2 ? pl.name : 'Du';
            return { name: pl.name, color: pl.color, S: st, news: null };
        }) };
        S = M.players[0].S;
        setup3d();
    }
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); timers = []; if (ctx.raf) cancelAnimationFrame(ctx.raf); }
    function procName(id) { return C().procs[id]; }
    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    function save() { try { if (M && !M.players.some(function (p) { return p.S.over; })) localStorage.setItem(SAVE_KEY, JSON.stringify(M)); } catch (e) { } }
    function loadSave() { try { var t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
    function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
    function getBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); } catch (e) { return {}; } }
    function setBest(b) { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { } }

    /* ================= Sound ================= */
    var actx = null, muted = false;
    function tone(freq, dur, type, vol, when) {
        if (muted) return;
        try {
            if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
            if (actx.state === 'suspended') actx.resume();
            var t = actx.currentTime + (when || 0);
            var o = actx.createOscillator(), g = actx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
            o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
        } catch (e) { }
    }
    function sfx(k) {
        if (k === 'move') tone(660, 0.05, 'sine', 0.03);
        else if (k === 'click') tone(880, 0.07, 'triangle', 0.06);
        else if (k === 'no') { tone(220, 0.12, 'square', 0.04); tone(180, 0.14, 'square', 0.04, 0.09); }
        else if (k === 'coin') { tone(988, 0.1, 'triangle', 0.08); tone(1319, 0.3, 'triangle', 0.08, 0.08); }
        else if (k === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.25, 'triangle', 0.07, i * 0.11); }); }
        else if (k === 'lose') { [392, 330, 262].forEach(function (f, i) { tone(f, 0.3, 'sawtooth', 0.04, i * 0.16); }); }
        else if (k === 'tick') tone(1200, 0.03, 'square', 0.02);
        else if (k === 'good') tone(1046, 0.18, 'triangle', 0.07);
        else if (k === 'meh') tone(523, 0.18, 'triangle', 0.06);
        else if (k === 'boss') { [110, 147, 131].forEach(function (f, i) { tone(f, 0.3, 'sawtooth', 0.06, i * 0.14); }); }
    }

    /* ================= Toast & Effekte ================= */
    var toastT = null;
    function toast(msg) {
        var el = document.getElementById('toast');
        el.innerHTML = msg; el.classList.add('on');
        clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2600);
    }
    function coins(n) {
        var fx = document.getElementById('fx');
        for (var i = 0; i < (n || 18); i++) {
            var c = document.createElement('div');
            c.className = 'coinfx';
            c.style.left = (Math.random() * 1240) + 'px';
            c.style.top = (-40 - Math.random() * 200) + 'px';
            c.style.animationDelay = (Math.random() * 0.4) + 's';
            fx.appendChild(c);
            setTimeout(function (el) { return function () { el.remove(); }; }(c), 1800);
        }
    }

    /* ================= Bildgröße: 1280 × 720 auf jeden Bildschirm einpassen ================= */
    function fit() {
        var st = document.getElementById('stage');
        var w = window.innerWidth, h = window.innerHeight;
        var sc = Math.min(w / 1280, h / 720);
        st.style.transform = 'translate(' + Math.round((w - 1280 * sc) / 2) + 'px,' + Math.round((h - 720 * sc) / 2) + 'px) scale(' + sc + ')';
    }
    window.addEventListener('resize', fit);
    fit();
    document.addEventListener('touchstart', function () { document.body.classList.add('touch'); }, { once: true, passive: true });

    /* ================= Rendering & Navigation ================= */
    function show(html, opts) {
        clearTimers();
        opts = opts || {};
        ctx = opts.ctx || {};
        backFn = opts.back || null;
        app.innerHTML = '<div class="screen' + (opts.cls ? ' ' + opts.cls : '') + '">' + html + '</div>';
        if (S) document.documentElement.style.setProperty('--accent', accentOf());
        if (M) sync3d();
        PP3D.view(opts.three || 'off', M ? M.cur : 0);
        if (opts.three && pending.coins && M) { PP3D.coins(M.cur, pending.coins); pending.coins = 0; }
        focused = null;
        var auto = app.querySelector('[data-auto]');
        setFocus(auto || first());
    }
    function scope() { var m = app.querySelector('.modal'); return m || app; }
    function cands() {
        var list = scope().querySelectorAll('[data-f]');
        var out = [];
        for (var i = 0; i < list.length; i++) if (list[i].getClientRects().length) out.push(list[i]);
        return out;
    }
    function first() { var c = cands(); return c[0] || null; }
    function setFocus(el) {
        if (focused) focused.classList.remove('f');
        focused = el;
        if (el) el.classList.add('f');
    }
    function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    function overlap(a1, a2, b1, b2) { return Math.min(a2, b2) - Math.max(a1, b1) > 6; }
    function move(dir) {
        var list = cands();
        if (!list.length) return;
        if (!focused || list.indexOf(focused) < 0) { setFocus(list[0]); return; }
        var from = focused.getBoundingClientRect(), fc = center(from);
        var best = null, bestS = Infinity;
        list.forEach(function (el) {
            if (el === focused) return;
            var r = el.getBoundingClientRect(), c = center(r), p, o;
            if (dir === 'up') { if (c.y >= fc.y - 6) return; p = fc.y - c.y; o = overlap(from.left, from.right, r.left, r.right) ? 0 : Math.abs(c.x - fc.x); }
            if (dir === 'down') { if (c.y <= fc.y + 6) return; p = c.y - fc.y; o = overlap(from.left, from.right, r.left, r.right) ? 0 : Math.abs(c.x - fc.x); }
            if (dir === 'left') { if (c.x >= fc.x - 6) return; p = fc.x - c.x; o = overlap(from.top, from.bottom, r.top, r.bottom) ? 0 : Math.abs(c.y - fc.y); }
            if (dir === 'right') { if (c.x <= fc.x + 6) return; p = c.x - fc.x; o = overlap(from.top, from.bottom, r.top, r.bottom) ? 0 : Math.abs(c.y - fc.y); }
            var sc = p + o * 2.2;
            if (sc < bestS) { bestS = sc; best = el; }
        });
        if (best) { setFocus(best); sfx('move'); }
    }
    var H = {};
    function act(el) {
        if (!el) return;
        if (el.classList.contains('dis')) { sfx('no'); toast(el.getAttribute('data-why') || 'Geht gerade nicht.'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
        var h = H[el.getAttribute('data-a')];
        if (h) { sfx('click'); h(el.getAttribute('data-v'), el); }
    }
    function btn(label, a, v, o) {
        o = o || {};
        return '<button class="btn ' + (o.cls || '') + (o.dis ? ' dis' : '') + '" data-f data-a="' + a + '"' + (v !== undefined && v !== null ? ' data-v="' + esc(v) + '"' : '') +
            (o.auto ? ' data-auto' : '') + (o.why ? ' data-why="' + esc(o.why) + '"' : '') + (o.style ? ' style="' + o.style + '"' : '') + '>' + (o.icon ? A.icon(o.icon) : '') + label + '</button>';
    }

    app.addEventListener('click', function (e) {
        var el = e.target.closest('[data-f]');
        if (el) { setFocus(el); act(el); }
    });
    document.addEventListener('keydown', function (e) {
        var k = e.key, c = e.keyCode;
        if (k === 'ArrowUp' || c === 38) { e.preventDefault(); move('up'); }
        else if (k === 'ArrowDown' || c === 40) { e.preventDefault(); move('down'); }
        else if (k === 'ArrowLeft' || c === 37) { e.preventDefault(); move('left'); }
        else if (k === 'ArrowRight' || c === 39) { e.preventDefault(); move('right'); }
        else if (k === 'Enter' || k === ' ' || c === 13 || c === 23) { e.preventDefault(); if (!e.repeat) act(focused); }
        else if (k === 'Escape' || k === 'Backspace') { e.preventDefault(); window.tvBack(); }
        else if (k === 'MediaPlayPause' || c === 179) { e.preventDefault(); window.tvKey('playpause'); }
        else if (k === 'm') { muted = !muted; toast(muted ? 'Ton aus' : 'Ton an'); }
    }, true);

    window.tvBack = function () {
        var m = app.querySelector('.modal');
        if (m) { closeModal(); return true; }
        if (backFn) { var r = backFn(); return r !== false; }
        return false;
    };
    window.tvKey = function (name) {
        if (name === 'playpause') { if (!focused || !focused.classList.contains('dis')) act(focused); return true; }
        if (name === 'menu') { muted = !muted; toast(muted ? 'Ton aus' : 'Ton an'); return true; }
        return true;
    };

    /* Modal */
    var modalPrev = null;
    function modal(html) {
        closeModal();
        modalPrev = focused;
        var m = document.createElement('div');
        m.className = 'modal';
        m.innerHTML = '<div class="card">' + html + '</div>';
        app.querySelector('.screen').appendChild(m);
        var auto = m.querySelector('[data-auto]');
        setFocus(auto || m.querySelector('[data-f]'));
    }
    function closeModal() {
        var m = app.querySelector('.modal');
        if (m) { m.remove(); if (modalPrev && modalPrev.isConnected) setFocus(modalPrev); else setFocus(first()); }
    }
    H.closeModal = function () { closeModal(); };

    /* ================= Bausteine ================= */
    function hud() {
        var c = C();
        var cap = E.cap(S), n = S.customers.length;
        var dots = '';
        for (var i = 0; i < E.maxActions(S); i++) dots += '<i class="' + (i < S.actionsLeft ? 'on' : '') + '"></i>';
        var chaosCol = S.chaos >= 70 ? '#ef4444' : S.chaos >= 45 ? '#f59e0b' : '#a78bfa';
        return '<div class="hud">' +
            '<div class="brand"><div class="logo">' + (duel() ? (M.cur + 1) : 'P') + '</div><div><b>' + esc(duel() ? me().name : c.name) + '</b><span>' + (duel() ? esc(c.name) + ' · ' : '') + 'Monat ' + S.month + ' von ' + E.MONTHS + '</span></div></div>' +
            '<div class="stat" style="flex:1.25"><div class="k">Kontostand</div><div class="v ' + (S.cash < 0 ? 'bad' : '') + '">' + eur(S.cash) + '</div></div>' +
            '<div class="stat" style="flex:1.25"><div class="k">Umsatz / Monat</div><div class="v">' + eur(E.mrr(S)) + ' <small>' + n + '/' + cap + '</small></div></div>' +
            '<div class="stat" style="flex:1"><div class="k">⚡ Energie ' + S.energy + '</div><div class="bar"><i style="width:' + S.energy + '%;background:#facc15"></i></div></div>' +
            '<div class="stat" style="flex:1"><div class="k">🌀 Chaos ' + S.chaos + '</div><div class="bar"><i style="width:' + S.chaos + '%;background:' + chaosCol + '"></i></div></div>' +
            '<div class="stat" style="flex:1"><div class="k">★ Ruf ' + S.rep + '</div><div class="bar"><i style="width:' + S.rep + '%;background:#22d3ee"></i></div></div>' +
            '<div class="stat" style="flex:0.9"><div class="k">Aktionen</div><div class="dots">' + dots + '</div></div>' +
            '</div>';
    }
    function miniStatus() {
        return '<div class="row" style="gap:10px;flex-wrap:wrap;justify-content:flex-end">' +
            '<span class="chip">💶 ' + eur(S.cash) + '</span><span class="chip y">⚡ ' + S.energy + '</span>' +
            '<span class="chip p">Aktionen ' + S.actionsLeft + '/' + E.maxActions(S) + '</span></div>';
    }
    function header(title, sub, right) {
        return '<div class="row" style="align-items:flex-end;margin-bottom:20px;gap:24px"><div class="grow"><h2>' + title + '</h2>' + (sub ? '<div class="mute big" style="margin-top:6px">' + sub + '</div>' : '') + '</div>' + (right || '') + '</div>';
    }
    function level() { return lvlOf(S); }
    function levelOld() {
        var score = S.customers.length * (3 / C().cap) * 1.2 + S.staff.length * 2 + E.procCount(S) * 1.5;
        return score < 4 ? 0 : score < 9 ? 1 : score < 16 ? 2 : 3;
    }
    var LEVELS = ['Garage', 'Kleines Büro', 'Eigene Etage', 'Firmenzentrale'];
    function lvName(lv) { return (C().levels || LEVELS)[lv]; }
    function fxChips(list) {
        if (!list || !list.length) return '<span class="chip">Keine Auswirkungen</span>';
        return list.map(function (f) {
            if (f.k === 'cash') return '<span class="chip ' + (f.v >= 0 ? 'g' : 'r') + '">💶 ' + sgn(f.v, '€') + '</span>';
            if (f.k === 'energy') return f.v ? '<span class="chip ' + (f.v >= 0 ? 'g' : 'r') + '">⚡ ' + sgn(f.v) + ' Energie</span>' : '';
            if (f.k === 'chaos') return f.v ? '<span class="chip ' + (f.v <= 0 ? 'g' : 'r') + '">🌀 ' + sgn(f.v) + ' Chaos</span>' : '';
            if (f.k === 'rep') return f.v ? '<span class="chip ' + (f.v >= 0 ? 'g' : 'r') + '">★ ' + sgn(f.v) + ' Ruf</span>' : '';
            if (f.k === 'leads') return '<span class="chip b">+' + plural(f.v, 'Interessent', 'Interessenten') + '</span>';
            if (f.k === 'fix') return '<span class="chip r">+' + eur(f.v) + ' Fixkosten / Monat</span>';
            if (f.k === 'salary') return '<span class="chip r">+' + eur(f.v) + ' Gehalt / Monat</span>';
            if (f.k === 'staffLost') return '<span class="chip r">' + esc(f.name) + ' verlässt dich</span>';
            if (f.k === 'custLost') return '<span class="chip r">' + esc(f.name) + ' ist weg</span>';
            if (f.k === 'staffNew') return '<span class="chip g">' + esc(f.name) + ' ist neu im Team</span>';
            if (f.k === 'custNew') return '<span class="chip g">Neu: ' + esc(f.name) + ' (+' + eur(f.price) + ' / Monat)</span>';
            if (f.k === 'discount') return '<span class="chip r">' + esc(f.name) + ': ' + eur(f.v) + ' / Monat</span>';
            if (f.k === 'stolen') return '<span class="chip r">' + esc(f.name) + ' wechselt zu ' + esc(f.rival) + '</span>';
            if (f.k === 'rivalLeads') return '<span class="chip b">' + esc(f.rival) + ': +' + plural(f.v, 'Interessent', 'Interessenten') + '</span>';
            if (f.k === 'rivalCash') return '<span class="chip y">' + esc(f.rival) + ': ' + sgn(f.v, '€') + '</span>';
            if (f.k === 'rivalHire') return '<span class="chip y">' + esc(f.name) + ' geht zu ' + esc(f.rival) + '</span>';
            return '';
        }).join(' ');
    }
    function procFx(id) {
        if (id === 'delivery') return '+' + E.procCap(S, 'delivery') + ' Kapazität. Jeden Monat 5 Chaos weniger.';
        if (id === 'auto') return '+' + E.procCap(S, 'auto') + ' Kapazität. Jede Aktion kostet 5 Energie weniger.';
        return D.procs[id].fx;
    }

    /* ================= Mentorin ================= */
    function tip() {
        var c = C(), f = E.forecast(S), cap = E.cap(S);
        if (S.month === 1 && S.customers.length === 0) return 'Willkommen! Du hast schon <b>' + plural(S.leads.length, 'Interessenten', 'Interessenten') + '</b>. Ruf sie unter <b>Verkaufen</b> an – aber achte auf rote Warnzeichen!';
        if (f.cashAfter < 0) return 'Achtung! Am Monatsende fehlen dir <b>' + eur(-f.cashAfter) + '</b>. Verkaufe mehr oder nimm unter <b>Finanzen</b> einen Kredit auf – sonst ist es aus.';
        if (S.chaos >= 70) return 'Das Chaos wächst dir über den Kopf! Bei 100 bricht alles zusammen. <b>Kunden pflegen</b> oder Prozesse wie <b>' + c.procs.delivery + '</b> helfen.';
        if (S.energy < 25) return 'Du bist ziemlich platt. <b>Durchatmen</b> gibt dir 40 Energie zurück. Auch eine Assistenz entlastet dich jeden Monat.';
        if (S.customers.length >= cap) return 'Du bist voll ausgelastet (' + S.customers.length + '/' + cap + '). Mehr ' + c.units + ' ohne mehr Kapazität bringen Chaos. Stell jemanden ein oder bau Prozesse.';
        if (E.isBossMonth(S)) return 'Am Ende dieses Monats wartet eine <b>Bewährungsprobe</b>: ' + E.boss(S).title + '. Bereite dich vor!';
        var nb = E.bossAt(S, S.month + 1);
        if (nb) return 'Nächsten Monat kommt <b>' + nb.title + '</b>. Der Prozess <b>' + procName(nb.bonusProc) + '</b> gibt dir dort einen Vorteil.';
        if (S.leads.length === 0) return 'Keine Interessenten mehr in der Pipeline. Zeit für <b>' + c.acq + '</b>!';
        if (E.procCount(S) === 0 && S.month >= 2) return 'Alles hängt an dir. Prozesse kosten einmal Geld – und arbeiten dann jeden Monat für dich. Das ist der Weg aus dem Hamsterrad.';
        if (S.staff.length === 0 && S.month >= 4) return 'Allein stößt du an Grenzen. Ein ' + c.roles.sales + ' gewinnt jeden Monat selbstständig Kunden.';
        var gen = [
            'Interessenten verfallen nach drei Monaten. Ruf die besten zuerst an.',
            'Am Ende zählt der <b>Firmenwert</b>: laufender Gewinn × System-Faktor. Jeder Prozess erhöht ihn um 12 %.',
            'Starke Antworten im Verkauf bringen den vollen Preis. Rabatte bleiben dir jeden Monat erhalten – leider.',
            'Ein guter Ruf bringt dir jeden Monat Empfehlungen – und weniger schwierige Kunden.',
            'Kunden pflegen halbiert die Kündigungen im laufenden Monat.'
        ];
        return gen[S.month % gen.length];
    }
    function mentorBox(text) {
        return '<div class="mentor">' + A.mentor() + '<div class="bubble"><b>Mira, deine Mentorin</b><br>' + text + '</div></div>';
    }

    /* ================= Titel ================= */
    function title() {
        S = null; M = null;
        document.documentElement.style.setProperty('--accent', '#8b5cf6');
        var sv = loadSave();
        if (sv && !sv.players) sv = null;
        if (PP3D.ok) {
            PP3D.setPlayers([{ name: 'Deine Firma', color: '#8b5cf6', caseColor: '#8b5cf6' }]);
            PP3D.update(0, { level: 3, procs: 8, staff: ['sales', 'delivery', 'assist', 'delivery', 'sales'], customers: 10, cash: 90000, chaos: 0 });
        }
        var coinsBg = '';
        for (var i = 0; i < 9; i++) coinsBg += '<div class="coin" style="left:' + (8 + i * 11) + '%;top:' + (10 + (i * 37) % 70) + '%;animation-delay:' + (i * 0.7) + 's"></div>';
        var html = '<div class="title-bg">' + coinsBg + '</div><div class="shade-left"></div>' +
            '<div class="row grow" style="align-items:center;gap:50px;position:relative">' +
            '<div class="col" style="width:560px;gap:18px">' +
            '<div class="logo-big"><span class="p1">PROZESSE</span><span class="oder">ODER</span><span class="p2">PLEITE</span></div>' +
            '<div class="big mute" style="font-weight:600;font-size:25px">Baue in 12 Monaten ein Unternehmen auf, das auch ohne dich läuft.</div>' +
            '<div class="col" style="gap:14px;width:420px">' +
            (sv ? btn('Weiterspielen <span class="dim small" style="margin-left:auto">' + (sv.mode === 2 ? 'Duell' : esc(D.cases[sv.players[0].S.caseId].name)) + ' · Monat ' + sv.players[sv.cur].S.month + '</span>', 'resume', null, { cls: 'primary', auto: true, style: 'width:100%' }) : '') +
            btn('1 Spieler', 'newgame', null, { cls: sv ? '' : 'primary', auto: !sv, style: 'width:100%' }) +
            btn('2 Spieler – Duell <span class="chip p" style="margin-left:auto">NEU</span>', 'newgame2', null, { style: 'width:100%' }) +
            '<div class="row" style="gap:14px">' + btn('So geht\'s', 'help', null, { style: 'flex:1;justify-content:center;white-space:nowrap;padding:14px 16px' }) +
            btn('Lernmodus <span class="chip ' + (learnMode ? 'g' : '') + '" style="margin-left:6px">' + (learnMode ? 'AN' : 'AUS') + '</span>', 'toggleLearn', null, { style: 'flex:1.3;justify-content:center;white-space:nowrap;padding:14px 16px' }) + '</div>' +
            btn('📱 Aufs Handy holen <span class="chip" style="margin-left:auto">QR-Code</span>', 'info', null, { style: 'width:100%;white-space:nowrap' }) +
            '</div></div>' +
            '<div class="grow col" style="gap:18px;justify-content:flex-end;align-self:stretch;padding-bottom:34px">' +
            (PP3D.ok ? '' : '<div class="card" style="padding:0;overflow:hidden;height:360px">' + A.building(3, '#8b5cf6') + '</div>') +
            mentorBox('Hi, ich bin Mira. Ich helfe dir, aus deiner Idee eine Firma zu machen, die nicht nur an dir hängt.') +
            '</div></div>' +
            '<div class="keys"><b>▲▼◀▶</b> Auswählen · <b>OK</b> Bestätigen · <b>Zurück</b> Zurück · <b>☰</b> Ton</div>';
        show(html, { back: function () { return false; }, three: 'title' });
    }
    var setup = null;   // Auswahl vor Spielstart
    H.toggleLearn = function () { learnMode = !learnMode; try { localStorage.setItem('pp_learn', learnMode ? '1' : '0'); } catch (e) { } title(); toast(learnMode ? 'Lernmodus an: doppelte Bedenkzeit' : 'Lernmodus aus'); };
    H.newgame = function () { setup = { mode: 1, picks: [] }; cases(); };
    H.newgame2 = function () { setup = { mode: 2, picks: [] }; cases(); };
    H.resume = function () {
        var sv = loadSave();
        if (!sv || !sv.players) return title();
        M = sv; S = M.players[M.cur].S;
        M.players.forEach(function (p) { p.S.skills = p.S.skills || {}; p.S.skillQueue = p.S.skillQueue || []; p.S.usedQ = p.S.usedQ || {}; });
        setup3d();
        if (duel()) handover(); else hub();
    };
    H.help = function () { help(ctx.from || 'title'); };
    H.title = function () { title(); };

    /* ================= Info: Handy-Version per QR-Code ================= */
    function qrSvg(text) {
        if (!window.qrcode) return '<div class="center" style="display:flex;height:100%;color:#0f172a;font-weight:800">QR nicht verfügbar</div>';
        var q = window.qrcode(0, 'M'); q.addData(text); q.make();
        return q.createSvgTag({ cellSize: 6, margin: 1, scalable: true });
    }
    H.info = function () { info(); };
    function info() {
        var L = D.links;
        var html = header('Aufs Handy holen', 'Spiel es auch unterwegs – als App für Android-Smartphones.') +
            '<div class="row grow" style="gap:26px;min-height:0">' +
            '<div class="card row" style="gap:26px;flex:1.45;align-items:center">' +
            '<div class="qrbox">' + qrSvg(L.mobileApk) + '</div>' +
            '<div class="col" style="gap:14px"><h3>📱 Handy-Version (Android)</h3><div class="steps">' +
            '<div class="st"><i>1</i><span>QR-Code mit der Handy-Kamera scannen</span></div>' +
            '<div class="st"><i>2</i><span>Die Datei <b>ProzesseOderPleite-Mobile.apk</b> herunterladen</span></div>' +
            '<div class="st"><i>3</i><span>Öffnen und „Installation aus dieser Quelle erlauben“ bestätigen</span></div>' +
            '<div class="st"><i>4</i><span>Installieren – Handy quer halten und loslegen</span></div>' +
            '</div><div class="url">' + esc(L.mobileApk) + '</div></div></div>' +
            '<div class="card col" style="gap:14px;flex:1;align-items:center;text-align:center">' +
            '<div class="qrbox" style="width:200px;height:200px">' + qrSvg(L.repo) + '</div>' +
            '<h3>💻 Open Source auf GitHub</h3><div class="mute">Code, Anleitung, Updates und die Fire-TV-Version zum Nachbauen.</div><div class="url">' + esc(L.repo) + '</div></div>' +
            '</div>' +
            '<div class="row" style="justify-content:space-between;align-items:center;margin-top:16px"><span class="mute">Version ' + esc(D.version) + ' · Der Spielstand auf dem Handy ist getrennt vom Fernseher.</span>' + btn('Zurück', 'title', null, { cls: 'primary', auto: true }) + '</div>';
        show(html, { back: title });
    }

    /* ================= Hilfe ================= */
    function help(from) {
        var html = header('So geht\'s', 'Ein Jahr, vier Branchen, eine Frage: Läuft der Laden auch ohne dich?') +
            '<div class="grid3 grow">' +
            '<div class="card col"><h3>📅 Jeder Monat</h3><div class="big">Du hast <b>3 Aktionen</b>. Akquise, Verkaufen, Prozesse, Team, Kunden pflegen oder Durchatmen.</div><div class="big mute">Danach kommt ein Ereignis – und die Abrechnung.</div></div>' +
            '<div class="card col"><h3>⚠️ Game Over</h3><div class="big">Konto unter Null: <b class="bad">Pleite</b>.</div><div class="big">Chaos erreicht 100: <b class="bad">Kollaps</b>.</div><div class="big mute">Energie brauchst du für jede Aktion.</div></div>' +
            '<div class="card col"><h3>🏆 Ziel &amp; Duell</h3><div class="big">Nach 12 Monaten bewertet die Investorin deine Firma: <b>Gewinn × System</b>.</div><div class="big mute">Im Duell spielt ihr abwechselnd je 3 Aktionen – das wertvollere Business gewinnt.</div></div>' +
            '</div>' +
            '<div class="row" style="margin-top:20px;align-items:center"><div class="grow big mute">Steuerung: <b class="gold">Pfeile</b> wählen · <b class="gold">OK</b> oder <b class="gold">⏯</b> bestätigen · <b class="gold">Zurück</b> geht zurück · <b class="gold">☰</b> Ton an/aus · <b class="gold">Skills</b>: Business-Wissen sammeln</div>' +
            btn('Verstanden', from === 'hub' ? 'hub' : 'title', null, { cls: 'primary', auto: true }) + '</div>';
        show(html, { back: function () { from === 'hub' ? hub() : title(); } });
    }

    /* ================= Business-Auswahl ================= */
    function cases() {
        var best = getBest();
        var cards = D.caseOrder.map(function (id) {
            var c = D.cases[id];
            var st = best[id] ? best[id].stars : 0;
            var bestTxt = best[id] ? '<span class="chip y">Rekord ' + '★★★'.slice(0, st) + '☆☆☆'.slice(0, 3 - st) + '</span>' : '';
            var other = setup && setup.mode === 2 && setup.picks.length === 1 && setup.picks[0] === id;
            return '<button class="casecard" data-f data-a="pickcase" data-v="' + id + '"' + (id === D.caseOrder[0] ? ' data-auto' : '') + ' style="border-color:' + c.color + '55">' +
                (other ? '<span class="chip" style="position:absolute;top:12px;left:12px;z-index:2;border-color:' + D.players[0].color + ';color:' + D.players[0].color + '">Spieler 1</span>' : '') +
                A.caseScene(id) +
                '<div class="body"><h3>' + c.name + '</h3><div class="diff">' + '★★★'.slice(0, c.diff) + '<span class="dim">' + '★★★'.slice(0, 3 - c.diff) + '</span></div>' +
                '<div class="tag">' + c.tag + '</div>' +
                '<div class="meta"><span class="chip g">Start ' + eur(c.startCash) + '</span><span class="chip r">Fix ' + eur(c.fix) + '</span>' + bestTxt + '</div></div></button>';
        }).join('');
        var who = setup && setup.mode === 2 ? D.players[setup.picks.length] : null;
        if (who) document.documentElement.style.setProperty('--accent', who.color);
        var head = who ? '<span style="color:' + who.color + '">' + who.name + '</span>: Wähle dein Business' : 'Wähle dein Business';
        var sub = who ? 'Ihr dürft auch dieselbe Branche nehmen. Die Sterne zeigen die Schwierigkeit.' : 'Jede Branche spielt sich anders. Die Sterne zeigen die Schwierigkeit.';
        show(header(head, sub) + '<div class="cases">' + cards + '</div>', { back: function () { if (setup && setup.picks.length) { setup.picks.pop(); cases(); } else title(); } });
    }
    H.pickcase = function (id) {
        if (!setup || setup.mode === 1) { setup = { mode: 1, picks: [id] }; return intro(id); }
        setup.picks.push(id);
        if (setup.picks.length < 2) return cases();
        duelIntro();
    };
    function duelIntro() {
        var cards = setup.picks.map(function (id, i) {
            var c = D.cases[id], pl = D.players[i];
            return '<div class="card col" style="gap:12px;padding:0;overflow:hidden;border-color:' + pl.color + '">' + A.caseScene(id) +
                '<div class="col" style="gap:8px;padding:0 22px 20px"><h2 style="color:' + pl.color + '">' + pl.name + '</h2><h3>' + c.name + '</h3><div class="mute">' + c.twist + '</div></div></div>';
        }).join('<div class="center" style="display:flex;font-size:64px;font-weight:900;color:var(--gold)">VS</div>');
        var html = header('Das Duell', 'Abwechselnd je 3 Aktionen pro Monat. Nach 12 Monaten entscheidet die Investorin.') +
            '<div class="row grow" style="gap:24px;align-items:stretch"><div class="grow" style="display:grid;grid-template-columns:1fr 110px 1fr;gap:0;align-items:stretch">' + cards + '</div></div>' +
            '<div class="row" style="margin-top:20px;gap:16px;align-items:center"><div class="grow">' + mentorBox('Fair für alle Branchen: Die Investorin vergibt <b>Punkte</b> – wie stark ist deine Firma <b>für ihre Branche</b>? Und Achtung: Manche Ereignisse betreffen euch <b>beide</b>!') + '</div>' +
            btn('Duell starten!', 'startDuel', null, { cls: 'gold', auto: true, style: 'height:84px;font-size:28px;padding:0 40px' }) + '</div>';
        show(html, { back: function () { setup.picks.pop(); cases(); } });
    }
    H.startDuel = function () {
        newMatch(2, setup.picks.slice());
        save();
        handover();
    };

    function intro(id) {
        var c = D.cases[id];
        document.documentElement.style.setProperty('--accent', c.color);
        var html = '<div class="row grow" style="gap:36px;align-items:stretch">' +
            '<div class="col" style="width:520px">' +
            '<div class="card" style="padding:0;overflow:hidden;border-color:' + c.color + '">' + A.caseScene(id) + '</div>' +
            '<div class="card col" style="gap:10px"><h3 style="color:' + c.color + '">Die Besonderheit</h3><div class="big">' + c.twist + '</div></div>' +
            '</div>' +
            '<div class="grow col" style="gap:22px">' +
            '<h1>' + c.name + '</h1>' +
            mentorBox('Du hast <b>12 Monate</b>. Danach bewertet eine Investorin deine Firma. Je besser sie <b>ohne dich</b> läuft, desto mehr ist sie wert. Pleite oder Chaos-Kollaps beenden das Spiel sofort.') +
            '<div class="row" style="gap:12px;flex-wrap:wrap"><span class="chip g">Startkapital ' + eur(c.startCash) + '</span><span class="chip r">Fixkosten ' + eur(c.fix) + ' / Monat</span>' +
            '<span class="chip b">' + c.unit + ' ≈ ' + eur(c.mrr) + ' ' + c.payWord + '</span><span class="chip p">Kapazität ' + c.cap + ' ' + c.units + '</span></div>' +
            '<div class="row" style="margin-top:auto;gap:16px">' + btn('Los geht\'s!', 'start', id, { cls: 'primary', auto: true, style: 'flex:1;justify-content:center;height:80px;font-size:28px' }) + btn('Zurück', 'newgame', null, { style: 'height:80px' }) + '</div>' +
            '</div></div>';
        show(html, { back: cases });
    }
    H.start = function (id) {
        newMatch(1, [id]);
        save();
        hub();
        later(function () { toast('Monat 1 beginnt – viel Erfolg!'); }, 300);
    };

    /* ================= Übersicht (Hub) ================= */
    function hub() {
        var c = C();
        save();
        var lv = level();
        function tile(a, icon, t, s, kind, extra) {
            var chk = kind ? E.canAct(S, kind) : { ok: true };
            var cost = kind ? E.energyCost(S, kind) : 0;
            return '<button class="btn tile' + (chk.ok ? '' : ' dis') + '" data-f data-a="' + a + '"' + (chk.ok ? '' : ' data-why="' + esc(chk.why) + '"') + (extra || '') + '>' +
                A.icon(icon) + (cost ? '<span class="chip y cost">⚡ ' + cost + '</span>' : '') +
                '<div><div class="t">' + t + '</div><div class="s">' + s + '</div></div></button>';
        }
        var leadsN = S.leads.length, cap = E.cap(S);
        var tiles = '<div class="tiles">' +
            tile('acq', 'acq', c.acq, 'Neue Interessenten finden', 'acq', S.actionsLeft > 0 ? ' data-auto' : '') +
            tile('leads', 'sell', 'Verkaufen', leadsN ? plural(leadsN, 'Interessent wartet', 'Interessenten warten') : 'Niemand in der Pipeline', null) +
            tile('customers', 'care', 'Kunden', S.customers.length + ' / ' + cap + ' ' + c.units, null) +
            tile('procs', 'proc', 'Prozesse', E.procCount(S) + ' von 8 eingeführt', null) +
            tile('team', 'team', 'Team', S.staff.length ? plural(S.staff.length, 'Person', 'Leute') + ' an Bord' : 'Noch allein', null) +
            tile('rest', 'rest', 'Durchatmen', '+40 Energie', 'rest') +
            '</div>';
        var endLabel = S.actionsLeft > 0 ? 'Monat abschließen <span class="small" style="opacity:.8;margin-left:8px">(noch ' + S.actionsLeft + ' Aktion' + (S.actionsLeft > 1 ? 'en' : '') + ')</span>' : 'Monat abschließen';
        var html = hud() +
            '<div class="hub">' +
            '<div class="left">' + (duel() ? duelBar() : '') +
            (PP3D.ok ? '<div class="grow" style="position:relative"><span class="chip p lvl3d">' + lvName(lv) + '</span></div>' : '<div class="card buildcard">' + A.building(lv, c.color) + '<span class="chip p lvl">' + lvName(lv) + '</span></div>') +
            '<div class="hubtip">' + mentorBox(tip()) + '</div></div>' +
            '<div class="col" style="gap:0;min-height:0">' + tiles +
            '<div class="hubfoot">' + btn('Finanzen', 'finance', null, { icon: 'money', style: 'flex:1' }) + btn('Skills <span class="chip y" style="margin-left:4px">' + E.skillCount(S).learned + '/' + E.skillCount(S).total + '</span>', 'skills', null, { style: 'flex:1;justify-content:center' }) +
            btn(endLabel, 'endmonth', null, { cls: S.actionsLeft > 0 ? '' : 'primary', icon: 'next', style: 'flex:2.2;justify-content:center', auto: S.actionsLeft === 0 }) + '</div>' +
            '</div></div>';
        if (lvlOf(S) >= 2) E.learn(S, 'skalierung');
        show(html, { back: quitAsk, three: 'hub' });
        if (S.skillQueue && S.skillQueue.length) later(function () { skillPopup(S.skillQueue[0], true); }, 450);
    }

    /* ================= Business-Skills ================= */
    function skillDef(id) { for (var i = 0; i < D.skills.length; i++) if (D.skills[i].id === id) return D.skills[i]; return null; }
    function skillPopup(id, isNew) {
        var sk = skillDef(id); if (!sk) return;
        if (isNew) { S.skillQueue = S.skillQueue.filter(function (x) { return x !== id; }); save(); sfx('win'); }
        var mastered = (S.skills[id] || 0) >= 2;
        modal((isNew ? '<span class="chip y" style="align-self:flex-start;font-size:20px">✨ Neuer Business-Skill!</span>' : '') +
            '<div class="row" style="gap:18px;align-items:center"><div class="skillicon">' + sk.icon + '</div><h2>' + esc(sk.name) + '</h2></div>' +
            '<div class="big" style="font-size:24px;font-weight:600;line-height:1.4">' + esc(sk.text) + '</div>' +
            '<div class="row">' + (mastered ? '<span class="chip g" style="font-size:20px">★ Gemeistert</span><div class="grow"></div>' + btn('Weiter', 'skillNext', null, { cls: 'primary', auto: true }) :
                btn('Quiz: Zeig, was du weißt!', 'skillQuiz', id, { cls: 'gold', auto: true, style: 'flex:1;justify-content:center' }) + btn('Später', 'skillNext', null, { style: 'justify-content:center' })) + '</div>');
    }
    H.skillQuiz = function (id) {
        var sk = skillDef(id);
        var opts = E.shuffle(S, sk.quiz.a.map(function (t, i) { return { t: t, ok: i === 0 }; }));
        ctx.quiz = { id: id, opts: opts };
        modal('<span class="chip p" style="align-self:flex-start">' + sk.icon + ' Quiz · ' + esc(sk.name) + '</span><h2>' + esc(sk.quiz.q) + '</h2>' +
            '<div class="answers">' + opts.map(function (o, i) { return '<button class="btn" data-f data-a="quizAnswer" data-v="' + i + '"' + (i === 0 ? ' data-auto' : '') + '><span class="n">' + (i + 1) + '</span><span>' + esc(o.t) + '</span></button>'; }).join('') + '</div>');
    };
    H.quizAnswer = function (i) {
        var qz = ctx.quiz, sk = skillDef(qz.id), ok = qz.opts[+i].ok;
        if (ok) { S.skills[qz.id] = 2; S.rep = Math.min(100, S.rep + 2); sfx('win'); coins(16); } else sfx('no');
        save();
        modal('<h2 class="' + (ok ? 'good' : 'warn') + '">' + (ok ? '★ Richtig!' : 'Nicht ganz.') + '</h2>' +
            (ok ? '' : '<div class="big">Richtig ist: <b>' + esc(sk.quiz.a[0]) + '</b></div>') +
            '<div class="why big">💡 ' + esc(sk.quiz.why) + '</div>' +
            '<div class="row"><span class="chip ' + (ok ? 'g' : '') + '">' + (ok ? 'Skill gemeistert · ★ +2 Ruf' : 'Du kannst das Quiz unter „Skills“ wiederholen.') + '</span><div class="grow"></div>' + btn('Weiter', 'skillNext', null, { cls: 'primary', auto: true }) + '</div>');
    };
    H.skillNext = function () {
        closeModal();
        if (app.querySelector('.skillgrid')) return skills();
        if (S.skillQueue && S.skillQueue.length) later(function () { skillPopup(S.skillQueue[0], true); }, 250);
        else if (app.querySelector('.hub')) hub();
    };
    H.skills = function () { skills(); };
    H.skillOpen = function (id) { skillPopup(id, false); };
    function skills() {
        var k = E.skillCount(S);
        var cards = D.skills.map(function (sk, i) {
            var st = S.skills[sk.id] || 0;
            if (!st) return '<button class="btn skill dis" data-f data-a="skillOpen" data-v="' + sk.id + '" data-why="Noch nicht entdeckt – spiel weiter!"' + (i === 0 ? ' data-auto' : '') + '><div class="skillicon">?</div><div class="t">???</div><div class="s">noch nicht entdeckt</div></button>';
            return '<button class="btn skill' + (st >= 2 ? ' mastered' : '') + '" data-f data-a="skillOpen" data-v="' + sk.id + '"' + (i === 0 ? ' data-auto' : '') + '><div class="skillicon">' + sk.icon + '</div><div class="t">' + esc(sk.name) + '</div><div class="s">' + (st >= 2 ? '★ gemeistert' : 'Quiz offen') + '</div></button>';
        }).join('');
        var html = header('Deine Business-Skills', 'Entdeckt: <b>' + k.learned + ' von ' + k.total + '</b> · Gemeistert: <b class="gold">★ ' + k.mastered + '</b> – neue Skills findest du beim Spielen.', miniStatus()) +
            '<div class="skillgrid grow">' + cards + '</div>' +
            '<div class="row" style="justify-content:flex-end;gap:16px;margin-top:14px">' + btn('So geht\'s', 'helphub') + btn('Zurück zur Übersicht', 'hub', null, { cls: 'primary' }) + '</div>';
        show(html, { back: hub });
    }
    function duelBar() {
        var v = M.players.map(function (p) { return E.score(p.S); });
        var sum = Math.max(1, v[0] + v[1]), pct = Math.round(v[0] / sum * 100);
        var lead = v[0] === v[1] ? -1 : v[0] > v[1] ? 0 : 1;
        function side(i) { var p = M.players[i]; return '<div class="' + (i ? 'r' : 'l') + '"><b style="color:' + p.color + '">' + (lead === i ? '👑 ' : '') + esc(p.name) + '</b><span>' + v[i] + ' Punkte</span></div>'; }
        return '<div class="card duelbar"><div class="row" style="justify-content:space-between">' + side(0) + '<span class="mute small" style="align-self:center;text-align:center">Investoren-<br>Punkte</span>' + side(1) + '</div>' +
            '<div class="tug"><i style="width:' + pct + '%;background:' + M.players[0].color + '"></i><i style="width:' + (100 - pct) + '%;background:' + M.players[1].color + '"></i></div></div>';
    }
    function quitAsk() {
        modal('<h2>Pause</h2><div class="big mute">Dein Spielstand wird automatisch gespeichert.</div><div class="row">' + btn('Weiterspielen', 'closeModal', null, { cls: 'primary', auto: true, style: 'flex:1;justify-content:center' }) + btn('Zum Titelbild', 'title', null, { style: 'flex:1;justify-content:center' }) + '</div>');
    }
    H.hub = function () { hub(); };
    H.helphub = function () { help('hub'); };
    H.rest = function () {
        E.spendAction(S, 'rest'); E.rest(S); sfx('good');
        hub(); toast('Durchgeatmet. ⚡ +40 Energie');
    };

    /* ================= Akquise (Mini-Spiel) ================= */
    H.acq = function () {
        E.spendAction(S, 'acq');
        save();
        var c = C();
        var html = header(c.acq, c.acqDesc, miniStatus()) +
            '<div class="col grow" style="justify-content:center;gap:34px">' +
            '<div class="meter" id="meter"><div class="zone y" id="zy"></div><div class="zone g" id="zg"></div><div class="cur" id="cur"></div></div>' +
            '<div class="rounds"><div class="r" id="r0">1</div><div class="r" id="r1">2</div><div class="r" id="r2">3</div></div>' +
            '<div class="row center" style="gap:20px">' + btn('STOPP!', 'stop', null, { cls: 'gold', auto: true, style: 'width:420px;height:96px;font-size:40px;justify-content:center' }) + '</div>' +
            '<div class="center mute big" style="display:flex">Drück <b class="gold" style="margin:0 8px">OK</b>, wenn der weiße Balken im grünen Feld ist.</div>' +
            '</div>';
        show(html, { back: function () { toast('Erst zu Ende telefonieren!'); }, ctx: { round: 0, hits: [], pos: 0.05, dir: 1, locked: false } });
        startRound();
    };
    function startRound() {
        var green = (E.has(S, 'crm') ? 0.17 : 0.13);
        var yellow = 0.09;
        var gStart = 0.12 + Math.random() * (0.76 - green);
        ctx.zone = { g0: gStart, g1: gStart + green, y0: Math.max(0, gStart - yellow), y1: Math.min(1, gStart + green + yellow) };
        var zg = document.getElementById('zg'), zy = document.getElementById('zy');
        zg.style.left = (ctx.zone.g0 * 100) + '%'; zg.style.width = (green * 100) + '%';
        zy.style.left = (ctx.zone.y0 * 100) + '%'; zy.style.width = ((ctx.zone.y1 - ctx.zone.y0) * 100) + '%';
        ctx.speed = [0.75, 1.0, 1.3][ctx.round];
        ctx.locked = false;
        var cur = document.getElementById('cur');
        var last = performance.now();
        function frame(t) {
            var dt = Math.min(0.05, (t - last) / 1000); last = t;
            if (!ctx.locked) {
                ctx.pos += ctx.dir * ctx.speed * dt;
                if (ctx.pos >= 1) { ctx.pos = 1; ctx.dir = -1; }
                if (ctx.pos <= 0) { ctx.pos = 0; ctx.dir = 1; }
                cur.style.left = (ctx.pos * 100) + '%';
            }
            ctx.raf = requestAnimationFrame(frame);
        }
        ctx.raf = requestAnimationFrame(frame);
    }
    H.stop = function () {
        if (ctx.locked || ctx.round > 2) return;
        ctx.locked = true;
        var p = ctx.pos, z = ctx.zone;
        var res = (p >= z.g0 && p <= z.g1) ? 'green' : (p >= z.y0 && p <= z.y1) ? 'yellow' : 'miss';
        ctx.hits.push(res);
        var m = document.createElement('div');
        m.className = 'mark'; m.style.left = (p * 100) + '%';
        m.style.background = res === 'green' ? '#4ade80' : res === 'yellow' ? '#facc15' : '#f87171';
        document.getElementById('meter').appendChild(m);
        var r = document.getElementById('r' + ctx.round);
        r.className = 'r ' + res;
        r.textContent = res === 'green' ? 'Treffer!' : res === 'yellow' ? 'Knapp' : 'Daneben';
        sfx(res === 'green' ? 'good' : res === 'yellow' ? 'meh' : 'no');
        ctx.round += 1;
        if (ctx.round < 3) later(function () { var ms = document.querySelectorAll('.mark'); ms.forEach(function (x) { x.style.opacity = 0.35; }); startRound(); }, 650);
        else later(acqDone, 750);
    };
    function acqDone() {
        cancelAnimationFrame(ctx.raf);
        var added = E.acquire(S, ctx.hits);
        save();
        if (added.length) sfx('win');
        var faces = added.slice(0, 5).map(function (l) { return '<div class="card person">' + A.face(l.face) + '<div class="grow"><b>' + esc(l.name) + '</b><span>möchte ' + esc(l.want) + '</span></div><span class="chip">' + eur(l.price) + ' / Monat</span></div>'; }).join('');
        var res = ctx.hits.map(function (h) { return '<div class="r ' + h + '">' + (h === 'green' ? 'Treffer!' : h === 'yellow' ? 'Knapp' : 'Daneben') + '</div>'; }).join('');
        var html = header(added.length ? '+' + plural(added.length, 'neuer Interessent', 'neue Interessenten') : 'Heute keiner erreicht', added.length ? 'Ruf sie jetzt unter „Verkaufen“ an.' : 'Nur Mailboxen und Sekretariate. Morgen wird es besser.', miniStatus()) +
            '<div class="row grow" style="gap:36px;min-height:0">' +
            '<div class="col" style="width:330px;align-items:center;gap:22px">' + A.event(added.length ? 'sterne' : 'brief') + '<div class="rounds" style="flex-direction:column;align-items:center">' + res + '</div></div>' +
            '<div class="col grow" style="gap:12px">' + (faces || mentorBox('Kopf hoch! Mit dem Prozess <b>' + procName('crm') + '</b> wird das grüne Feld breiter.')) + '</div></div>' +
            '<div class="row" style="justify-content:flex-end;gap:16px">' + (S.leads.length ? btn('Zu den Interessenten', 'leads', null, { cls: 'primary', auto: true }) : '') + btn('Zur Übersicht', 'hub', null, { auto: !S.leads.length }) + '</div>';
        show(html, { back: hub });
    }

    /* ================= Verkaufen ================= */
    var callsLeft = 0;
    H.leads = function () { leads(); };
    function leads() {
        var c = C();
        var chk = E.canAct(S, 'sell');
        var canCall = callsLeft > 0 || chk.ok;
        var why = callsLeft > 0 ? '' : (chk.why || '');
        var full = S.customers.length >= E.cap(S);
        var sub = callsLeft > 0 ? '<b class="gold">Noch ' + plural(callsLeft, 'Gespräch', 'Gespräche') + ' in dieser Aktion.</b>' :
            'Ein Gespräch kostet 1 Aktion und ⚡ ' + E.energyCost(S, 'sell') + (c.salesCloses > 1 ? ' – dafür darfst du <b>' + c.salesCloses + '</b> Leute anrufen.' : '.') + ' Aussortieren ist gratis.';
        if (full) sub += ' <b class="warn">Kapazität voll!</b>';
        var cards = S.leads.map(function (l, i) {
            var hints = l.hints.map(function (h) { return '<div class="hint ' + h.t + '"><i>' + (h.t === 'green' ? '✓' : h.t === 'red' ? '!' : '•') + '</i><span>' + esc(h.x) + '</span></div>'; }).join('');
            return '<div class="card lead">' + A.face(l.face) +
                '<div class="who"><div class="name">' + esc(l.name) + '</div><div class="want">möchte ' + esc(l.want) + '</div>' +
                '<div class="price"><b class="' + (l.tier === 'L' ? 'good' : l.tier === 'S' ? 'mute' : '') + '">' + eur(l.price) + (c.duration ? ' / Mon.' : ' / Monat') + '</b> · ' + D.tiers[l.tier].label + (l.age >= 2 ? ' · <b class="bad">springt bald ab</b>' : '') + '</div></div>' +
                '<div class="hints">' + hints + '</div>' +
                '<div class="acts">' + btn('Anrufen', 'call', l.id, { cls: canCall ? 'primary' : '', dis: !canCall, why: why, auto: i === 0 && canCall }) + btn('Aussortieren', 'reject', l.id, { auto: i === 0 && !canCall }) + '</div>' +
                '</div>';
        }).join('');
        if (!S.leads.length) cards = '<div class="card">' + mentorBox('Keine Interessenten da. Geh zurück und mach <b>' + c.acq + '</b>.') + '</div>';
        var html = header('Wen rufst du an?', sub, miniStatus()) +
            '<div class="col grow" style="gap:10px">' + cards + '</div>' +
            '<div class="row" style="justify-content:flex-end;margin-top:16px">' + btn(callsLeft > 0 ? 'Fertig (Rest verfällt)' : 'Zurück zur Übersicht', 'leadsDone', null, { auto: !S.leads.length }) + '</div>';
        show(html, { back: H.leadsDone });
    }
    H.leadsDone = function () { callsLeft = 0; hub(); };
    H.reject = function (id) {
        E.rejectLead(S, +id); save();
        toast('Aussortiert.');
        leads();
    };
    H.call = function (id) {
        if (callsLeft > 0) callsLeft -= 1;
        else { E.spendAction(S, 'sell'); callsLeft = C().salesCloses - 1; }
        save();
        call(+id);
    };
    function timerSecs(base) { return Math.round(base * (learnMode ? 2 : 1)); }
    function fillQ(t, l) { return t.replace(/\{want\}/g, l.want).replace(/\{price\}/g, eur(l.price)); }
    function call(id) {
        var l = E.findLead(S, id);
        callRound({ lead: l, rounds: [E.pickNeed(S), E.pickObjection(S)], i: 0, qs: [], picked: [] });
    }
    function roundPips(st) {
        return [0, 1].map(function (k) {
            var q = st.qs[k];
            var cls = q === 'strong' ? 'g' : q === 'okay' ? 'y' : q === 'weak' ? 'r' : (k === st.i ? 'p' : '');
            return '<span class="chip ' + cls + '">' + (k === 0 ? 'Bedarf' : 'Einwand') + (q ? (q === 'strong' ? ' ✓' : q === 'okay' ? ' ~' : ' ✗') : '') + '</span>';
        }).join('');
    }
    function callRound(st) {
        var l = st.lead, item = st.rounds[st.i];
        var opts = E.shuffle(S, item.a.map(function (t, i) { return { t: fillQ(t, l), q: i === 0 ? 'strong' : i === 1 ? 'okay' : 'weak' }; }));
        st.opts = opts;
        var secs = timerSecs(10 + (E.has(S, 'crm') ? 4 : 0));
        var label = st.i === 0 ? 'Runde 1 · Bedarf erkennen' : 'Runde 2 · Einwand kontern';
        var answers = opts.map(function (a, i) { return '<button class="btn" data-f data-a="answer" data-v="' + i + '"' + (i === 0 ? ' data-auto' : '') + '><span class="n">' + (i + 1) + '</span><span>' + esc(a.t) + '</span></button>'; }).join('');
        var html = '<div class="talk">' +
            '<div class="who">' + A.face(l.face, { mood: 'neutral' }) + '<h3>' + esc(l.name) + '</h3><div class="mute">möchte ' + esc(l.want) + '</div><span class="chip">' + eur(l.price) + ' / Monat</span><div class="row" style="gap:8px;justify-content:center">' + roundPips(st) + '</div></div>' +
            '<div class="col" style="gap:16px;justify-content:center">' +
            '<div class="row" style="align-items:center;gap:14px"><span class="chip p">' + label + '</span><div class="grow timer"><i id="tbar" style="width:100%"></i></div><b id="tsec" class="big">' + secs + ' s</b></div>' +
            '<div class="speech">„' + esc(fillQ(item.q, l)) + '“</div>' +
            '<div class="answers">' + answers + '</div></div></div>';
        show(html, { back: function () { toast('Jetzt nicht auflegen!'); }, ctx: { st: st, done: false } });
        var t0 = Date.now(), total = secs * 1000;
        every(function () {
            var left = Math.max(0, total - (Date.now() - t0));
            document.getElementById('tbar').style.width = (left / total * 100) + '%';
            document.getElementById('tsec').textContent = Math.ceil(left / 1000) + ' s';
            if (left <= 3000 && left > 0 && Math.floor(left / 100) % 10 === 0) sfx('tick');
            if (left <= 0) answer(null);
        }, 100);
    }
    H.answer = function (i) { answer(+i); };
    function answer(i) {
        if (ctx.done) return;
        ctx.done = true;
        var st = ctx.st;
        var q = i === null ? 'weak' : st.opts[i].q;
        st.qs.push(q);
        st.picked.push({ q: q, timeout: i === null, best: st.opts.filter(function (o) { return o.q === 'strong'; })[0].t, why: st.rounds[st.i].why || '' });
        sfx(q === 'strong' ? 'good' : q === 'okay' ? 'meh' : 'no');
        if (st.i === 0) E.learn(S, 'bedarf');
        st.i += 1;
        if (st.i < st.rounds.length) { callRound(st); return; }
        var pts = st.qs.reduce(function (a, x) { return a + (x === 'strong' ? 2 : x === 'okay' ? 1 : 0); }, 0);
        var finalQ = pts >= 4 ? 'strong' : pts >= 2 ? 'okay' : 'weak';
        E.learn(S, 'einwand');
        var res = E.closeDeal(S, st.lead.id, finalQ);
        save();
        callResult(res, finalQ, st);
    }
    function callResult(res, q, st) {
        var c = C(), l = res.lead;
        var more = callsLeft > 0 && S.leads.length > 0;
        var head, body = '';
        if (res.signed) {
            sfx('coin'); coins(22); pending.coins += 10;
            head = '<h1 class="good">Abgeschlossen!</h1>';
            body += '<div class="big" style="font-size:25px">' + esc(l.name) + ' ist jetzt ' + (c.unit.slice(-2) === 'in' ? 'deine ' : 'dein ') + c.unit + '.</div>';
            body += '<div class="row" style="gap:12px;flex-wrap:wrap"><span class="chip g" style="font-size:21px">+' + eur(res.customer.price) + ' ' + c.payWord + '</span>' +
                (res.customer.setup ? '<span class="chip g" style="font-size:21px">+' + eur(res.customer.setup) + ' Einrichtung sofort</span>' : '') +
                (res.discount ? '<span class="chip y" style="font-size:21px">15 % Rabatt gegeben</span>' : '') +
                (res.overload ? '<span class="chip r" style="font-size:21px">Über deiner Kapazität!</span>' : '') + '</div>';
        } else {
            sfx('lose');
            head = '<h1 class="bad">Abgesprungen.</h1>';
            body += '<div class="big" style="font-size:25px">' + esc(l.name) + ' kauft nicht. Lerne aus dem Gespräch:</div>';
        }
        body += st.picked.map(function (p, k) {
            var ok = p.q === 'strong';
            return '<div class="card lesson ' + (ok ? 'ok' : '') + '"><div class="row" style="gap:10px;align-items:center"><span class="chip ' + (ok ? 'g' : p.q === 'okay' ? 'y' : 'r') + '">' + (k === 0 ? 'Bedarf' : 'Einwand') + (ok ? ' ✓ stark' : p.timeout ? ' ✗ zu langsam' : p.q === 'okay' ? ' ~ geht so' : ' ✗ schwach') + '</span>' +
                (ok ? '' : '<span class="small mute">Besser:</span> <b class="small">„' + esc(p.best) + '“</b>') + '</div>' +
                (p.why ? '<div class="why">💡 ' + esc(p.why) + '</div>' : '') + '</div>';
        }).join('');
        var html = '<div class="row grow" style="gap:36px;align-items:center">' +
            '<div style="width:250px">' + A.face(l.face, { mood: res.signed ? 'grin' : 'neutral' }) + '</div>' +
            '<div class="grow col" style="gap:14px">' + head + body + '</div></div>' +
            '<div class="row" style="justify-content:flex-end;gap:16px">' + (more ? btn('Nächstes Gespräch (' + callsLeft + ')', 'leads', null, { cls: 'primary', auto: true }) : '') + btn('Zur Übersicht', 'leadsDone', null, { auto: !more, cls: more ? '' : 'primary' }) + '</div>';
        show(html, { back: H.leadsDone });
    }

    /* ================= Prozesse ================= */
    H.procs = function () { procs(); };
    function procs() {
        var chk = E.canAct(S, 'proc');
        var cards = D.procOrder.map(function (id, i) {
            var p = D.procs[id], st = E.procState(S, id);
            var built = st.state === 'built';
            var dis = !built && (st.state !== 'open' || !chk.ok);
            var why = st.why || chk.why || '';
            var price = built ? '<span class="chip g">Läuft seit Monat ' + S.procs[id] + '</span>' :
                '<span class="chip ' + (S.cash >= E.procCost(S, id) ? '' : 'r') + '">' + eur(E.procCost(S, id)) + ' einmalig</span>' + (p.upkeep ? '<span class="chip r">' + eur(E.procUpkeep(S, id)) + ' / Monat</span>' : '');
            if (st.state === 'locked') price = '<span class="chip">🔒 ' + esc(st.why) + '</span>';
            return '<button class="btn proc' + (built ? ' built' : '') + (dis ? ' dis' : '') + '" data-f data-a="build" data-v="' + id + '"' + (dis ? ' data-why="' + esc(why) + '"' : '') + (built ? ' data-why="Läuft bereits."' : '') + (i === 0 ? ' data-auto' : '') + '>' +
                (built ? '<span class="ok">' + A.icon('check') + '</span>' : '') +
                '<div class="t">' + esc(procName(id)) + '</div><div class="fx">' + procFx(id) + '</div><div class="price">' + price + '</div></button>';
        }).join('');
        var html = header('Prozesse & Systeme', 'Einmal einführen (1 Aktion, ⚡ ' + E.energyCost(S, 'proc') + '), dann wirken sie jeden Monat.', miniStatus()) +
            '<div class="grid4 grow" style="grid-template-rows:repeat(2,minmax(0,1fr))">' + cards + '</div>' +
            '<div class="row" style="justify-content:flex-end;margin-top:16px">' + btn('Zurück zur Übersicht', 'hub') + '</div>';
        show(html, { back: hub });
    }
    H.build = function (id) {
        if (S.procs[id]) { toast('Läuft bereits.'); return; }
        E.spendAction(S, 'proc'); E.buildProc(S, id); save();
        sfx('win');
        procs();
        toast('Eingeführt: <b>' + esc(procName(id)) + '</b>');
    };

    /* ================= Team ================= */
    H.team = function () { team(); };
    function team() {
        var c = C();
        var chk = E.canAct(S, 'hire');
        var poor = S.cash < E.hireFee(S);
        var hires = D.roleOrder.map(function (r, i) {
            var sal = E.salaryOf(S, r);
            var dis = !chk.ok || poor;
            return '<button class="btn proc' + (dis ? ' dis' : '') + '" data-f data-a="hire" data-v="' + r + '"' + (dis ? ' data-why="' + esc(chk.why || 'Zu wenig Geld.') + '"' : '') + (i === 0 ? ' data-auto' : '') + '>' +
                '<div class="t">' + esc(c.roles[r]) + ' einstellen</div><div class="fx">' + D.roles[r].fx + '</div>' +
                '<div class="price"><span class="chip r">' + eur(sal) + ' / Monat</span><span class="chip">' + eur(E.hireFee(S)) + ' Startkosten</span></div></button>';
        }).join('');
        var roster = S.staff.map(function (m) {
            return '<div class="card person">' + A.face(m.face) + '<div class="grow"><b>' + esc(m.name) + '</b><span>' + esc(c.roles[m.role]) + ' · ' + eur(m.salary) + '</span></div>' + btn('Entlassen', 'fireAsk', m.id, { cls: 'danger', style: 'padding:8px 14px;font-size:17px' }) + '</div>';
        }).join('');
        if (!roster) roster = '<div class="card" style="grid-column:1/-1">' + mentorBox('Noch machst du alles selbst. Jede Person kostet jeden Monat Gehalt – lohnt sich aber, wenn genug Arbeit da ist.') + '</div>';
        var html = header('Dein Team', 'Einstellen kostet 1 Aktion (⚡ ' + E.energyCost(S, 'hire') + ') und ' + eur(E.hireFee(S)) + '. Max. ' + D.maxStaff + ' Leute.', miniStatus()) +
            '<div class="grid3" style="height:200px">' + hires + '</div>' +
            '<h3 style="margin:22px 0 12px">An Bord (' + S.staff.length + '/' + D.maxStaff + ') · Gehälter ' + eur(E.salaries(S)) + ' / Monat</h3>' +
            '<div class="grid3 grow" style="align-content:start">' + roster + '</div>' +
            '<div class="row" style="justify-content:flex-end;margin-top:12px">' + btn('Zurück zur Übersicht', 'hub') + '</div>';
        show(html, { back: hub });
    }
    H.hire = function (r) {
        E.spendAction(S, 'hire');
        var m = E.hire(S, r); save();
        sfx('win'); team();
        toast('Willkommen im Team, <b>' + esc(m.name) + '</b>!');
    };
    H.fireAsk = function (id) {
        var m = S.staff.filter(function (x) { return x.id === +id; })[0];
        if (!m) return;
        modal('<h2>' + esc(m.name) + ' entlassen?</h2><div class="big">Abfindung: <b>' + eur(m.salary) + '</b> (ein Monatsgehalt). Das Team ist danach etwas verunsichert (+3 Chaos).</div>' +
            '<div class="row">' + btn('Behalten', 'closeModal', null, { cls: 'primary', auto: true, style: 'flex:1;justify-content:center' }) + btn('Entlassen', 'fire', m.id, { cls: 'danger', style: 'flex:1;justify-content:center' }) + '</div>');
    };
    H.fire = function (id) { E.fire(S, +id); save(); closeModal(); team(); toast('Ihr geht getrennte Wege.'); };

    /* ================= Kunden ================= */
    H.customers = function () { customers(); };
    function customers() {
        var c = C(), cap = E.cap(S), n = S.customers.length;
        var chk = E.canAct(S, 'care');
        var list = S.customers.slice(0, 11).map(function (k) {
            return '<div class="card person">' + A.face(k.face) + '<div class="grow"><b>' + esc(k.name) + '</b><span>' + eur(k.price) + ' / Monat' + (k.left ? ' · noch ' + k.left + ' Mon.' : '') + '</span></div></div>';
        }).join('');
        if (n > 11) list += '<div class="card person center"><b>+' + (n - 11) + ' weitere</b></div>';
        if (!n) list = '<div class="card" style="grid-column:1/-1">' + mentorBox('Noch keine ' + c.units + '. Ab zum Verkaufen!') + '</div>';
        var pct = Math.min(100, Math.round(n / Math.max(1, cap) * 100));
        var html = header('Deine ' + c.units, n + ' von ' + cap + ' Plätzen belegt' + (n > cap ? ' – <b class="bad">überlastet!</b>' : '') + ' · Umsatz ' + eur(E.mrr(S)) + ' / Monat', miniStatus()) +
            '<div class="row grow" style="gap:22px;min-height:0">' +
            '<div class="grid3 grow" style="align-content:start;grid-auto-rows:84px">' + list + '</div>' +
            '<div class="col" style="width:340px">' +
            '<div class="card col" style="gap:10px"><div class="mute" style="font-weight:800">AUSLASTUNG</div><div class="bar" style="height:18px"><i style="width:' + pct + '%;background:' + (n > cap ? '#ef4444' : n === cap ? '#f59e0b' : '#22c55e') + '"></i></div><div class="small mute">Kapazität erhöhen: Fachkräfte einstellen oder Prozesse einführen.</div></div>' +
            '<div class="card col" style="gap:12px"><h3>' + esc(c.care) + '</h3><div class="small mute">−20 Chaos, +6 Ruf, und diesen Monat kündigen nur halb so viele.</div>' +
            btn('Jetzt pflegen <span class="chip y" style="margin-left:auto">⚡ ' + E.energyCost(S, 'care') + '</span>', 'care', null, { cls: chk.ok ? 'primary' : '', dis: !chk.ok, why: chk.why, auto: true, style: 'width:100%' }) + '</div>' +
            btn('Zurück zur Übersicht', 'hub', null, { style: 'width:100%;justify-content:center' }) +
            '</div></div>';
        show(html, { back: hub });
    }
    H.care = function () {
        if (S.cared) { toast('Diesen Monat schon erledigt – trotzdem gut!'); }
        E.spendAction(S, 'care'); E.care(S); save(); sfx('good');
        customers(); toast('Deine ' + C().units + ' fühlen sich gut betreut. 🌀 −20, ★ +6');
    };

    /* ================= Finanzen ================= */
    H.finance = function () { finance(); };
    function finance() {
        E.learn(S, 'liquiditaet');
        var c = C(), f = E.forecast(S);
        var rows = '<tr><td>Kontostand jetzt</td><td>' + eur(S.cash) + '</td></tr>' +
            '<tr><td>Laufende Einnahmen</td><td class="good">' + sgn(f.rec, '€') + '</td></tr>' +
            (f.variable ? '<tr><td>' + (c.id === 'handwerk' ? 'Material' : c.id === 'roesterei' ? 'Rohkaffee & Verpackung' : 'Server & Gebühren') + '</td><td class="bad">' + sgn(-f.variable, '€') + '</td></tr>' : '') +
            '<tr><td>Fixkosten (Miete, Versicherung …)</td><td class="bad">' + sgn(-f.fixed, '€') + '</td></tr>' +
            (f.salaries ? '<tr><td>Gehälter</td><td class="bad">' + sgn(-f.salaries, '€') + '</td></tr>' : '') +
            (f.upkeep ? '<tr><td>Laufende Prozess-Kosten</td><td class="bad">' + sgn(-f.upkeep, '€') + '</td></tr>' : '') +
            (f.interest ? '<tr><td>Kreditzinsen</td><td class="bad">' + sgn(-f.interest, '€') + '</td></tr>' : '') +
            '<tr><td>Steuern (' + Math.round(E.taxRate(S) * 100) + ' % vom Gewinn)</td><td class="bad">' + sgn(-f.tax, '€') + '</td></tr>' +
            '<tr class="sum"><td>Kontostand am Monatsende</td><td class="' + (f.cashAfter < 0 ? 'bad' : 'good') + '">' + eur(f.cashAfter) + '</td></tr>';
        // Verlauf
        var hist = S.history.concat([{ m: S.month, cash: f.cashAfter, prog: true }]);
        var max = Math.max.apply(null, hist.map(function (h) { return Math.abs(h.cash); }).concat([1000]));
        var bars = hist.slice(-12).map(function (h) {
            var hgt = Math.max(4, Math.round(Math.abs(h.cash) / max * 100));
            return '<div class="col" style="gap:4px;align-items:center;flex:1"><div style="height:104px;display:flex;align-items:flex-end"><div style="width:30px;height:' + hgt + 'px;border-radius:8px;background:' + (h.cash < 0 ? '#ef4444' : h.prog ? 'repeating-linear-gradient(45deg,#22c55e,#22c55e 6px,#166534 6px,#166534 12px)' : '#22c55e') + '"></div></div><span class="small mute">' + h.m + '</span></div>';
        }).join('');
        var html = header('Finanzen', 'Prognose fürs Monatsende mit heutigem Kundenstand.', miniStatus()) +
            '<div class="row grow" style="gap:22px;min-height:0">' +
            '<div class="card grow"><table class="tbl">' + rows + '</table></div>' +
            '<div class="col" style="width:470px">' +
            '<div class="card"><div class="mute" style="font-weight:800;margin-bottom:6px">KONTOSTAND JE MONAT</div><div class="row" style="gap:6px;align-items:flex-end">' + bars + '</div></div>' +
            '<div class="card col" style="gap:12px"><div class="row" style="align-items:center"><h3 class="grow">Kredit</h3><b class="big ' + (S.loan ? 'warn' : '') + '">' + eur(S.loan) + '</b></div><div class="small mute">2 % Zinsen/Monat, max. ' + eur(E.loanMax(S)) + '. Kostet keine Aktion.</div>' +
            '<div class="row" style="gap:12px">' + btn('+' + eur(E.loanStep(S)) + ' leihen', 'loan', null, { dis: S.loan >= E.loanMax(S), why: 'Mehr gibt die Bank nicht.', style: 'flex:1;justify-content:center;font-size:19px', auto: f.cashAfter < 0 }) + btn(eur(E.loanStep(S)) + ' tilgen', 'repay', null, { dis: S.loan <= 0 || S.cash < E.loanStep(S), why: S.loan <= 0 ? 'Kein Kredit offen.' : 'Zu wenig Geld.', style: 'flex:1;justify-content:center;font-size:19px' }) + '</div></div>' +
            btn('Zurück zur Übersicht', 'hub', null, { auto: f.cashAfter >= 0, style: 'justify-content:center' }) +
            '</div></div>';
        show(html, { back: hub });
    }
    H.loan = function () { E.takeLoan(S); save(); sfx('coin'); finance(); toast('Die Bank überweist ' + eur(E.loanStep(S)) + '.'); };
    H.repay = function () { E.repayLoan(S); save(); sfx('good'); finance(); toast(eur(E.loanStep(S)) + ' getilgt.'); };

    /* ================= Monat abschließen ================= */
    H.endmonth = function () {
        var f = E.forecast(S);
        var warn = '';
        if (f.cashAfter < 0) warn += '<div class="card" style="border-color:#7f1d1d;background:#2a0b0e"><b class="bad big">Am Monatsende fehlen dir ' + eur(-f.cashAfter) + '.</b><div class="mute">Ohne Kredit bist du pleite – und das Spiel ist vorbei.</div></div>';
        if (S.actionsLeft > 0) warn += '<div class="big">Du hast noch <b class="gold">' + plural(S.actionsLeft, 'Aktion', 'Aktionen') + '</b> übrig. Die verfallen.</div>';
        if (!warn) return goEnd();
        modal('<h2>Monat abschließen?</h2>' + warn + '<div class="row" style="flex-wrap:wrap">' +
            btn('Weiter spielen', 'closeModal', null, { cls: 'primary', auto: true, style: 'flex:1;justify-content:center' }) +
            (f.cashAfter < 0 ? btn('Zu den Finanzen', 'finance', null, { style: 'flex:1;justify-content:center' }) : '') +
            btn('Abschließen', 'goEnd', null, { cls: 'danger', style: 'flex:1;justify-content:center' }) + '</div>');
    };
    H.goEnd = function () { goEnd(); };
    function goEnd() {
        callsLeft = 0;
        if (E.isBossMonth(S)) bossIntro(); else eventScreen();
    }

    /* ================= Ereignis ================= */
    function eventScreen() {
        var inst = E.pickEvent(S, duel() ? rivalP().S : null);
        var ev = inst.def;
        var firstOk = -1;
        var choices = ev.choices.map(function (ch, i) {
            var ok = E.choiceAllowed(S, ch);
            if (ok && firstOk < 0) firstOk = i;
            return btn('<span>' + esc(E.fill(inst, ch.label)) + '</span>' + (ch.req ? '<span class="chip ' + (ok ? 'g' : '') + ' req">' + (ok ? '✓ ' : '🔒 ') + esc(procName(ch.req)) + '</span>' : ''), 'choose', i,
                { dis: !ok, why: 'Dafür brauchst du den Prozess „' + procName(ch.req || 'crm') + '“.', cls: ch.req && ok ? 'primary' : '' });
        }).join('');
        var html = '<div class="event">' + A.event(ev.art) +
            '<div class="col" style="gap:20px"><div><span class="chip ' + (ev.duel ? 'r' : 'p') + '">' + (ev.duel ? '⚔ Duell-Ereignis' : 'Ereignis') + ' · Monat ' + S.month + '</span></div><h1 style="font-size:52px">' + esc(E.fill(inst, ev.title)) + '</h1>' +
            '<div class="big" style="font-size:26px;font-weight:600">' + esc(E.fill(inst, ev.text)) + '</div>' +
            '<div class="choices">' + choices + '</div></div></div>';
        show(html, { back: function () { toast('Du musst dich entscheiden!'); }, ctx: { inst: inst } });
        sfx('boss');
        var allBtns = app.querySelectorAll('.choices [data-f]');
        setFocus(allBtns[Math.max(0, firstOk)]);
    }
    H.choose = function (i) {
        var inst = ctx.inst;
        var res = E.resolveChoice(S, inst, +i);
        save();
        var good = res.effects.some(function (f) { return (f.k === 'cash' && f.v > 0) || f.k === 'custNew' || f.k === 'leads'; });
        sfx(good ? 'good' : 'meh');
        var html = '<div class="event">' + A.event(inst.def.art) +
            '<div class="col" style="gap:22px"><span class="chip p" style="align-self:flex-start">Ergebnis</span><h2>' + esc(E.fill(inst, inst.def.choices[+i].label)) + '</h2>' +
            '<div class="big" style="font-size:28px;font-weight:700">' + esc(res.text) + '</div>' +
            '<div class="row" style="gap:10px;flex-wrap:wrap">' + fxChips(res.effects) + '</div>' +
            '<div>' + btn('Zur Monatsabrechnung', 'monthEnd', null, { cls: 'primary', auto: true, icon: 'next' }) + '</div></div></div>';
        show(html, { back: monthEnd });
    };

    /* ================= Bewährungsprobe ================= */
    function bossIntro() {
        var b = E.boss(S);
        sfx('boss');
        var has = E.has(S, b.bonusProc);
        var html = '<div class="talk" style="grid-template-columns:380px 1fr;align-items:center">' +
            '<div class="who">' + A.boss(b.id) + '<h3>' + esc(b.name) + '</h3><div class="mute big">' + esc(b.role) + '</div></div>' +
            '<div class="col" style="gap:22px"><span class="chip r" style="align-self:flex-start;font-size:20px">⚔ Bewährungsprobe · Monat ' + S.month + '</span><h1>' + esc(b.title) + '</h1>' +
            '<div class="big" style="font-size:26px;font-weight:600">' + esc(E.moneyText(S, b.intro)) + '</div>' +
            '<div class="card">' + (has ? '<b class="good">Vorteil:</b> Dein Prozess „' + esc(procName(b.bonusProc)) + '“ hilft dir hier.' : '<b class="warn">Tipp:</b> Mit dem Prozess „' + esc(procName(b.bonusProc)) + '“ hättest du hier einen Vorteil.') + ' <span class="mute">Drei Fragen, wenig Zeit.</span></div>' +
            '<div>' + btn('Stell dich der Herausforderung', 'bossGo', null, { cls: 'gold', auto: true, style: 'height:80px;font-size:26px' }) + '</div></div></div>';
        show(html, { back: function () { toast('Kneifen gilt nicht!'); }, ctx: { boss: b } });
    }
    H.bossGo = function () {
        var b = ctx.boss;
        bossRound({ boss: b, rounds: E.bossRounds(S, b), qs: [], i: 0 });
    };
    function bossRound(st) {
        var b = st.boss, r = st.rounds[st.i];
        var secs = timerSecs(12);
        var pips = st.rounds.map(function (x, k) {
            var q = st.qs[k];
            var cls = q === 'strong' ? 'g' : q === 'okay' ? 'y' : q === 'weak' ? 'r' : '';
            return '<span class="chip ' + cls + '">Runde ' + (k + 1) + (q ? (q === 'strong' ? ' ✓' : q === 'okay' ? ' ~' : ' ✗') : '') + '</span>';
        }).join('');
        var answers = r.opts.map(function (a, i) { return '<button class="btn" data-f data-a="bossAnswer" data-v="' + i + '"' + (i === 0 ? ' data-auto' : '') + '><span class="n">' + (i + 1) + '</span><span>' + esc(a.text) + '</span></button>'; }).join('');
        var html = '<div class="talk">' +
            '<div class="who">' + A.boss(b.id) + '<h3>' + esc(b.name) + '</h3><div class="row" style="gap:8px;flex-wrap:wrap;justify-content:center">' + pips + '</div></div>' +
            '<div class="col" style="gap:18px;justify-content:center">' +
            '<div class="row" style="align-items:center;gap:14px"><span class="chip r">' + esc(b.title) + '</span><div class="grow timer"><i id="tbar" style="width:100%"></i></div><b id="tsec" class="big">' + secs + ' s</b></div>' +
            '<div class="speech">„' + esc(r.q) + '“</div><div class="answers">' + answers + '</div></div></div>';
        show(html, { back: function () { toast('Kneifen gilt nicht!'); }, ctx: { bst: st, done: false } });
        var t0 = Date.now(), total = secs * 1000;
        every(function () {
            var left = Math.max(0, total - (Date.now() - t0));
            document.getElementById('tbar').style.width = (left / total * 100) + '%';
            document.getElementById('tsec').textContent = Math.ceil(left / 1000) + ' s';
            if (left <= 0) bossAnswer(null);
        }, 100);
    }
    H.bossAnswer = function (i) { bossAnswer(+i); };
    function bossAnswer(i) {
        if (ctx.done) return;
        ctx.done = true;
        var st = ctx.bst;
        var q = i === null ? 'weak' : st.rounds[st.i].opts[i].q;
        st.qs.push(q);
        sfx(q === 'strong' ? 'good' : q === 'okay' ? 'meh' : 'no');
        st.i += 1;
        if (st.i < st.rounds.length) bossRound(st);
        else bossResult(st);
    }
    function bossResult(st) {
        var b = st.boss;
        var r = E.resolveBoss(S, b, st.qs);
        save();
        sfx(r.res === 'win' ? 'win' : r.res === 'mid' ? 'meh' : 'lose');
        if (r.res === 'win') coins(26);
        var headTxt = r.res === 'win' ? '<h1 class="good">Bestanden!</h1>' : r.res === 'mid' ? '<h1 class="warn">Knapp.</h1>' : '<h1 class="bad">Autsch.</h1>';
        var html = '<div class="talk" style="grid-template-columns:380px 1fr;align-items:center">' +
            '<div class="who">' + A.boss(b.id) + '<h3>' + esc(b.name) + '</h3></div>' +
            '<div class="col" style="gap:22px">' + headTxt +
            '<div class="big" style="font-size:28px;font-weight:700">' + esc(r.text) + '</div>' +
            '<div class="row" style="gap:10px;flex-wrap:wrap"><span class="chip">Punkte ' + r.score + ' / ' + (r.bonus ? 7 : 6) + '</span>' + (r.bonus ? '<span class="chip g">+1 durch „' + esc(procName(b.bonusProc)) + '“</span>' : '') + fxChips(r.effects) + '</div>' +
            '<div>' + btn('Zur Monatsabrechnung', 'monthEnd', null, { cls: 'primary', auto: true, icon: 'next' }) + '</div></div></div>';
        show(html, { back: monthEnd });
    }

    /* ================= Monatsabrechnung ================= */
    H.monthEnd = function () { monthEnd(); };
    function monthEnd() {
        var c = C();
        var rep = E.endMonth(S);
        var m = rep.money;
        var rows = '<tr><td>Kontostand vorher</td><td>' + eur(m.cash0) + '</td></tr>' +
            '<tr><td>Laufende Einnahmen</td><td class="good">' + sgn(m.rec, '€') + '</td></tr>' +
            (m.variable ? '<tr><td>' + (c.id === 'handwerk' ? 'Material' : c.id === 'roesterei' ? 'Rohkaffee' : 'Server & Gebühren') + '</td><td class="bad">' + sgn(-m.variable, '€') + '</td></tr>' : '') +
            '<tr><td>Fixkosten</td><td class="bad">' + sgn(-m.fixed, '€') + '</td></tr>' +
            (m.salaries ? '<tr><td>Gehälter</td><td class="bad">' + sgn(-m.salaries, '€') + '</td></tr>' : '') +
            (m.upkeep ? '<tr><td>Prozess-Kosten</td><td class="bad">' + sgn(-m.upkeep, '€') + '</td></tr>' : '') +
            (m.interest ? '<tr><td>Zinsen</td><td class="bad">' + sgn(-m.interest, '€') + '</td></tr>' : '') +
            '<tr><td>Steuern</td><td class="bad">' + sgn(-m.tax, '€') + '</td></tr>' +
            '<tr class="sum"><td>Kontostand</td><td class="' + (m.cash < 0 ? 'bad' : 'good') + '">' + eur(m.cash) + '</td></tr>';
        var news = [];
        rep.autoSales.forEach(function (a) { news.push(a.ok ? ['g', '+', 'Dein Vertrieb hat ' + a.name + ' gewonnen (+' + eur(a.price) + ').'] : ['y', '–', a.name + ' hat deinem Vertrieb abgesagt.']); });
        rep.finished.forEach(function (n) { news.push(['b', '✓', 'Auftrag für ' + n + ' abgeschlossen.']); });
        rep.unpaid.forEach(function (n) { news.push(['r', '€', n + ' hat nicht gezahlt. Ein schwieriger Kunde …']); });
        rep.churned.forEach(function (n) { news.push(['r', '✗', n + ' hat gekündigt.']); });
        rep.notes.forEach(function (n) { news.push(['r', '!', n.x]); });
        var dc = rep.chaos.to - rep.chaos.from;
        news.push([dc > 0 ? (rep.chaos.to >= 70 ? 'r' : 'y') : 'g', '🌀', dc === 0 ? 'Chaos bleibt bei ' + rep.chaos.to + '.' : 'Chaos ' + (dc > 0 ? 'steigt' : 'sinkt') + ' auf ' + rep.chaos.to + (rep.chaos.to >= 70 ? ' – gefährlich!' : '.')]);
        var dr = rep.rep.to - rep.rep.from;
        if (dr) news.push([dr > 0 ? 'g' : 'r', '★', 'Ruf ' + (dr > 0 ? 'steigt' : 'sinkt') + ' auf ' + rep.rep.to + '.']);
        news.push(['b', '⚡', 'Erholt: Energie jetzt ' + rep.energy.to + '.']);
        var verdict = rep.over ? '' : m.profit < 0 ? 'Ein Minus von <b>' + eur(-m.profit) + '</b>. Das hält dein Konto nicht ewig aus – mehr verkaufen oder Kosten senken.' :
            S.chaos >= 70 ? 'Geld ist da, aber das Chaos wird gefährlich. Bei 100 bricht alles zusammen!' :
            S.customers.length > E.cap(S) ? 'Mehr ' + c.units + ' als Kapazität – das kostet Ruf und Nerven. Stock auf!' :
            'Plus gemacht! Jetzt das Wachstum absichern: Prozesse bauen, damit nicht alles an dir hängt.';
        if (S.month === E.MONTHS && !rep.over) verdict = 'Das war das letzte Monat. Jetzt schaut die Investorin auf deine Zahlen …';
        var shown = news.slice(0, verdict ? 5 : 8);
        var newsHtml = shown.map(function (n) { return '<div class="n ' + n[0] + '"><i>' + n[1] + '</i><span>' + esc(n[2]) + '</span></div>'; }).join('') + (news.length > shown.length ? '<div class="mute">… und ' + (news.length - shown.length) + ' weitere Meldungen</div>' : '') + (verdict ? '<div style="margin-top:auto">' + mentorBox(verdict) + '</div>' : '');
        var next;
        if (m.profit > 0) pending.coins += Math.min(14, 3 + Math.round(m.profit / 3000));
        if (rep.over) next = btn('Weiter', duel() ? 'duelOver' : 'gameover', null, { cls: 'danger', auto: true });
        else if (duel() && M.cur === 0) next = btn('Übergabe an ' + esc(M.players[1].name), 'nextTurn', null, { cls: 'primary', auto: true, icon: 'next' });
        else if (S.month >= E.MONTHS) next = btn(duel() ? 'Zur großen Bewertung' : 'Zur Jahresbewertung', duel() ? 'duelFinal' : 'final', null, { cls: 'gold', auto: true, icon: 'star' });
        else if (duel()) next = btn('Monat ' + (S.month + 1) + ': ' + esc(M.players[0].name) + ' ist dran', 'nextTurn', null, { cls: 'primary', auto: true, icon: 'next' });
        else next = btn('Monat ' + (S.month + 1) + ' starten', 'nextMonth', null, { cls: 'primary', auto: true, icon: 'next' });
        var html = header((duel() ? '<span style="color:' + me().color + '">' + esc(me().name) + '</span> · ' : '') + 'Abrechnung Monat ' + S.month, m.profit >= 0 ? 'Gewinn vor Steuern: <b class="good">' + eur(m.profit) + '</b>' : 'Verlust: <b class="bad">' + eur(m.profit) + '</b>') +
            '<div class="row grow" style="gap:22px;min-height:0"><div class="card" style="width:560px"><table class="tbl">' + rows + '</table></div>' +
            '<div class="card grow news">' + newsHtml + '</div></div>' +
            '<div class="row" style="justify-content:flex-end;margin-top:16px">' + next + '</div>';
        show(html, { back: function () { act(app.querySelector('[data-auto]')); } });
        if (!rep.over) save();
        if (m.profit > 0) sfx('coin');
    }
    H.nextMonth = function () {
        var info = E.startMonth(S);
        save();
        hub();
        var msg = [];
        if (info.passive) msg.push('+' + plural(info.passive, 'Interessent', 'Interessenten') + ' von allein');
        if (info.expired.length) msg.push(plural(info.expired.length, 'Interessent ist', 'Interessenten sind') + ' abgesprungen');
        later(function () { toast('<b>Monat ' + S.month + '</b>' + (msg.length ? ' · ' + msg.join(' · ') : '')); }, 250);
    };

    function monthNews(info) {
        var msg = [];
        if (info.passive) msg.push('+' + plural(info.passive, 'Interessent', 'Interessenten') + ' von allein');
        if (info.expired.length) msg.push(plural(info.expired.length, 'Interessent ist', 'Interessenten sind') + ' abgesprungen');
        return msg.join(' · ');
    }
    H.nextTurn = function () {
        if (M.cur === 0) {
            M.cur = 1;
        } else {
            M.cur = 0;
            M.players.forEach(function (p) { p.news = monthNews(E.startMonth(p.S)); });
        }
        S = me().S;
        save();
        handover();
    };
    function handover() {
        var p = me(), c = C();
        callsLeft = 0;
        var html = '<div class="handover">' +
            '<div class="col center" style="gap:8px"><div class="chip" style="font-size:22px;padding:8px 20px">Monat ' + S.month + ' von ' + E.MONTHS + (E.isBossMonth(S) ? ' · ⚔ Bewährungsprobe' : '') + '</div>' +
            '<h1 class="who" style="color:' + p.color + '">' + esc(p.name) + ' ist dran!</h1>' +
            '<div class="big" style="font-size:28px;font-weight:700">' + esc(c.name) + ' · ' + eur(S.cash) + ' auf dem Konto' + (p.news ? ' · ' + esc(p.news) : '') + '</div></div>' +
            '<div class="row" style="gap:24px;align-items:center"><div style="width:640px">' + duelBar() + '</div>' +
            btn('Los geht\'s!', 'hub', null, { cls: 'gold', auto: true, style: 'height:84px;font-size:30px;padding:0 50px' }) + '</div>' +
            '</div>';
        show(html, { back: quitAsk, three: 'handover', cls: 'clear' });
        sfx('boss');
        p.news = null;
    }

    /* ================= Spielende ================= */
    H.gameover = function () {
        var c = C(), why = S.over;
        clearSave();
        sfx('lose');
        var title = why === 'pleite' ? 'PLEITE' : 'CHAOS-KOLLAPS';
        var txt = why === 'pleite' ? 'Das Konto ist im Minus. Die Bank zieht den Stecker – mitten in Monat ' + S.month + '.' : 'Alles brennt, keiner weiß mehr, was zu tun ist. Kunden springen ab, das Team kündigt.';
        var lesson = why === 'pleite' ? 'Behalte die <b>Finanzen</b> im Blick: Die Prognose zeigt dir vorher, ob es reicht. Ein Kredit kann dich retten.' : 'Wachstum ohne Prozesse erzeugt Chaos. <b>' + esc(c.procs.delivery) + '</b> und <b>' + esc(c.procs.handbook) + '</b> halten es klein.';
        var html = '<div class="row grow" style="gap:40px;align-items:center">' +
            '<div style="width:420px">' + A.event(why === 'pleite' ? 'geld' : 'fire') + '</div>' +
            '<div class="grow col" style="gap:22px"><h1 class="bad" style="font-size:84px">' + title + '</h1><div class="big" style="font-size:28px;font-weight:700">' + txt + '</div>' +
            mentorBox(lesson) +
            '<div class="row" style="gap:16px">' + btn('Nochmal: ' + esc(c.name), 'start', c.id, { cls: 'primary', auto: true }) + btn('Anderes Business', 'newgame') + '</div></div></div>';
        show(html, { back: title_ });
    };
    function title_() { title(); }
    H.final = function () {
        var c = C(), v = E.valuation(S);
        var rank = D.ranks[v.stars];
        clearSave();
        var best = getBest();
        var record = !best[c.id] || v.total > best[c.id].value;
        if (record) { best[c.id] = { value: v.total, stars: Math.max(v.stars, best[c.id] ? best[c.id].stars : 0) }; setBest(best); }
        sfx('win'); if (v.stars >= 2) coins(40);
        var stars = '';
        for (var i = 0; i < 3; i++) stars += '<svg class="ic' + (i < v.stars ? ' on' : '') + '" viewBox="0 0 100 100"><path d="M50 8 L62 38 L94 38 L68 58 L78 90 L50 70 L22 90 L32 58 L6 38 L38 38 Z" fill="currentColor"/></svg>';
        var rows = '<tr><td>Kontostand</td><td>' + eur(v.cash) + '</td></tr>' +
            (v.loan ? '<tr><td>Offener Kredit</td><td class="bad">' + sgn(-v.loan, '€') + '</td></tr>' : '') +
            '<tr><td>Laufender Gewinn × 12</td><td>' + eur(v.annual) + '</td></tr>' +
            '<tr><td>System-Faktor (' + E.procCount(S) + ' Prozesse)</td><td>× ' + v.sys.toFixed(2).replace('.', ',') + '</td></tr>' +
            '<tr><td>Ruf-Faktor (Ruf ' + S.rep + ')</td><td>× ' + v.repF.toFixed(2).replace('.', ',') + '</td></tr>' +
            '<tr><td>Urteil der Investorin</td><td>× ' + v.inv.toFixed(2).replace('.', ',') + '</td></tr>' +
            '<tr class="sum"><td>Firmenwert</td><td class="gold">' + eur(v.total) + '</td></tr>';
        var nextT = v.stars < 3 ? '<div class="small mute">Nächster Stern ab ' + eur(c.stars[v.stars]) + '</div>' : '';
        var html = '<div class="row grow" style="gap:30px;min-height:0">' +
            '<div class="col" style="width:470px">' + (PP3D.ok ? '<div class="grow"></div>' : '<div class="card buildcard" style="height:330px">' + A.building(level(), c.color) + '<span class="chip p lvl">' + lvName(level()) + '</span></div>') +
            '<div class="row" style="gap:10px;flex-wrap:wrap"><span class="chip g">' + S.signedTotal + ' gewonnen</span><span class="chip r">' + S.lostTotal + ' verloren</span><span class="chip b">' + S.staff.length + ' im Team</span><span class="chip p">' + E.procCount(S) + ' Prozesse</span><span class="chip y">' + E.skillCount(S).learned + '/' + E.skillCount(S).total + ' Skills · ★ ' + E.skillCount(S).mastered + '</span></div>' +
            mentorBox(rank.d) + '</div>' +
            '<div class="grow col" style="gap:14px"><div class="row" style="align-items:center;gap:20px"><div class="stars">' + stars + '</div><div><span class="mute">Jahresbilanz · ' + esc(c.name) + '</span><h2>' + rank.t + '</h2>' + (record ? '<span class="chip y">Neuer Rekord!</span>' : '') + '</div></div>' +
            '<div class="card"><table class="tbl">' + rows + '</table>' + nextT + '</div>' +
            '<div class="row" style="gap:16px;margin-top:auto">' + btn('Nochmal spielen', 'newgame', null, { cls: 'primary', auto: true }) + btn('Zum Titelbild', 'title') + '</div></div></div>';
        show(html, { back: title_, three: 'hub' });
        if (v.stars >= 2) PP3D.confetti(0);
    };

    /* ================= Duell-Ende ================= */
    function duelCards(vals, winner) {
        return M.players.map(function (p, i) {
            var v = vals[i], c = D.cases[p.S.caseId];
            var st = '';
            for (var k = 0; k < 3; k++) st += '<svg class="ic' + (k < v.stars ? ' on' : '') + '" viewBox="0 0 100 100"><path d="M50 8 L62 38 L94 38 L68 58 L78 90 L50 70 L22 90 L32 58 L6 38 L38 38 Z" fill="currentColor"/></svg>';
            return '<div class="card col duelcard' + (i === winner ? ' win' : '') + '" style="border-color:' + p.color + '">' +
                '<div class="row" style="align-items:center;gap:12px"><h2 style="color:' + p.color + '">' + (i === winner ? '👑 ' : '') + esc(p.name) + '</h2><span class="mute">' + esc(c.name) + '</span></div>' +
                (p.S.over ? '<div class="big bad" style="font-weight:900">' + (p.S.over === 'pleite' ? 'PLEITE' : 'CHAOS-KOLLAPS') + '</div>' : '<div class="stars small3">' + st + '</div>') +
                '<div class="val">' + (p.S.over ? 0 : E.score(p.S)) + ' Punkte <span class="small mute">· Firmenwert ' + eur(v.total) + '</span></div>' +
                '<div class="row" style="gap:8px;flex-wrap:wrap"><span class="chip">' + E.procCount(p.S) + ' Prozesse</span><span class="chip">' + p.S.staff.length + ' im Team</span><span class="chip">' + p.S.customers.length + ' ' + esc(c.units) + '</span><span class="chip y">' + E.skillCount(p.S).learned + ' Skills</span></div></div>';
        }).join('');
    }
    function duelEnd(winner, headline, quote) {
        clearSave();
        var vals = M.players.map(function (p) { return p.S.over ? { total: 0, stars: 0 } : E.valuation(p.S); });
        M.players.forEach(function (p, i) {
            if (p.S.over) return;
            var best = getBest(), id = p.S.caseId;
            if (!best[id] || vals[i].total > best[id].value) { best[id] = { value: vals[i].total, stars: Math.max(vals[i].stars, best[id] ? best[id].stars : 0) }; setBest(best); }
        });
        M.cur = winner; S = me().S;
        sfx('win'); coins(40);
        var html = '<div class="duelend">' +
            '<div class="center col" style="gap:6px"><span class="chip y" style="font-size:20px">' + headline + '</span>' +
            '<h1 style="font-size:76px;color:' + M.players[winner].color + '">' + esc(M.players[winner].name) + ' gewinnt!</h1></div>' +
            '<div class="grow"></div>' +
            '<div class="row" style="gap:24px;align-items:stretch">' + duelCards(vals, winner) + '</div>' +
            '<div class="row" style="gap:16px;align-items:center;margin-top:16px"><div class="grow">' + mentorBox(quote) + '</div>' +
            btn('Revanche!', 'rematch', null, { cls: 'gold', auto: true, style: 'height:76px;font-size:26px' }) + btn('Zum Titelbild', 'title', null, { style: 'height:76px' }) + '</div></div>';
        show(html, { back: title_, three: 'final', cls: 'clear' });
        PP3D.confetti(winner);
        M.players.forEach(function (p, i) { if (p.S.over) PP3D.storm(i, true); });
    }
    H.duelFinal = function () {
        var vals = M.players.map(function (p) { return E.score(p.S); });
        var winner = vals[0] === vals[1] ? (M.players[0].S.rep >= M.players[1].S.rep ? 0 : 1) : (vals[0] > vals[1] ? 0 : 1);
        var diff = Math.abs(vals[0] - vals[1]);
        var quote = diff < 8 ? 'Hauchdünn! Frau Sommer musste zweimal nachrechnen. Beide Firmen sind ein gutes Investment.' :
            'Frau Sommer ist eindeutig: „' + esc(M.players[winner].name) + ' hat ein Unternehmen gebaut, das auch ohne den Chef läuft.“';
        duelEnd(winner, 'Urteil der Investorin', quote);
    };
    H.duelOver = function () {
        var loser = M.cur, winner = 1 - M.cur;
        var why = M.players[loser].S.over === 'pleite' ? 'ist pleite' : 'ist im Chaos versunken';
        duelEnd(winner, esc(M.players[loser].name) + ' ' + why, 'Manchmal gewinnt nicht der Schnellste, sondern wer nicht umfällt. Prozesse und ein Blick auf die Finanzen hätten geholfen.');
    };
    H.rematch = function () {
        var picks = M.players.map(function (p) { return p.S.caseId; });
        setup = { mode: 2, picks: picks.slice() };
        newMatch(2, picks);
        save();
        handover();
    };

    /* Testzugang für die Entwicklung (Browser-Konsole) */
    window.PPDEBUG = { state: function () { return S; }, match: function () { return M; }, H: H, hub: hub, bossIntro: bossIntro, event: eventScreen, handover: function () { handover(); }, sync: sync3d };

    /* ================= Start ================= */
    if (PP3D.init) PP3D.init(document.getElementById('three'));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { title(); }); else title();
})();
