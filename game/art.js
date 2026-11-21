/* Prozesse oder Pleite – Illustrationen als SVG (keine externen Bilder nötig) */
(function (G) {
    'use strict';
    var A = {};
    var uid = 0;
    function id(p) { uid += 1; return p + uid; }
    function grad(gid, c1, c2, vertical) {
        return '<linearGradient id="' + gid + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
    }
    function svg(vb, defs, body, cls) {
        return '<svg class="' + (cls || 'art') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><defs>' + defs + '</defs>' + body + '</svg>';
    }
    function rnd(seed) {
        var s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) | 0;
            var t = Math.imul(s ^ (s >>> 15), s | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function pick(r, a) { return a[Math.floor(r() * a.length)]; }

    /* ---------------- Gesichter ---------------- */
    var SKIN = ['#f9d7c0', '#f1c19d', '#e0a57c', '#c98b5e', '#a26a43', '#7b4a2c'];
    var HAIR = ['#2b1d16', '#4a2f1f', '#7a4a26', '#c08a3e', '#e6c27a', '#8e8e8e', '#b5482e', '#1c1c2e'];
    var BG = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#22c55e', '#ef4444'];
    var SHIRT = ['#1e293b', '#334155', '#2563eb', '#0f766e', '#9333ea', '#be123c', '#f8fafc', '#ca8a04'];

    A.face = function (seed, o) {
        o = o || {};
        var r = rnd(seed || 1);
        var skin = o.skin || pick(r, SKIN), hair = o.hair || pick(r, HAIR), bg = o.bg || pick(r, BG), shirt = o.shirt || pick(r, SHIRT);
        var style = o.style !== undefined ? o.style : Math.floor(r() * 6);
        var glasses = o.glasses !== undefined ? o.glasses : r() < 0.25;
        var mood = o.mood || (r() < 0.75 ? 'smile' : 'neutral');
        var gid = id('fbg');
        var b = '';
        b += '<circle cx="60" cy="60" r="60" fill="url(#' + gid + ')"/>';
        // Haare hinten (lang)
        if (style === 2) b += '<path d="M30 58 Q28 100 40 112 L80 112 Q92 100 90 58 Z" fill="' + hair + '"/>';
        if (style === 4) b += '<circle cx="60" cy="28" r="14" fill="' + hair + '"/>';
        // Körper
        b += '<path d="M18 122 Q20 88 60 86 Q100 88 102 122 Z" fill="' + shirt + '"/>';
        if (o.tie) b += '<path d="M60 88 L55 96 L60 118 L65 96 Z" fill="' + o.tie + '"/><path d="M48 87 L60 98 L72 87" fill="none" stroke="#f8fafc" stroke-width="5"/>';
        else b += '<path d="M48 87 Q60 100 72 87" fill="' + skin + '"/>';
        // Hals + Kopf
        b += '<rect x="52" y="70" width="16" height="18" rx="6" fill="' + skin + '"/>';
        b += '<ellipse cx="60" cy="54" rx="24" ry="27" fill="' + skin + '"/>';
        b += '<ellipse cx="36" cy="57" rx="4" ry="6" fill="' + skin + '"/><ellipse cx="84" cy="57" rx="4" ry="6" fill="' + skin + '"/>';
        // Haare vorn
        if (style === 0) b += '<path d="M35 50 Q34 24 60 24 Q86 24 85 50 Q78 36 60 36 Q44 36 35 50 Z" fill="' + hair + '"/>';
        if (style === 1) b += '<path d="M34 54 Q30 22 60 22 Q90 22 86 54 Q84 40 72 34 Q60 44 40 40 Q36 46 34 54 Z" fill="' + hair + '"/>';
        if (style === 2) b += '<path d="M34 60 Q30 22 60 22 Q90 22 86 60 Q84 38 60 34 Q40 36 34 60 Z" fill="' + hair + '"/>';
        if (style === 3) { for (var i = 0; i < 9; i++) { b += '<circle cx="' + (36 + i * 6) + '" cy="' + (32 - Math.sin(i / 8 * Math.PI) * 8) + '" r="9" fill="' + hair + '"/>'; } }
        if (style === 4) b += '<path d="M36 50 Q36 26 60 26 Q84 26 84 50 Q76 36 60 36 Q44 36 36 50 Z" fill="' + hair + '"/>';
        if (style === 5) b += '<path d="M38 40 Q46 30 60 30 Q74 30 82 40 Q72 34 60 35 Q48 34 38 40 Z" fill="' + hair + '" opacity="0.8"/>';
        // Augen, Brauen, Mund
        b += '<ellipse cx="50" cy="56" rx="3.2" ry="3.8" fill="#1f2937"/><ellipse cx="70" cy="56" rx="3.2" ry="3.8" fill="#1f2937"/>';
        b += '<circle cx="51" cy="54.8" r="1" fill="#fff"/><circle cx="71" cy="54.8" r="1" fill="#fff"/>';
        var brow = o.stern ? ' M44 47 L55 50 M76 47 L65 50' : ' M44 48 Q50 45 55 48 M65 48 Q70 45 76 48';
        b += '<path d="' + brow + '" stroke="' + (style === 5 ? '#4b5563' : hair) + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
        if (mood === 'smile') b += '<path d="M51 68 Q60 76 69 68" stroke="#7c2d12" stroke-width="3" fill="none" stroke-linecap="round"/>';
        else if (mood === 'grin') b += '<path d="M50 67 Q60 79 70 67 Z" fill="#7c2d12"/><path d="M52 67.5 L68 67.5 L66 70 L54 70 Z" fill="#fff"/>';
        else b += '<path d="M52 70 L68 70" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/>';
        b += '<ellipse cx="44" cy="65" rx="4" ry="2.4" fill="#f87171" opacity="0.25"/><ellipse cx="76" cy="65" rx="4" ry="2.4" fill="#f87171" opacity="0.25"/>';
        if (glasses) b += '<g fill="none" stroke="#111827" stroke-width="2.4"><circle cx="50" cy="56" r="8"/><circle cx="70" cy="56" r="8"/><path d="M58 56 L62 56 M42 55 L36 53 M78 55 L84 53"/></g>';
        if (o.headset) b += '<path d="M34 54 Q34 22 60 22 Q86 22 86 54" fill="none" stroke="#0f172a" stroke-width="4"/><rect x="29" y="50" width="9" height="14" rx="4" fill="#0f172a"/><path d="M33 64 Q36 76 50 76" fill="none" stroke="#0f172a" stroke-width="3"/><circle cx="51" cy="76" r="3" fill="#0f172a"/>';
        return svg('0 0 120 120', grad(gid, bg, shade(bg, -30)), b, 'face');
    };

    function shade(hex, amt) {
        var n = parseInt(hex.slice(1), 16);
        var r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    A.mentor = function () { return A.face(7, { skin: '#c98b5e', hair: '#2b1d16', bg: '#14b8a6', shirt: '#f8fafc', style: 3, glasses: false, mood: 'grin', headset: true }); };
    A.boss = function (bid) {
        if (bid === 'grosskunde') return A.face(4711, { skin: '#f1c19d', hair: '#8e8e8e', bg: '#475569', shirt: '#1e293b', style: 0, glasses: true, mood: 'neutral', tie: '#dc2626', stern: true });
        if (bid === 'pruefung') return A.face(8080, { skin: '#f9d7c0', hair: '#4a2f1f', bg: '#b91c1c', shirt: '#334155', style: 4, glasses: true, mood: 'neutral', stern: true });
        return A.face(1212, { skin: '#e0a57c', hair: '#c08a3e', bg: '#ca8a04', shirt: '#0f172a', style: 2, glasses: false, mood: 'smile' });
    };

    /* ---------------- Branchen-Szenen ---------------- */
    A.caseScene = function (cid) {
        var g1 = id('cs'), g2 = id('cs');
        var d, b = '';
        if (cid === 'agentur') {
            d = grad(g1, '#7c3aed', '#312e81', true) + grad(g2, '#f472b6', '#8b5cf6');
            b += '<rect width="400" height="260" fill="url(#' + g1 + ')"/>';
            b += '<circle cx="330" cy="60" r="70" fill="#a78bfa" opacity="0.25"/><circle cx="60" cy="210" r="90" fill="#4c1d95" opacity="0.5"/>';
            b += '<rect x="40" y="206" width="320" height="14" rx="7" fill="#1e1b4b"/>';
            b += '<rect x="110" y="70" width="180" height="120" rx="12" fill="#0f172a"/><rect x="120" y="80" width="160" height="96" rx="6" fill="#f8fafc"/>';
            b += '<rect x="130" y="90" width="70" height="44" rx="6" fill="url(#' + g2 + ')"/><rect x="208" y="90" width="62" height="10" rx="5" fill="#c4b5fd"/><rect x="208" y="106" width="48" height="8" rx="4" fill="#e9d5ff"/><rect x="208" y="120" width="56" height="8" rx="4" fill="#e9d5ff"/>';
            b += '<rect x="130" y="144" width="38" height="22" rx="5" fill="#fbbf24"/><rect x="174" y="144" width="38" height="22" rx="5" fill="#34d399"/><rect x="218" y="144" width="52" height="22" rx="5" fill="#60a5fa"/>';
            b += '<path d="M190 190 L210 190 L216 206 L184 206 Z" fill="#1e1b4b"/>';
            b += '<g transform="translate(300 120) rotate(30)"><rect x="-6" y="-50" width="12" height="80" rx="4" fill="#fbbf24"/><path d="M-6 30 L0 46 L6 30 Z" fill="#fde68a"/><rect x="-6" y="-50" width="12" height="12" fill="#f472b6"/></g>';
            b += '<g transform="translate(70 150)"><rect x="-18" y="20" width="36" height="36" rx="6" fill="#ea580c"/><path d="M0 22 Q-30 -10 -6 -36 Q4 -10 0 22 Z" fill="#22c55e"/><path d="M0 22 Q26 -6 18 -30 Q2 -8 0 22 Z" fill="#16a34a"/></g>';
            b += '<g transform="translate(320 40)"><rect x="-34" y="-20" width="68" height="40" rx="12" fill="#fff"/><path d="M-10 20 L-18 34 L4 20 Z" fill="#fff"/><text x="0" y="9" text-anchor="middle" font-size="26" font-weight="900" fill="#7c3aed" font-family="Inter,sans-serif">Wow!</text></g>';
        } else if (cid === 'handwerk') {
            d = grad(g1, '#f59e0b', '#9a3412', true) + grad(g2, '#fde68a', '#f59e0b');
            b += '<rect width="400" height="260" fill="url(#' + g1 + ')"/>';
            b += '<circle cx="320" cy="62" r="34" fill="#fef3c7"/><circle cx="320" cy="62" r="50" fill="#fef3c7" opacity="0.25"/>';
            b += '<rect y="214" width="400" height="46" fill="#7c2d12"/>';
            b += '<path d="M90 214 L90 130 L170 70 L250 130 L250 214 Z" fill="#fff7ed"/><path d="M76 136 L170 60 L264 136" fill="none" stroke="#b91c1c" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>';
            b += '<rect x="150" y="160" width="40" height="54" rx="4" fill="#92400e"/><circle cx="182" cy="188" r="3" fill="#fde68a"/>';
            b += '<rect x="104" y="148" width="34" height="30" rx="3" fill="#7dd3fc"/><rect x="202" y="148" width="34" height="30" rx="3" fill="#7dd3fc"/><path d="M121 148 V178 M104 163 H138 M219 148 V178 M202 163 H236" stroke="#fff7ed" stroke-width="3"/>';
            b += '<rect x="216" y="84" width="16" height="34" fill="#9a3412"/>';
            b += '<g transform="translate(320 170) rotate(-35)"><rect x="-6" y="-46" width="12" height="76" rx="5" fill="#78350f"/><rect x="-24" y="-60" width="48" height="20" rx="5" fill="#475569"/></g>';
            b += '<g transform="translate(320 170) rotate(40)"><rect x="-5" y="-40" width="10" height="72" rx="5" fill="#94a3b8"/><path d="M-16 -52 a16 16 0 1 0 32 0 l-8 0 l0 10 l-16 0 l0 -10 z" fill="#94a3b8"/></g>';
            b += '<g fill="#fde68a"><rect x="40" y="196" width="40" height="18" rx="3"/><rect x="48" y="178" width="40" height="18" rx="3" fill="#fcd34d"/></g>';
        } else if (cid === 'roesterei') {
            d = grad(g1, '#b45309', '#3f1d0b', true) + grad(g2, '#fef3c7', '#fde68a');
            b += '<rect width="400" height="260" fill="url(#' + g1 + ')"/>';
            b += '<circle cx="80" cy="60" r="60" fill="#f59e0b" opacity="0.18"/><circle cx="340" cy="220" r="80" fill="#000" opacity="0.15"/>';
            b += '<path d="M170 60 Q160 40 172 26 M200 58 Q190 36 204 20 M230 60 Q220 40 232 26" stroke="#fef3c7" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.8"/>';
            b += '<path d="M130 80 L270 80 L258 190 Q256 206 240 206 L160 206 Q144 206 142 190 Z" fill="url(#' + g2 + ')"/>';
            b += '<path d="M268 104 Q306 104 304 136 Q302 166 262 168" fill="none" stroke="#fde68a" stroke-width="14"/>';
            b += '<ellipse cx="200" cy="82" rx="70" ry="10" fill="#7c2d12"/><ellipse cx="200" cy="80" rx="62" ry="6" fill="#92400e"/>';
            b += '<path d="M178 140 Q200 120 222 140 Q200 160 178 140 Z" fill="#b45309"/>';
            b += '<ellipse cx="200" cy="214" rx="100" ry="10" fill="#1c0a00" opacity="0.4"/>';
            function bean(x, y, rot, s) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')"><ellipse rx="14" ry="10" fill="#78350f"/><path d="M-12 0 Q0 -5 12 0" stroke="#3f1d0b" stroke-width="2.5" fill="none"/></g>'; }
            b += bean(60, 200, 20, 1.2) + bean(90, 226, -30, 1) + bean(330, 110, 40, 1.1) + bean(352, 150, -10, 0.9) + bean(48, 130, 60, 0.8);
            b += '<g transform="translate(330 196)"><path d="M-30 -40 L30 -40 L36 34 L-36 34 Z" fill="#d6d3d1"/><rect x="-24" y="-20" width="48" height="30" rx="4" fill="#b45309"/><text x="0" y="0" text-anchor="middle" font-size="12" font-weight="900" fill="#fef3c7" font-family="Inter,sans-serif">BOHNE</text></g>';
        } else if (cid === 'reselling') {
            d = grad(g1, '#ec4899', '#581c87', true) + grad(g2, '#fde68a', '#f59e0b');
            b += '<rect width="400" height="260" fill="url(#' + g1 + ')"/>';
            b += '<circle cx="320" cy="60" r="70" fill="#f9a8d4" opacity="0.25"/><circle cx="60" cy="230" r="80" fill="#3b0764" opacity="0.5"/>';
            // Kleiderständer
            b += '<path d="M60 70 L250 70" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round"/><path d="M70 70 L60 214 M240 70 L250 214" stroke="#cbd5e1" stroke-width="6"/><rect x="44" y="212" width="36" height="7" rx="3" fill="#cbd5e1"/><rect x="230" y="212" width="36" height="7" rx="3" fill="#cbd5e1"/>';
            function hanger(x) { return '<path d="M' + x + ' 70 q0 -8 6 -8 q6 0 6 6" stroke="#f8fafc" stroke-width="3" fill="none"/><path d="M' + (x - 22) + ' 86 L' + x + ' 74 L' + (x + 22) + ' 86" stroke="#f8fafc" stroke-width="3" fill="none"/>'; }
            b += hanger(100) + '<path d="M78 86 L122 86 L128 170 L72 170 Z" fill="#60a5fa"/><path d="M92 86 L100 110 L108 86" fill="#2563eb"/>';
            b += hanger(155) + '<path d="M134 86 L176 86 L184 150 L170 150 L166 200 L144 200 L140 150 L126 150 Z" fill="#fbbf24"/>';
            b += hanger(208) + '<path d="M188 86 L228 86 L232 180 L184 180 Z" fill="#a78bfa"/><circle cx="208" cy="120" r="10" fill="#f472b6"/>';
            // Preisschild
            b += '<g transform="translate(118 150) rotate(-15)"><path d="M0 0 L40 0 L52 14 L40 28 L0 28 Z" fill="url(#' + g2 + ')"/><circle cx="42" cy="14" r="3" fill="#7c2d12"/><text x="18" y="20" text-anchor="middle" font-size="15" font-weight="900" fill="#7c2d12" font-family="Inter,sans-serif">12€</text></g>';
            // Handy mit Kamera
            b += '<g transform="translate(290 96) rotate(8)"><rect x="0" y="0" width="70" height="128" rx="12" fill="#0f172a"/><rect x="6" y="12" width="58" height="96" rx="6" fill="#fdf2f8"/><circle cx="35" cy="60" r="16" fill="none" stroke="#ec4899" stroke-width="5"/><circle cx="35" cy="60" r="6" fill="#ec4899"/><rect x="14" y="88" width="42" height="10" rx="5" fill="#22c55e"/><circle cx="35" cy="118" r="4" fill="#334155"/></g>';
            // Paket
            b += '<g transform="translate(290 196)"><rect x="0" y="0" width="74" height="46" rx="4" fill="#d97706"/><rect x="0" y="0" width="74" height="12" fill="#b45309"/><rect x="32" y="0" width="10" height="46" fill="#fde68a"/></g>';
            b += '<g fill="#fdf2f8"><path d="M30 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z"/><path d="M372 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z"/></g>';
        } else {
            d = grad(g1, '#0e7490', '#0f172a', true) + grad(g2, '#22d3ee', '#6366f1');
            b += '<rect width="400" height="260" fill="url(#' + g1 + ')"/>';
            for (var i = 0; i < 18; i++) b += '<circle cx="' + ((i * 97) % 400) + '" cy="' + ((i * 53) % 150) + '" r="' + (1 + i % 3) + '" fill="#a5f3fc" opacity="0.6"/>';
            b += '<path d="M90 212 L310 212 L330 232 L70 232 Z" fill="#94a3b8"/>';
            b += '<rect x="110" y="84" width="180" height="128" rx="10" fill="#1e293b"/><rect x="120" y="94" width="160" height="108" rx="4" fill="#0b1220"/>';
            var lines = [[130, 108, 60, '#22d3ee'], [140, 124, 90, '#a78bfa'], [140, 140, 70, '#4ade80'], [150, 156, 80, '#f472b6'], [140, 172, 50, '#facc15'], [130, 188, 40, '#22d3ee']];
            lines.forEach(function (l) { b += '<rect x="' + l[0] + '" y="' + l[1] + '" width="' + l[2] + '" height="7" rx="3.5" fill="' + l[3] + '"/>'; });
            b += '<g transform="translate(320 76) rotate(35)"><path d="M0 -40 Q16 -20 14 18 L-14 18 Q-16 -20 0 -40 Z" fill="#f8fafc"/><circle cx="0" cy="-8" r="7" fill="url(#' + g2 + ')"/><path d="M-14 6 L-26 26 L-12 20 Z M14 6 L26 26 L12 20 Z" fill="#6366f1"/><path d="M-8 20 Q0 46 8 20 Z" fill="#f97316"/></g>';
            b += '<g transform="translate(76 60)"><ellipse cx="0" cy="10" rx="40" ry="18" fill="#e0f2fe"/><circle cx="-14" cy="0" r="18" fill="#e0f2fe"/><circle cx="12" cy="-4" r="22" fill="#e0f2fe"/></g>';
        }
        return svg('0 0 400 260', d, b, 'scene');
    };

    /* ---------------- Firmengebäude (wächst mit) ---------------- */
    A.building = function (level, color) {
        var g1 = id('bd'), g2 = id('bd');
        var d = grad(g1, '#1e3a8a', '#0f172a', true) + grad(g2, shade(color, 30), shade(color, -40), true);
        var b = '<rect width="400" height="300" fill="url(#' + g1 + ')"/>';
        b += '<circle cx="330" cy="60" r="26" fill="#fef9c3" opacity="0.9"/>';
        for (var i = 0; i < 14; i++) b += '<circle cx="' + ((i * 89 + 20) % 400) + '" cy="' + ((i * 37) % 120 + 10) + '" r="1.6" fill="#e0f2fe" opacity="0.7"/>';
        // Stadt im Hintergrund
        b += '<g fill="#172554" opacity="0.9"><rect x="0" y="180" width="50" height="120"/><rect x="40" y="200" width="40" height="100"/><rect x="330" y="170" width="40" height="130"/><rect x="360" y="196" width="40" height="104"/></g>';
        b += '<rect y="262" width="400" height="38" fill="#0b1120"/>';
        function windows(x, y, cols, rows, w, h, gx, gy) {
            var s = '';
            for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
                var lit = ((r * 7 + c * 3 + level) % 5) !== 0;
                s += '<rect x="' + (x + c * (w + gx)) + '" y="' + (y + r * (h + gy)) + '" width="' + w + '" height="' + h + '" rx="2" fill="' + (lit ? '#fde68a' : '#334155') + '"/>';
            }
            return s;
        }
        if (level <= 0) {
            b += '<rect x="130" y="190" width="140" height="72" fill="#64748b"/><path d="M120 194 L200 160 L280 194 Z" fill="#475569"/>';
            b += '<rect x="148" y="210" width="104" height="52" fill="#94a3b8"/>';
            for (var k = 0; k < 6; k++) b += '<rect x="148" y="' + (212 + k * 8) + '" width="104" height="3" fill="#64748b"/>';
            b += '<rect x="168" y="176" width="64" height="16" rx="3" fill="url(#' + g2 + ')"/>';
        } else if (level === 1) {
            b += '<rect x="110" y="160" width="180" height="102" fill="#e2e8f0"/><rect x="100" y="148" width="200" height="16" rx="3" fill="url(#' + g2 + ')"/>';
            b += '<rect x="126" y="186" width="70" height="50" rx="3" fill="#7dd3fc"/><rect x="214" y="186" width="56" height="76" rx="3" fill="#475569"/><circle cx="260" cy="226" r="3" fill="#fde68a"/>';
            b += '<path d="M110 176 L290 176" stroke="url(#' + g2 + ')" stroke-width="10" stroke-dasharray="20 10"/>';
        } else if (level === 2) {
            b += '<rect x="100" y="110" width="200" height="152" fill="#cbd5e1"/><rect x="92" y="98" width="216" height="16" rx="3" fill="url(#' + g2 + ')"/>';
            b += windows(116, 126, 5, 3, 26, 22, 10, 14);
            b += '<rect x="176" y="222" width="48" height="40" fill="#334155"/>';
        } else {
            b += '<rect x="130" y="40" width="140" height="222" fill="url(#' + g2 + ')"/><rect x="146" y="24" width="108" height="20" fill="' + shade(color, -50) + '"/>';
            b += windows(146, 58, 4, 7, 22, 16, 10, 10);
            b += '<rect x="80" y="160" width="60" height="102" fill="#94a3b8"/><rect x="260" y="140" width="64" height="122" fill="#94a3b8"/>';
            b += windows(90, 172, 2, 4, 16, 14, 10, 8) + windows(270, 152, 2, 5, 18, 14, 10, 8);
            b += '<rect x="178" y="226" width="44" height="36" fill="#0f172a"/>';
            b += '<path d="M200 24 L200 6" stroke="#e2e8f0" stroke-width="3"/><path d="M200 6 L222 12 L200 18 Z" fill="#facc15"/>';
        }
        // Bäume
        b += '<g><circle cx="70" cy="244" r="16" fill="#16a34a"/><rect x="67" y="252" width="6" height="12" fill="#713f12"/><circle cx="330" cy="246" r="14" fill="#15803d"/><rect x="327" y="252" width="6" height="12" fill="#713f12"/></g>';
        return svg('0 0 400 300', d, b, 'building');
    };

    /* ---------------- Ereignis-Bilder ---------------- */
    var EV = {
        fire: ['#ef4444', '#7f1d1d', '<path d="M120 196 Q66 190 70 138 Q74 104 104 82 Q100 112 120 120 Q114 84 138 50 Q146 92 170 112 Q182 128 178 150 Q172 194 120 196 Z" fill="#fb923c"/><path d="M120 196 Q92 192 94 160 Q98 140 114 128 Q114 150 128 154 Q130 136 140 124 Q154 146 150 168 Q146 194 120 196 Z" fill="#fde047"/>'],
        amt: ['#64748b', '#1e293b', '<path d="M50 96 L120 56 L190 96 Z" fill="#e2e8f0"/><rect x="56" y="96" width="128" height="10" fill="#cbd5e1"/><g fill="#e2e8f0"><rect x="66" y="110" width="14" height="60"/><rect x="96" y="110" width="14" height="60"/><rect x="130" y="110" width="14" height="60"/><rect x="160" y="110" width="14" height="60"/></g><rect x="50" y="170" width="140" height="14" fill="#cbd5e1"/><circle cx="120" cy="80" r="8" fill="#facc15"/>'],
        krank: ['#22d3ee', '#155e75', '<rect x="56" y="120" width="128" height="40" rx="10" fill="#e0f2fe"/><rect x="56" y="150" width="128" height="34" rx="6" fill="#38bdf8"/><circle cx="86" cy="116" r="22" fill="#fde68a"/><rect x="60" y="88" width="34" height="10" rx="4" fill="#f8fafc" transform="rotate(-10 77 93)"/><g transform="translate(160 76) rotate(30)"><rect x="-6" y="-26" width="12" height="44" rx="6" fill="#f8fafc"/><rect x="-6" y="-26" width="12" height="20" rx="6" fill="#ef4444"/></g><text x="130" y="96" font-size="22" font-weight="900" fill="#f8fafc" font-family="Inter,sans-serif">z z</text>'],
        sterne: ['#facc15', '#a16207', '<g fill="#fef9c3" stroke="#a16207" stroke-width="3"><path d="M120 46 L132 82 L170 82 L140 104 L150 140 L120 118 L90 140 L100 104 L70 82 L108 82 Z"/></g><g fill="#fff" opacity="0.9"><path d="M60 150 L66 166 L82 166 L69 176 L74 192 L60 182 L46 192 L51 176 L38 166 L54 166 Z"/><path d="M180 150 L186 166 L202 166 L189 176 L194 192 L180 182 L166 192 L171 176 L158 166 L174 166 Z"/></g>'],
        sturm: ['#475569', '#0f172a', '<g fill="#cbd5e1"><ellipse cx="96" cy="96" rx="44" ry="30"/><ellipse cx="140" cy="88" rx="44" ry="36"/><ellipse cx="160" cy="110" rx="34" ry="24"/></g><path d="M126 120 L104 160 L124 160 L110 200 L150 146 L128 146 L144 120 Z" fill="#facc15"/><g stroke="#93c5fd" stroke-width="5" stroke-linecap="round"><path d="M70 140 L62 160"/><path d="M88 146 L80 166"/><path d="M168 140 L160 160"/></g>'],
        messe: ['#8b5cf6', '#3b0764', '<rect x="46" y="70" width="148" height="24" rx="6" fill="#f472b6"/><rect x="56" y="94" width="128" height="80" fill="#f8fafc"/><rect x="70" y="108" width="50" height="36" rx="4" fill="#a78bfa"/><rect x="130" y="108" width="40" height="8" rx="4" fill="#c4b5fd"/><rect x="130" y="122" width="30" height="8" rx="4" fill="#ddd6fe"/><rect x="46" y="174" width="148" height="16" rx="4" fill="#4c1d95"/><g fill="#facc15"><circle cx="60" cy="60" r="8"/><circle cx="180" cy="60" r="8"/></g>'],
        maske: ['#0f172a', '#334155', '<path d="M60 100 Q60 70 120 70 Q180 70 180 100 Q180 150 120 160 Q60 150 60 100 Z" fill="#1f2937"/><path d="M60 100 Q120 80 180 100 L180 116 Q150 126 120 112 Q90 126 60 116 Z" fill="#111827"/><ellipse cx="95" cy="106" rx="12" ry="7" fill="#f8fafc"/><ellipse cx="145" cy="106" rx="12" ry="7" fill="#f8fafc"/><circle cx="95" cy="106" r="4" fill="#111827"/><circle cx="145" cy="106" r="4" fill="#111827"/><path d="M100 140 Q120 132 140 140" stroke="#ef4444" stroke-width="4" fill="none"/><text x="168" y="72" font-size="40" font-weight="900" fill="#22c55e" font-family="Inter,sans-serif">€</text>'],
        geld: ['#22c55e', '#14532d', '<g transform="rotate(-12 120 120)"><rect x="50" y="90" width="140" height="70" rx="8" fill="#bbf7d0" stroke="#15803d" stroke-width="4"/><circle cx="120" cy="125" r="20" fill="#86efac" stroke="#15803d" stroke-width="3"/><text x="120" y="133" text-anchor="middle" font-size="24" font-weight="900" fill="#14532d" font-family="Inter,sans-serif">€</text></g><g><ellipse cx="170" cy="176" rx="24" ry="8" fill="#ca8a04"/><rect x="146" y="160" width="48" height="16" fill="#facc15"/><ellipse cx="170" cy="160" rx="24" ry="8" fill="#fde047"/></g>'],
        preis: ['#f97316', '#7c2d12', '<path d="M60 70 L130 70 L190 130 L130 190 L60 120 Z" fill="#fed7aa"/><circle cx="84" cy="94" r="10" fill="#7c2d12"/><path d="M118 108 L118 160 M104 122 L118 108 L132 122" stroke="#dc2626" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'],
        kaffee: ['#a16207', '#422006', '<path d="M70 100 L160 100 L152 176 Q150 190 136 190 L94 190 Q80 190 78 176 Z" fill="#f8fafc"/><path d="M160 116 Q188 116 186 140 Q184 162 156 162" fill="none" stroke="#f8fafc" stroke-width="10"/><ellipse cx="115" cy="102" rx="45" ry="8" fill="#78350f"/><path d="M96 86 Q88 70 98 56 M120 82 Q112 64 124 48 M142 86 Q134 70 144 56" stroke="#fef3c7" stroke-width="5" fill="none" stroke-linecap="round"/><text x="96" y="156" font-size="26" font-weight="900" fill="#ef4444" font-family="Inter,sans-serif">!!!</text>'],
        brief: ['#0ea5e9', '#0c4a6e', '<rect x="50" y="78" width="140" height="96" rx="8" fill="#f8fafc"/><path d="M50 84 L120 134 L190 84" fill="none" stroke="#94a3b8" stroke-width="5"/><circle cx="178" cy="78" r="20" fill="#ef4444"/><text x="178" y="87" text-anchor="middle" font-size="24" font-weight="900" fill="#fff" font-family="Inter,sans-serif">!</text>'],
        zeitung: ['#e2e8f0', '#64748b', '<rect x="52" y="60" width="136" height="130" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="4"/><rect x="64" y="72" width="112" height="16" fill="#0f172a"/><rect x="64" y="96" width="52" height="44" fill="#94a3b8"/><g fill="#475569"><rect x="124" y="96" width="52" height="6"/><rect x="124" y="108" width="52" height="6"/><rect x="124" y="120" width="40" height="6"/><rect x="64" y="150" width="112" height="6"/><rect x="64" y="162" width="112" height="6"/><rect x="64" y="174" width="80" height="6"/></g>'],
        idee: ['#facc15', '#854d0e', '<circle cx="120" cy="104" r="44" fill="#fef9c3"/><rect x="102" y="146" width="36" height="16" rx="4" fill="#94a3b8"/><rect x="106" y="164" width="28" height="10" rx="4" fill="#64748b"/><path d="M108 126 L114 100 L126 100 L132 126" stroke="#ca8a04" stroke-width="5" fill="none"/><g stroke="#fef9c3" stroke-width="6" stroke-linecap="round"><path d="M120 40 L120 50"/><path d="M62 104 L52 104"/><path d="M178 104 L188 104"/><path d="M78 62 L71 55"/><path d="M162 62 L169 55"/></g>'],
        kunde: ['#ec4899', '#831843', '<rect x="54" y="66" width="132" height="70" rx="16" fill="#f8fafc"/><path d="M90 136 L80 162 L114 136 Z" fill="#f8fafc"/><text x="120" y="114" text-anchor="middle" font-size="40" font-weight="900" fill="#db2777" font-family="Inter,sans-serif">?!</text><circle cx="168" cy="176" r="22" fill="#fde68a"/><circle cx="162" cy="172" r="3" fill="#1f2937"/><circle cx="174" cy="172" r="3" fill="#1f2937"/><path d="M162 184 Q168 180 174 184" stroke="#1f2937" stroke-width="3" fill="none"/>'],
        talent: ['#14b8a6', '#134e4a', '<circle cx="120" cy="96" r="30" fill="#fde68a"/><path d="M70 186 Q72 130 120 128 Q168 130 170 186 Z" fill="#0f766e"/><path d="M150 64 L156 80 L172 80 L159 90 L164 106 L150 96 L136 106 L141 90 L128 80 L144 80 Z" fill="#facc15"/>'],
        pokal: ['#eab308', '#713f12', '<path d="M84 60 L156 60 L152 110 Q148 140 120 142 Q92 140 88 110 Z" fill="#fde047"/><path d="M84 72 Q56 72 60 96 Q64 116 90 118 M156 72 Q184 72 180 96 Q176 116 150 118" fill="none" stroke="#fde047" stroke-width="8"/><rect x="110" y="142" width="20" height="24" fill="#ca8a04"/><rect x="88" y="166" width="64" height="16" rx="4" fill="#a16207"/>'],
        laster: ['#f59e0b', '#78350f', '<rect x="40" y="96" width="110" height="64" rx="6" fill="#f8fafc"/><path d="M150 112 L186 112 L202 136 L202 160 L150 160 Z" fill="#fbbf24"/><rect x="160" y="118" width="26" height="18" rx="2" fill="#7dd3fc"/><circle cx="76" cy="166" r="14" fill="#1f2937"/><circle cx="176" cy="166" r="14" fill="#1f2937"/><circle cx="76" cy="166" r="5" fill="#94a3b8"/><circle cx="176" cy="166" r="5" fill="#94a3b8"/><text x="96" y="138" text-anchor="middle" font-size="22" font-weight="900" fill="#b45309" font-family="Inter,sans-serif">…?</text>'],
        zahnrad: ['#78716c', '#292524', '<g transform="translate(110 120)"><circle r="40" fill="#d6d3d1"/><g fill="#d6d3d1"><rect x="-10" y="-56" width="20" height="20"/><rect x="-10" y="36" width="20" height="20"/><rect x="-56" y="-10" width="20" height="20"/><rect x="36" y="-10" width="20" height="20"/></g><circle r="16" fill="#57534e"/></g><g transform="translate(168 76)"><circle r="20" fill="#a8a29e"/><circle r="8" fill="#57534e"/></g><path d="M150 150 Q170 130 190 150" stroke="#f97316" stroke-width="6" fill="none"/><g fill="#9ca3af" opacity="0.7"><circle cx="186" cy="130" r="10"/><circle cx="198" cy="114" r="7"/></g>'],
        server: ['#06b6d4', '#164e63', '<g><rect x="70" y="60" width="100" height="34" rx="6" fill="#1e293b"/><rect x="70" y="102" width="100" height="34" rx="6" fill="#1e293b"/><rect x="70" y="144" width="100" height="34" rx="6" fill="#1e293b"/><g fill="#ef4444"><circle cx="150" cy="77" r="6"/><circle cx="150" cy="119" r="6"/><circle cx="150" cy="161" r="6"/></g><g fill="#475569"><rect x="82" y="73" width="44" height="8" rx="4"/><rect x="82" y="115" width="44" height="8" rx="4"/><rect x="82" y="157" width="44" height="8" rx="4"/></g></g><path d="M176 50 L196 30 M186 60 L206 52" stroke="#facc15" stroke-width="6" stroke-linecap="round"/>']
    };
    A.event = function (key) {
        var e = EV[key] || EV.idee;
        var g = id('ev');
        var b = '<rect width="240" height="240" rx="28" fill="url(#' + g + ')"/><circle cx="190" cy="40" r="60" fill="#fff" opacity="0.08"/><circle cx="40" cy="210" r="70" fill="#000" opacity="0.12"/>' + e[2];
        return svg('0 0 240 240', grad(g, e[0], e[1]), b, 'eventart');
    };

    /* Kleine Symbole für Aktions-Kacheln */
    var IC = {
        acq: '<path d="M30 20 Q24 20 22 26 L18 40 Q30 66 56 78 L70 74 Q76 72 76 66 L76 58 Q76 54 72 52 L60 48 Q56 47 53 50 L48 56 Q38 50 32 40 L38 34 Q41 31 40 27 L36 15 Q34 11 30 12 Z" fill="currentColor"/><path d="M58 18 Q72 20 78 34 M58 30 Q66 31 68 40" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"/>',
        sell: '<path d="M14 50 L34 34 L48 42 L62 30 L84 48 L62 70 Q56 74 50 68 L46 64 Q40 70 34 64 L30 60 Q24 64 20 58 Z" fill="currentColor"/><path d="M10 46 L24 30 M88 46 L72 28" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>',
        proc: '<rect x="12" y="14" width="30" height="22" rx="5" fill="currentColor"/><rect x="58" y="14" width="30" height="22" rx="5" fill="currentColor"/><rect x="35" y="62" width="30" height="22" rx="5" fill="currentColor"/><path d="M27 36 L27 50 L50 50 L50 62 M73 36 L73 50 L50 50" stroke="currentColor" stroke-width="5" fill="none"/>',
        team: '<circle cx="34" cy="32" r="13" fill="currentColor"/><circle cx="66" cy="32" r="13" fill="currentColor"/><path d="M10 78 Q12 52 34 52 Q48 52 52 62 Q56 52 66 52 Q88 52 90 78 Z" fill="currentColor"/>',
        care: '<path d="M50 84 Q14 60 12 38 Q10 18 30 16 Q44 16 50 30 Q56 16 70 16 Q90 18 88 38 Q86 60 50 84 Z" fill="currentColor"/>',
        rest: '<path d="M62 14 Q36 18 30 46 Q26 76 56 86 Q78 90 90 72 Q62 76 52 56 Q42 34 62 14 Z" fill="currentColor"/><path d="M70 24 L82 24 L70 38 L82 38" stroke="currentColor" stroke-width="5" fill="none" stroke-linejoin="round"/>',
        money: '<circle cx="50" cy="50" r="36" fill="currentColor"/><text x="50" y="64" text-anchor="middle" font-size="42" font-weight="900" fill="#0b1220" font-family="Inter,sans-serif">€</text>',
        next: '<path d="M22 20 L58 50 L22 80 Z M52 20 L88 50 L52 80 Z" fill="currentColor"/>',
        lock: '<rect x="22" y="44" width="56" height="42" rx="8" fill="currentColor"/><path d="M34 44 L34 32 Q34 16 50 16 Q66 16 66 32 L66 44" stroke="currentColor" stroke-width="8" fill="none"/>',
        check: '<path d="M18 52 L40 74 L84 26" stroke="currentColor" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        star: '<path d="M50 8 L62 38 L94 38 L68 58 L78 90 L50 70 L22 90 L32 58 L6 38 L38 38 Z" fill="currentColor"/>'
    };
    A.icon = function (key) { return '<svg class="ic" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + (IC[key] || '') + '</svg>'; };

    G.PPART = A;
})(typeof window !== 'undefined' ? window : globalThis);
