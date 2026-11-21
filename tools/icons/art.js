/* Gemeinsame Bausteine für Banner und Icon (wird von Chrome headless gerendert) */
function gearPath(cx, cy, rOut, rIn, teeth) {
    var d = '', step = Math.PI * 2 / teeth;
    for (var i = 0; i < teeth; i++) {
        var a = i * step - Math.PI / 2;
        var pts = [
            [a - step * 0.30, rIn], [a - step * 0.18, rOut], [a + step * 0.18, rOut], [a + step * 0.30, rIn], [a + step * 0.70, rIn]
        ];
        pts.forEach(function (p, k) {
            var x = (cx + Math.cos(p[0]) * p[1]).toFixed(2), y = (cy + Math.sin(p[0]) * p[1]).toFixed(2);
            d += (i === 0 && k === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
        });
    }
    return d + 'Z';
}

/* Zahnrad mit Wachstums-Diagramm, Mittelpunkt (cx, cy), Außenradius R */
function emblem(cx, cy, R) {
    var s = R / 118;
    function X(v) { return (cx + v * s).toFixed(2); }
    function Y(v) { return (cy + v * s).toFixed(2); }
    var g = '';
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * 1.25) + '" fill="url(#glow)"/>';
    g += '<path d="' + gearPath(cx, cy, R, R * 0.84, 10) + '" fill="url(#gear)" stroke="#c4b5fd" stroke-width="' + (2 * s) + '" stroke-linejoin="round"/>';
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * 0.68) + '" fill="url(#disk)" stroke="#4c1d95" stroke-width="' + (4 * s) + '"/>';
    // Balken
    var base = 46, bars = [[-50, 30, '#22d3ee'], [-14, 52, '#4ade80'], [22, 78, '#facc15']];
    bars.forEach(function (b) {
        g += '<rect x="' + X(b[0]) + '" y="' + Y(base - b[1]) + '" width="' + (26 * s).toFixed(2) + '" height="' + (b[1] * s).toFixed(2) + '" rx="' + (5 * s).toFixed(2) + '" fill="' + b[2] + '"/>';
    });
    // Pfeil nach oben
    g += '<path d="M' + X(-62) + ' ' + Y(4) + ' L' + X(-24) + ' ' + Y(-22) + ' L' + X(4) + ' ' + Y(-8) + ' L' + X(50) + ' ' + Y(-52) + '" fill="none" stroke="#fff" stroke-width="' + (9 * s).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    g += '<path d="M' + X(30) + ' ' + Y(-58) + ' L' + X(60) + ' ' + Y(-62) + ' L' + X(56) + ' ' + Y(-32) + ' Z" fill="#fff" stroke="#fff" stroke-width="' + (4 * s).toFixed(2) + '" stroke-linejoin="round"/>';
    return g;
}

function coins(x, y, r) {
    var g = '';
    for (var i = 0; i < 3; i++) {
        var yy = y - i * r * 0.42;
        g += '<ellipse cx="' + x + '" cy="' + (yy + r * 0.16) + '" rx="' + r + '" ry="' + (r * 0.36) + '" fill="#b45309"/>';
        g += '<ellipse cx="' + x + '" cy="' + yy + '" rx="' + r + '" ry="' + (r * 0.36) + '" fill="url(#coin)" stroke="#92400e" stroke-width="' + (r * 0.05) + '"/>';
    }
    // aufrecht stehende Münze mit Euro
    var cx = x + r * 0.95, cy = y - r * 1.05;
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.78) + '" fill="url(#coin)" stroke="#92400e" stroke-width="' + (r * 0.07) + '"/>';
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.58) + '" fill="none" stroke="#d97706" stroke-width="' + (r * 0.05) + '"/>';
    g += '<text x="' + cx + '" y="' + (cy + r * 0.3) + '" text-anchor="middle" font-family="Inter" font-weight="900" font-size="' + (r * 0.85) + '" fill="#92400e">€</text>';
    return g;
}

var DEFS = '<defs>' +
    '<radialGradient id="bg" cx="0.25" cy="0.5" r="0.9"><stop offset="0" stop-color="#3b1d8f"/><stop offset="0.55" stop-color="#151a3d"/><stop offset="1" stop-color="#0b1120"/></radialGradient>' +
    '<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#8b5cf6" stop-opacity="0.55"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="gear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#5b21b6"/></linearGradient>' +
    '<linearGradient id="disk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#0f0a2e"/></linearGradient>' +
    '<linearGradient id="coin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fef08a"/><stop offset="0.5" stop-color="#facc15"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>' +
    '<linearGradient id="pleite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f87171"/><stop offset="0.5" stop-color="#fb923c"/><stop offset="1" stop-color="#facc15"/></linearGradient>' +
    '</defs>';
