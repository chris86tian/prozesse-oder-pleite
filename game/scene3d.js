/* Prozesse oder Pleite – 3D-Stadt (three.js r149)
   Jede Firma ist ein Grundstück: Gebäude wächst mit, Prozesse = Zahnräder,
   Team = Figuren, Kunden = Lieferwagen, Kontostand = Münzturm, Chaos = Rauch/Feuer. */
(function (G) {
    'use strict';
    var T = G.THREE;
    var P = { ok: false };
    G.PP3D = P;
    var noop = function () { };
    ['init', 'setPlayers', 'update', 'view', 'coins', 'confetti', 'storm', 'flash'].forEach(function (k) { P[k] = noop; });
    if (!T) return;

    var TV = /AFT|Android/i.test(navigator.userAgent);
    var W = 1280, H = 720;
    var renderer, scene, camera, canvas;
    var plots = [];
    var mode = 'off', focus = 0, running = false, lastFrame = 0, time = 0;
    var cam = { tx: 0, ty: 3, tz: 0, x: 0, y: 14, z: 26, off: 0, wantOff: 0, ang: 0 };
    var cars = [], coinsPool = [], confettiSys = null, stars = null;
    var geo = {}, mat = {};
    var fpsN = 0, fpsT = 0;

    /* ---------------- Hilfen ---------------- */
    function lerp(a, b, k) { return a + (b - a) * k; }
    function easeOutBack(t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
    function col(hex) { return new T.Color(hex); }

    function windowTexture(lit) {
        var c = document.createElement('canvas'); c.width = 64; c.height = 64;
        var g = c.getContext('2d');
        g.fillStyle = '#1e293b'; g.fillRect(0, 0, 64, 64);
        for (var y = 0; y < 2; y++) for (var x = 0; x < 2; x++) {
            var on = Math.random() < lit;
            g.fillStyle = on ? (Math.random() < 0.8 ? '#fde68a' : '#bae6fd') : '#334155';
            g.fillRect(6 + x * 30, 8 + y * 30, 22, 20);
        }
        var t = new T.CanvasTexture(c);
        t.wrapS = t.wrapT = T.RepeatWrapping;
        return t;
    }
    function texRepeat(base, rx, ry) { var t = base.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; }

    function labelSprite(text, color) {
        var c = document.createElement('canvas'); c.width = 512; c.height = 128;
        var g = c.getContext('2d');
        g.font = '900 64px Inter, sans-serif';
        var w = Math.min(500, g.measureText(text).width + 70);
        g.fillStyle = 'rgba(11,17,32,0.85)';
        roundRect(g, (512 - w) / 2, 14, w, 100, 50); g.fill();
        g.lineWidth = 8; g.strokeStyle = color; roundRect(g, (512 - w) / 2, 14, w, 100, 50); g.stroke();
        g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(text, 256, 66);
        var t = new T.CanvasTexture(c);
        var s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
        s.scale.set(6, 1.5, 1);
        return s;
    }
    function roundRect(g, x, y, w, h, r) {
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }

    function gearGeometry() {
        var s = new T.Shape(), teeth = 10, rO = 1, rI = 0.8;
        for (var i = 0; i < teeth; i++) {
            var a = i / teeth * Math.PI * 2, st = Math.PI * 2 / teeth;
            var pts = [[a - st * 0.3, rI], [a - st * 0.18, rO], [a + st * 0.18, rO], [a + st * 0.3, rI], [a + st * 0.7, rI]];
            pts.forEach(function (p, k) {
                var x = Math.cos(p[0]) * p[1], y = Math.sin(p[0]) * p[1];
                if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y);
            });
        }
        var hole = new T.Path(); hole.absarc(0, 0, 0.32, 0, Math.PI * 2, true); s.holes.push(hole);
        var g = new T.ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: false, curveSegments: 6 });
        g.center();
        return g;
    }

    /* ---------------- Aufbau ---------------- */
    P.init = function (el) {
        try {
            canvas = el;
            renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !TV, alpha: false, powerPreference: 'high-performance' });
        } catch (e) { return false; }
        if (!renderer.getContext()) return false;
        renderer.setPixelRatio(TV ? 0.85 : Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(W, H, false);
        scene = new T.Scene();
        scene.background = col('#0b1120');
        scene.fog = new T.Fog(0x0b1120, 34, 95);
        camera = new T.PerspectiveCamera(38, W / H, 0.5, 220);

        scene.add(new T.HemisphereLight(0xaab8ff, 0x20123a, 0.75));
        var sun = new T.DirectionalLight(0xfff1dc, 0.8); sun.position.set(14, 24, 12); scene.add(sun);
        var rim = new T.DirectionalLight(0x8b5cf6, 0.55); rim.position.set(-18, 8, -16); scene.add(rim);

        geo.box = new T.BoxGeometry(1, 1, 1);
        geo.gear = gearGeometry();
        geo.coin = new T.CylinderGeometry(0.42, 0.42, 0.12, 16);
        geo.body = new T.CylinderGeometry(0.22, 0.28, 0.7, 8);
        geo.head = new T.SphereGeometry(0.2, 10, 8);
        mat.win = windowTexture(0.75);
        mat.coin = new T.MeshPhongMaterial({ color: 0xfacc15, emissive: 0x6b4500, shininess: 90 });
        mat.dark = new T.MeshLambertMaterial({ color: 0x1e293b });
        mat.skin = new T.MeshLambertMaterial({ color: 0xf1c19d });

        buildWorld();
        buildCoins();
        buildConfetti();
        P.ok = true;
        requestAnimationFrame(loop);
        return true;
    };

    function buildWorld() {
        var ground = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshLambertMaterial({ color: 0x111a30 }));
        ground.rotation.x = -Math.PI / 2; scene.add(ground);
        // Straßen
        var roadMat = new T.MeshLambertMaterial({ color: 0x1a2238 });
        [[0, 10.5, 260, 4], [0, -12, 260, 4]].forEach(function (r) {
            var m = new T.Mesh(new T.PlaneGeometry(r[2], r[3]), roadMat);
            m.rotation.x = -Math.PI / 2; m.position.set(r[0], 0.02, r[1]); scene.add(m);
        });
        var dash = new T.MeshBasicMaterial({ color: 0x64748b });
        for (var i = -30; i <= 30; i++) {
            [10.5, -12].forEach(function (z) {
                var d = new T.Mesh(geo.box, dash); d.scale.set(1.4, 0.02, 0.15); d.position.set(i * 4, 0.04, z); scene.add(d);
            });
        }
        // Hintergrund-Skyline (instanziert)
        var n = 70;
        var bm = new T.MeshLambertMaterial({ color: 0x3a4a7a, map: texRepeat(windowTexture(0.45), 2, 6), emissive: 0x05081a });
        var inst = new T.InstancedMesh(geo.box, bm, n);
        var m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3();
        for (var k = 0; k < n; k++) {
            var side = k % 2 ? 1 : -1;
            var x = -70 + (k * 137) % 140, z = -22 - Math.random() * 26;
            if (k % 5 === 0) { x = side * (26 + Math.random() * 30); z = -6 + Math.random() * 14; }
            var h = 4 + Math.random() * 16;
            pos.set(x, h / 2, z); sc.set(3 + Math.random() * 3, h, 3 + Math.random() * 3);
            m4.compose(pos, q, sc); inst.setMatrixAt(k, m4);
        }
        scene.add(inst);
        // Sterne + Mond
        var sg = new T.BufferGeometry(), sp = [];
        for (var s = 0; s < 260; s++) {
            var a = Math.random() * Math.PI * 2, el = 0.15 + Math.random() * 0.7, r = 120;
            sp.push(Math.cos(a) * Math.cos(el) * r, Math.sin(el) * r * 0.6 + 10, Math.sin(a) * Math.cos(el) * r - 30);
        }
        sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
        stars = new T.Points(sg, new T.PointsMaterial({ color: 0xc7d2fe, size: 0.6, sizeAttenuation: true, fog: false }));
        scene.add(stars);
        var moon = new T.Mesh(new T.SphereGeometry(4, 20, 16), new T.MeshBasicMaterial({ color: 0xfef9c3, fog: false }));
        moon.position.set(40, 42, -90); scene.add(moon);
        // Autos
        for (var c = 0; c < 6; c++) {
            var car = new T.Group();
            var colr = [0xef4444, 0x3b82f6, 0xf59e0b, 0x22c55e, 0xe2e8f0, 0xa855f7][c];
            var body = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: colr })); body.scale.set(2, 0.6, 1); body.position.y = 0.5; car.add(body);
            var top = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0x0f172a })); top.scale.set(1.1, 0.5, 0.9); top.position.set(-0.1, 1.0, 0); car.add(top);
            var light = new T.Mesh(geo.box, new T.MeshBasicMaterial({ color: 0xfef08a })); light.scale.set(0.1, 0.18, 0.8); light.position.set(1.02, 0.55, 0); car.add(light);
            var dir = c % 2 ? 1 : -1;
            car.userData = { dir: dir, speed: 5 + Math.random() * 4, lane: c % 2 ? 9.6 : 11.4 };
            if (c >= 4) car.userData.lane = c % 2 ? -11.1 : -12.9;
            car.position.set(-60 + Math.random() * 120, 0, car.userData.lane);
            car.rotation.y = dir > 0 ? 0 : Math.PI;
            scene.add(car); cars.push(car);
        }
    }

    function buildCoins() {
        for (var i = 0; i < 30; i++) {
            var c = new T.Mesh(geo.coin, mat.coin);
            c.visible = false; c.userData = { v: 0, life: 0 };
            scene.add(c); coinsPool.push(c);
        }
    }
    function buildConfetti() {
        var n = 360, g = new T.BufferGeometry(), p = new Float32Array(n * 3), cl = new Float32Array(n * 3);
        var pal = [col('#f472b6'), col('#facc15'), col('#22d3ee'), col('#4ade80'), col('#a78bfa'), col('#fb923c')];
        for (var i = 0; i < n; i++) { var c = pal[i % pal.length]; cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b; p[i * 3 + 1] = -50; }
        g.setAttribute('position', new T.BufferAttribute(p, 3));
        g.setAttribute('color', new T.BufferAttribute(cl, 3));
        confettiSys = new T.Points(g, new T.PointsMaterial({ size: 0.35, vertexColors: true }));
        confettiSys.userData = { vel: new Float32Array(n * 3), life: 0 };
        confettiSys.frustumCulled = false;
        scene.add(confettiSys);
    }

    /* ---------------- Grundstücke ---------------- */
    function makePlot(i, info) {
        var g = new T.Group();
        var accent = col(info.color);
        var base = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0x1b2747 })); base.scale.set(13, 0.5, 13); base.position.y = 0.25; g.add(base);
        var plaza = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0x24345e })); plaza.scale.set(12.2, 0.1, 12.2); plaza.position.y = 0.55; g.add(plaza);
        var edgeMat = new T.MeshBasicMaterial({ color: accent });
        [[0, 6.5, 13, 0.25], [0, -6.5, 13, 0.25], [6.5, 0, 0.25, 13], [-6.5, 0, 0.25, 13]].forEach(function (e) {
            var m = new T.Mesh(geo.box, edgeMat); m.scale.set(e[2], 0.12, e[3]); m.position.set(e[0], 0.56, e[1]); g.add(m);
        });
        // Leuchtring (aktiver Spieler)
        var ring = new T.Mesh(new T.RingGeometry(7.6, 8.2, 48), new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.0, side: T.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
        // Bäume
        [[-5.4, -5.4], [5.4, -5.4], [-5.4, 4.2]].forEach(function (t) {
            var trunk = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0x713f12 })); trunk.scale.set(0.25, 0.8, 0.25); trunk.position.set(t[0], 1.0, t[1]); g.add(trunk);
            var crown = new T.Mesh(new T.IcosahedronGeometry(0.75, 0), new T.MeshLambertMaterial({ color: 0x16a34a, flatShading: true })); crown.position.set(t[0], 1.85, t[1]); g.add(crown);
        });
        var label = labelSprite(info.name, info.color); label.position.set(0, 9, 0); g.add(label);

        var plot = {
            group: g, info: info, ring: ring, label: label, level: -1, building: null, buildAnim: 1,
            gears: [], people: [], vans: [], coins: [], smoke: null, fire: null, fireLight: null, cloud: null, flashT: 0
        };
        // Zahnräder: kreisen als Ring um die Firma (ein Zahnrad je Prozess)
        var gearCols = [0x8b5cf6, 0xfacc15, 0x22d3ee, 0x4ade80, 0xf472b6, 0xfb923c, 0x60a5fa, 0xe879f9];
        plot.gearRing = new T.Group(); g.add(plot.gearRing);
        for (var k = 0; k < 8; k++) {
            var a = k / 8 * Math.PI * 2;
            var holder = new T.Group();
            holder.position.set(Math.cos(a) * 6.6, 2.6 + (k % 2) * 1.3, Math.sin(a) * 6.6);
            holder.rotation.y = -a + Math.PI / 2;
            var gm = new T.Mesh(geo.gear, new T.MeshLambertMaterial({ color: gearCols[k], emissive: gearCols[k], emissiveIntensity: 0.35 }));
            var gs = k % 2 ? 0.7 : 0.9;
            gm.scale.set(gs, gs, 1);
            holder.add(gm);
            gm.visible = false; gm.userData = { dir: k % 2 ? -1 : 1, pop: 0, s: gs };
            plot.gearRing.add(holder); plot.gears.push(gm);
        }
        // Lieferwagen-Parkplatz (vorn)
        for (var v = 0; v < 10; v++) {
            var van = new T.Group();
            var vb = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: 0xf1f5f9 })); vb.scale.set(0.9, 0.7, 1.5); vb.position.y = 0.95; van.add(vb);
            var vr = new T.Mesh(geo.box, new T.MeshLambertMaterial({ color: col(info.caseColor) })); vr.scale.set(0.92, 0.18, 1.0); vr.position.set(0, 1.25, -0.2); van.add(vr);
            var x = -4.6 + (v % 5) * 2.3, z = 4.9 + Math.floor(v / 5) * 0.0;
            if (v >= 5) { x = -4.6 + (v - 5) * 2.3; z = 3.0; }
            van.position.set(x, 0, z); van.visible = false; van.userData = { pop: 0 };
            g.add(van); plot.vans.push(van);
        }
        // Team-Figuren
        var roleCol = { sales: 0xfacc15, delivery: 0x22d3ee, assist: 0xf472b6, boss: col(info.color).getHex() };
        for (var p = 0; p < 7; p++) {
            var fig = new T.Group();
            var body = new T.Mesh(geo.body, new T.MeshLambertMaterial({ color: 0xffffff })); body.position.y = 0.95; fig.add(body);
            var head = new T.Mesh(geo.head, mat.skin); head.position.y = 1.5; fig.add(head);
            fig.visible = false; fig.userData = { a: p * 0.9, r: 3.6 + (p % 3) * 0.55, sp: 0.35 + (p % 4) * 0.08, body: body, roleCol: roleCol };
            g.add(fig); plot.people.push(fig);
        }
        // Münzturm (links vorn)
        for (var c = 0; c < 14; c++) {
            var coin = new T.Mesh(geo.coin, mat.coin);
            coin.position.set(4.4 + (c % 2) * 0.05, 0.66 + c * 0.13, 3.6);
            coin.visible = false; g.add(coin); plot.coins.push(coin);
        }
        // Rauch
        var sg = new T.BufferGeometry(), sp = new Float32Array(40 * 3);
        sg.setAttribute('position', new T.BufferAttribute(sp, 3));
        plot.smoke = new T.Points(sg, new T.PointsMaterial({ color: 0x9ca3af, size: 1.4, transparent: true, opacity: 0.55, depthWrite: false }));
        plot.smoke.userData = { seed: Array.from({ length: 40 }, function () { return Math.random(); }) };
        plot.smoke.visible = false; plot.smoke.frustumCulled = false; g.add(plot.smoke);
        // Feuer
        plot.fire = new T.Group();
        for (var f = 0; f < 5; f++) {
            var fl = new T.Mesh(new T.ConeGeometry(0.45, 1.6, 6), new T.MeshBasicMaterial({ color: f % 2 ? 0xfb923c : 0xfacc15, transparent: true, opacity: 0.9 }));
            fl.position.set((f - 2) * 0.5, 0, (f % 2) * 0.4); plot.fire.add(fl);
        }
        plot.fire.visible = false; g.add(plot.fire);
        plot.fireLight = new T.PointLight(0xfb923c, 0, 14); plot.fireLight.position.set(0, 6, 2); g.add(plot.fireLight);
        // Gewitterwolke
        plot.cloud = new T.Group();
        var cm = new T.MeshLambertMaterial({ color: 0x374151, transparent: true, opacity: 0.95 });
        [[0, 0, 0, 2.2], [1.9, -0.2, 0.3, 1.7], [-1.9, -0.3, -0.2, 1.6], [0.8, 0.6, -0.6, 1.5]].forEach(function (b) {
            var s = new T.Mesh(new T.IcosahedronGeometry(b[3], 1), cm); s.position.set(b[0], b[1], b[2]); plot.cloud.add(s);
        });
        plot.cloud.position.set(0, 14, 0); plot.cloud.visible = false; g.add(plot.cloud);
        plot.bolt = new T.PointLight(0xbfdbfe, 0, 30); plot.bolt.position.set(0, 12, 2); g.add(plot.bolt);
        scene.add(g);
        return plot;
    }

    function buildBuilding(plot, level) {
        if (plot.building) plot.group.remove(plot.building);
        var b = new T.Group();
        var accent = col(plot.info.caseColor);
        var wall = new T.MeshLambertMaterial({ color: 0xcbd5e1 });
        var roof = new T.MeshLambertMaterial({ color: 0x334155 });
        var acc = new T.MeshLambertMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35 });
        function box(w, h, d, x, y, z, m) { var mm = new T.Mesh(geo.box, m); mm.scale.set(w, h, d); mm.position.set(x, y, z); b.add(mm); return mm; }
        function tower(w, h, d, x, z, rx, ry) {
            var side = new T.MeshLambertMaterial({ color: 0xffffff, map: texRepeat(mat.win, rx, ry), emissive: 0xffffff, emissiveMap: texRepeat(mat.win, rx, ry), emissiveIntensity: 0.55 });
            var m = new T.Mesh(geo.box, [side, side, roof, roof, side, side]);
            m.scale.set(w, h, d); m.position.set(x, 0.6 + h / 2, z); b.add(m); return m;
        }
        if (level <= 0) {
            box(4, 2.4, 3.6, 0, 1.8, -0.6, new T.MeshLambertMaterial({ color: 0x94a3b8 }));
            box(4.4, 0.35, 4, 0, 3.15, -0.6, roof);
            var door = box(3, 1.7, 0.1, 0, 1.45, 1.22, new T.MeshLambertMaterial({ color: 0x64748b }));
            for (var s = 0; s < 6; s++) box(3, 0.06, 0.12, 0, 0.8 + s * 0.28, 1.25, mat.dark);
            box(2.2, 0.5, 0.2, 0, 2.75, 1.25, acc);
        } else if (level === 1) {
            box(6, 3, 4.4, 0, 2.1, -0.8, wall);
            box(6.4, 0.35, 4.8, 0, 3.75, -0.8, roof);
            box(3.4, 1.6, 0.1, -0.9, 2.0, 1.45, new T.MeshLambertMaterial({ color: 0x7dd3fc, emissive: 0x7dd3fc, emissiveIntensity: 0.5 }));
            box(1.2, 2.0, 0.1, 1.9, 1.6, 1.45, new T.MeshLambertMaterial({ color: 0x475569 }));
            box(6.2, 0.25, 1.0, 0, 3.1, 1.8, acc);
            box(3, 0.7, 0.2, 0, 4.3, 1.2, acc);
        } else if (level === 2) {
            tower(6.4, 7, 5, 0, -0.8, 3, 4);
            box(6.8, 0.4, 5.4, 0, 7.8, -0.8, acc);
            box(1.8, 2.0, 0.3, 0, 1.6, 1.8, new T.MeshLambertMaterial({ color: 0x0f172a }));
            box(3.4, 0.8, 0.25, 0, 6.6, 1.75, acc);
        } else {
            tower(4.8, 13, 4.6, 0, -1.2, 2, 8);
            tower(3.2, 6, 4, -4.0, -0.8, 2, 4);
            tower(3.2, 8, 4, 4.0, -1.0, 2, 5);
            box(5.2, 0.5, 5.0, 0, 13.85, -1.2, acc);
            box(0.18, 3, 0.18, 0, 15.6, -1.2, new T.MeshLambertMaterial({ color: 0xe2e8f0 }));
            var flag = box(1.3, 0.7, 0.06, 0.7, 16.7, -1.2, acc); flag.userData.flag = true;
            box(4.9, 0.35, 0.3, 0, 4.2, 1.15, acc);
            box(1.8, 2.2, 0.3, 0, 1.7, 1.15, new T.MeshLambertMaterial({ color: 0x0f172a }));
        }
        plot.group.add(b);
        plot.building = b;
        plot.buildAnim = plot.level < 0 ? 1 : 0;   // beim ersten Aufbau ohne Animation
        if (plot.level >= 0 && level > plot.level) P.coins(plots.indexOf(plot), 12);
        plot.level = level;
        plot.label.position.y = [5.6, 6.4, 9.6, 17.6][Math.max(0, level)];
        plot.cloud.position.y = plot.label.position.y + 4;
    }

    P.setPlayers = function (list) {
        if (!P.ok) return;
        plots.forEach(function (p) { scene.remove(p.group); });
        plots = [];
        var xs = list.length === 1 ? [0] : [-9, 9];
        list.forEach(function (info, i) {
            var p = makePlot(i, info);
            p.group.position.x = xs[i];
            plots.push(p);
        });
    };

    /* Zustand einer Firma in die Szene übernehmen */
    P.update = function (i, st) {
        var p = plots[i];
        if (!p) return;
        if (st.level !== p.level) buildBuilding(p, st.level);
        p.gears.forEach(function (g, k) {
            var on = k < st.procs;
            if (on && !g.visible) { g.visible = true; g.userData.pop = 0; }
            if (!on) g.visible = false;
        });
        p.vans.forEach(function (v, k) {
            var on = k < Math.min(10, st.customers);
            if (on && !v.visible) { v.visible = true; v.userData.pop = 0; }
            if (!on) v.visible = false;
        });
        var roles = ['boss'].concat(st.staff || []);
        p.people.forEach(function (f, k) {
            var r = roles[k];
            f.visible = !!r;
            if (r) f.userData.body.material.color.setHex(f.userData.roleCol[r]);
        });
        var coinsN = st.cash <= 0 ? 0 : Math.min(14, Math.ceil(Math.log(1 + st.cash / 2500) * 3.2));
        p.coins.forEach(function (c, k) { c.visible = k < coinsN; });
        p.smoke.visible = st.chaos >= 45;
        p.fire.visible = st.chaos >= 75;
        p.fireLight.intensity = st.chaos >= 75 ? 1.4 : 0;
        var top = [3.4, 4.2, 8.2, 14.2][Math.max(0, st.level)];
        p.fire.position.set(0, top + 0.5, -0.8);
        p.smoke.userData.top = top;
    };

    /* Kamera-Modi: title | hub | handover | final | event | off */
    P.view = function (m, idx) {
        if (!P.ok) return;
        mode = m;
        if (typeof idx === 'number') focus = idx;
        canvas.style.visibility = m === 'off' ? 'hidden' : 'visible';
        plots.forEach(function (p, i) { p.active = (m === 'hub' || m === 'handover') && i === focus && plots.length > 1; });
    };

    P.coins = function (i, n) {
        var p = plots[i]; if (!p) return;
        var c = 0;
        for (var k = 0; k < coinsPool.length && c < (n || 10); k++) {
            var coin = coinsPool[k];
            if (coin.visible) continue;
            coin.visible = true;
            coin.position.set(p.group.position.x + (Math.random() - 0.5) * 9, 14 + Math.random() * 6, (Math.random() - 0.5) * 7);
            coin.userData = { v: 0, life: 2.2, spin: (Math.random() - 0.5) * 12 };
            c++;
        }
    };
    P.confetti = function (i) {
        var p = plots[i]; if (!p || !confettiSys) return;
        var pos = confettiSys.geometry.attributes.position.array, vel = confettiSys.userData.vel;
        for (var k = 0; k < pos.length / 3; k++) {
            pos[k * 3] = p.group.position.x + (Math.random() - 0.5) * 2;
            pos[k * 3 + 1] = 10 + Math.random() * 3;
            pos[k * 3 + 2] = (Math.random() - 0.5) * 2;
            vel[k * 3] = (Math.random() - 0.5) * 14; vel[k * 3 + 1] = 6 + Math.random() * 10; vel[k * 3 + 2] = (Math.random() - 0.5) * 14;
        }
        confettiSys.userData.life = 5;
        confettiSys.geometry.attributes.position.needsUpdate = true;
    };
    P.storm = function (i, on) { var p = plots[i]; if (p) { p.cloud.visible = !!on; p.stormOn = !!on; } };
    P.flash = function (i) { var p = plots[i]; if (p) p.flashT = 0.35; };

    /* ---------------- Animation ---------------- */
    function loop(t) {
        requestAnimationFrame(loop);
        if (mode === 'off' || document.hidden) { lastFrame = t; return; }
        var minDt = TV ? 1000 / 30 : 1000 / 60;
        if (t - lastFrame < minDt - 1) return;
        var dt = Math.min(0.1, (t - lastFrame) / 1000); lastFrame = t; time += dt;
        animate(dt);
        renderer.render(scene, camera);
        fpsN++; if (t - fpsT > 1000) { P.fps = Math.round(fpsN * 1000 / (t - fpsT)); fpsN = 0; fpsT = t; if (G.PP_SHOW_FPS) { var el = document.getElementById('fps'); if (!el) { el = document.createElement('div'); el.id = 'fps'; el.style.cssText = 'position:absolute;right:8px;top:4px;z-index:99;color:#0f0;font:700 18px monospace;background:#000a;padding:2px 6px'; document.body.appendChild(el); } el.textContent = P.fps + ' fps'; } }
    }

    function animate(dt) {
        // Kamera
        var target = plots[focus] ? plots[focus].group.position.x : 0;
        var dist = 27, height = 13, off = 0, swing = 0.32, lookY = 4;
        if (mode === 'title') { off = -290; dist = 42; height = 16; lookY = 7.5; swing = 0; cam.ang += dt * 0.12; }
        else if (mode === 'hub') { off = 330; dist = 32; height = 17; lookY = 0.5; }
        else if (mode === 'handover') { dist = 27; height = 12; lookY = 2.5; swing = 0; }
        else if (mode === 'event') { off = 330; dist = 22; height = 10; }
        else if (mode === 'final') { target = 0; dist = plots.length > 1 ? 57 : 34; height = 21; lookY = plots.length > 1 ? -3.5 : 7; swing = 0; cam.ang = Math.sin(time * 0.15) * 0.35; }
        var a = swing ? Math.sin(time * 0.18) * swing : cam.ang;
        if (mode === 'handover') a = (plots.length > 1 ? (focus === 0 ? -0.5 : 0.5) : 0) + Math.sin(time * 0.3) * 0.22;
        if (mode === 'hub' && plots.length > 1) a += focus === 0 ? -0.25 : 0.25;
        var k = 1 - Math.exp(-dt * 2.2);
        cam.tx = lerp(cam.tx, target, k);
        cam.x = lerp(cam.x, cam.tx + Math.sin(a) * dist, k);
        cam.y = lerp(cam.y, height, k);
        cam.z = lerp(cam.z, Math.cos(a) * dist, k);
        cam.off = lerp(cam.off, off, k);
        camera.position.set(cam.x, cam.y, cam.z);
        camera.lookAt(cam.tx, lookY, 0);
        camera.setViewOffset(W, H, cam.off, 0, W, H);

        cars.forEach(function (c) {
            c.position.x += c.userData.dir * c.userData.speed * dt;
            if (c.position.x > 70) c.position.x = -70;
            if (c.position.x < -70) c.position.x = 70;
        });

        plots.forEach(function (p) {
            // aktiver Spieler: Ring pulsiert
            p.ring.material.opacity = p.active ? 0.45 + Math.sin(time * 3) * 0.25 : 0;
            if (p.building) {
                if (p.buildAnim < 1) {
                    p.buildAnim = Math.min(1, p.buildAnim + dt / 1.1);
                    var s = Math.max(0.01, easeOutBack(p.buildAnim));
                    p.building.scale.set(1, s, 1);
                }
                p.building.children.forEach(function (ch) { if (ch.userData.flag) ch.rotation.y = Math.sin(time * 3) * 0.3; });
            }
            p.gearRing.rotation.y += dt * 0.22;
            p.gears.forEach(function (g) {
                if (!g.visible) return;
                g.rotation.z += dt * 1.2 * g.userData.dir;
                if (g.userData.pop < 1) { g.userData.pop = Math.min(1, g.userData.pop + dt * 1.6); var s = easeOutBack(g.userData.pop) * g.userData.s; g.scale.set(s, s, 1); }
            });
            p.vans.forEach(function (v) {
                if (v.visible && v.userData.pop < 1) { v.userData.pop = Math.min(1, v.userData.pop + dt * 2); var s = easeOutBack(v.userData.pop); v.scale.set(s, s, s); }
            });
            p.people.forEach(function (f) {
                if (!f.visible) return;
                var u = f.userData; u.a += dt * u.sp;
                f.position.set(Math.cos(u.a) * u.r, Math.abs(Math.sin(time * 7 + u.a * 3)) * 0.12, Math.sin(u.a) * u.r * 0.75 + 0.6);
                f.rotation.y = -u.a;
            });
            if (p.smoke.visible) {
                var arr = p.smoke.geometry.attributes.position.array, seed = p.smoke.userData.seed, top = p.smoke.userData.top || 4;
                for (var i = 0; i < 40; i++) {
                    var life = (time * 0.35 + seed[i]) % 1;
                    arr[i * 3] = Math.sin(seed[i] * 40 + time) * (0.5 + life * 2);
                    arr[i * 3 + 1] = top + life * 7;
                    arr[i * 3 + 2] = -0.8 + Math.cos(seed[i] * 30) * (0.4 + life);
                }
                p.smoke.geometry.attributes.position.needsUpdate = true;
            }
            if (p.fire.visible) {
                p.fire.children.forEach(function (fl, i) { var s = 0.8 + Math.sin(time * 14 + i * 2) * 0.25; fl.scale.set(1, s, 1); fl.position.y = s * 0.6; });
                p.fireLight.intensity = 1.2 + Math.sin(time * 20) * 0.4;
            }
            if (p.cloud.visible) {
                p.cloud.rotation.y += dt * 0.2;
                if (Math.random() < dt * 0.6) p.flashT = 0.25;
            }
            if (p.flashT > 0) { p.flashT -= dt; p.bolt.intensity = p.flashT > 0 ? 6 * (p.flashT / 0.35) : 0; }
        });

        coinsPool.forEach(function (c) {
            if (!c.visible) return;
            var u = c.userData; u.life -= dt; u.v -= 25 * dt;
            c.position.y = Math.max(0.7, c.position.y + u.v * dt);
            if (c.position.y <= 0.7 && u.v < 0) u.v = -u.v * 0.35;
            c.rotation.x += u.spin * dt; c.rotation.z += u.spin * 0.6 * dt;
            if (u.life <= 0) c.visible = false;
        });
        if (confettiSys && confettiSys.userData.life > 0) {
            var cu = confettiSys.userData; cu.life -= dt;
            var pos = confettiSys.geometry.attributes.position.array, vel = cu.vel;
            for (var j = 0; j < pos.length / 3; j++) {
                vel[j * 3 + 1] -= 9 * dt; vel[j * 3] *= 0.985; vel[j * 3 + 2] *= 0.985;
                if (vel[j * 3 + 1] < -2.5) vel[j * 3 + 1] = -2.5;
                pos[j * 3] += vel[j * 3] * dt; pos[j * 3 + 1] += vel[j * 3 + 1] * dt; pos[j * 3 + 2] += vel[j * 3 + 2] * dt;
                if (cu.life <= 0) pos[j * 3 + 1] = -50;
            }
            confettiSys.geometry.attributes.position.needsUpdate = true;
        }
    }
})(window);
