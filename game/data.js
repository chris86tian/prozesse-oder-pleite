/* Prozesse oder Pleite – Spielinhalte (Cases, Prozesse, Team, Ereignisse, Dialoge) */
(function (G) {
    'use strict';
    var D = {};

    /* ---------- Business Cases ---------- */
    D.caseOrder = ['agentur', 'handwerk', 'roesterei', 'software'];
    D.cases = {
        agentur: {
            id: 'agentur', name: 'Werbeagentur', color: '#8b5cf6', diff: 1,
            tag: 'Wenige Kunden, die jeden Monat zahlen.',
            twist: 'Jeder Kunde zählt – verlierst du einen, tut es richtig weh.',
            startCash: 15000, fix: 2500, setup: 2500, mrr: 1500, duration: null, varPct: 0,
            cap: 3, staffCap: 4, churn: 0.06, hitLeads: 1, salesCloses: 1, salaryMult: 1,
            unit: 'Kunde', units: 'Kunden', payWord: 'pro Monat',
            acq: 'Kaltakquise', acqDesc: 'Greif zum Hörer! Stoppe den Zeiger in der grünen Zone – jeder Treffer ist ein Interessent.',
            care: 'Kunden pflegen',
            stars: [140000, 320000, 550000],
            companies: ['Zahnarztpraxis Dr. Lenz', 'Autohaus Petersen', 'Möbelhaus Wagner', 'Bäckerei Krume', 'Kanzlei Stein & Partner', 'Fitnesspark Aktiv', 'Hotel Seeblick', 'Weingut Rebstock', 'Optik Klarblick', 'Fahrschule Vollgas'],
            wants: ['eine neue Website', 'mehr Anfragen über Social Media', 'ein frisches Logo', 'eine Kampagne für neue Mitarbeiter'],
            procs: {
                crm: 'Akquise-Leitfaden', delivery: 'Projekt-Checklisten', auto: 'Vorlagen & Automationen', books: 'Buchhaltung & Controlling',
                qa: 'Feedback-Schleifen', marketing: 'Content-Maschine', handbook: 'Agentur-Handbuch', deputy: 'Teamleitung'
            },
            roles: { sales: 'Vertriebler', delivery: 'Kreative', assist: 'Assistenz' }
        },
        handwerk: {
            id: 'handwerk', name: 'Handwerksbetrieb', color: '#f59e0b', diff: 2,
            tag: 'Volle Auftragsbücher, aber zu wenig Hände.',
            twist: 'Aufträge enden nach 2 Monaten – du brauchst ständig Nachschub und Leute.',
            startCash: 14000, fix: 3500, setup: 2500, mrr: 4000, duration: 2, varPct: 0.35,
            cap: 2, staffCap: 2, churn: 0, hitLeads: 2, salesCloses: 1, salaryMult: 1,
            unit: 'Auftrag', units: 'Aufträge', payWord: 'pro Monat (2 Monate)',
            acq: 'Angebote schreiben', acqDesc: 'Die Nachfrage ist riesig. Stoppe den Zeiger in der grünen Zone – jeder Treffer bringt zwei Anfragen.',
            care: 'Baustellen prüfen',
            stars: [25000, 90000, 200000],
            companies: ['Familie Yilmaz', 'Familie Hoffmann', 'Hausverwaltung Ritter', 'Café Morgenrot', 'Familie Nowak', 'Praxis Dr. Sommerfeld', 'Kita Sonnenschein', 'Bauträger Nordlicht', 'Familie Lindqvist', 'Gasthof Zur Linde'],
            wants: ['ein neues Bad', 'eine Wärmepumpe', 'die komplette Elektrik neu', 'eine Wallbox mit Solaranlage'],
            procs: {
                crm: 'Angebots-Baukasten', delivery: 'Baustellen-Ablaufplan', auto: 'Lager & Materialplanung', books: 'Buchhaltung & Nachkalkulation',
                qa: 'Abnahme-Protokolle', marketing: 'Empfehlungs-System', handbook: 'Betriebs-Handbuch', deputy: 'Meister als Vertretung'
            },
            roles: { sales: 'Kundenberater', delivery: 'Geselle', assist: 'Bürokraft' }
        },
        roesterei: {
            id: 'roesterei', name: 'Kaffeerösterei', color: '#d97706', diff: 2,
            tag: 'Viele kleine Abo-Kunden, knappe Marge.',
            twist: '35 % vom Umsatz gehen für Bohnen drauf. Nur Menge macht dich profitabel.',
            startCash: 20000, fix: 3000, setup: 500, mrr: 1100, duration: null, varPct: 0.35,
            cap: 5, staffCap: 5, churn: 0.04, hitLeads: 2, salesCloses: 2, salaryMult: 0.9,
            unit: 'Abo-Kunde', units: 'Abo-Kunden', payWord: 'pro Monat',
            acq: 'Verkostungen', acqDesc: 'Lass probieren! Stoppe den Zeiger in der grünen Zone – jeder Treffer bringt zwei Interessenten.',
            care: 'Stammkunden besuchen',
            stars: [40000, 90000, 180000],
            companies: ['Café Morgenrot', 'Büro Kern & Kollegen', 'Hotel Seeblick', 'Coworking Hafen 7', 'Bäckerei Krume', 'Kanzlei Stein & Partner', 'Feinkost Olive', 'Restaurant Linde', 'Agentur Pixelwerk', 'Biomarkt Grünkern'],
            wants: ['jede Woche frische Bohnen', 'eine eigene Hausmischung', 'Kaffee fürs ganze Büro', 'Espresso für die Gastronomie'],
            procs: {
                crm: 'Vertriebs-Leitfaden', delivery: 'Röst- & Versandplan', auto: 'Abfüllanlage & Wartungsplan', books: 'Buchhaltung & Kalkulation',
                qa: 'Qualitätskontrolle', marketing: 'Abo-Shop & Newsletter', handbook: 'Schicht-Handbuch', deputy: 'Betriebsleitung'
            },
            roles: { sales: 'Außendienst', delivery: 'Röster', assist: 'Bürohilfe' }
        },
        software: {
            id: 'software', name: 'Software-Startup', color: '#06b6d4', diff: 3,
            tag: 'Viel Startkapital, das schnell verbrennt.',
            twist: '9.000 € Fixkosten im Monat. Wachse schneller, als das Geld schmilzt.',
            startCash: 55000, fix: 9000, setup: 0, mrr: 1500, duration: null, varPct: 0.05,
            cap: 10, staffCap: 6, churn: 0.07, hitLeads: 2, salesCloses: 2, salaryMult: 1.4,
            unit: 'Lizenzkunde', units: 'Lizenzkunden', payWord: 'pro Monat',
            acq: 'Demo-Termine', acqDesc: 'Zeig, was dein Produkt kann! Stoppe den Zeiger in der grünen Zone – jeder Treffer bringt zwei Interessenten.',
            care: 'Support-Tag',
            stars: [125000, 440000, 770000],
            companies: ['Spedition Rollgut', 'Pflegedienst Herzlich', 'Hausverwaltung Ritter', 'Steuerbüro Zahlmann', 'Maschinenbau Krüger', 'Reisebüro Fernweh', 'Tierklinik Pfote', 'Logistik Nord', 'Autohaus Petersen', 'Bauträger Nordlicht'],
            wants: ['Lizenzen für das ganze Team', 'eine Schnittstelle zum alten System', 'eine Testphase mit zehn Leuten', 'alles – am liebsten gestern'],
            procs: {
                crm: 'Demo-Leitfaden', delivery: 'Onboarding-Strecke', auto: 'Tests & Deploy-Pipeline', books: 'Finanzplanung & Controlling',
                qa: 'Monitoring & Support', marketing: 'Inbound-Marketing', handbook: 'Entwickler-Handbuch', deputy: 'Produktleitung'
            },
            roles: { sales: 'Sales-Managerin', delivery: 'Entwickler', assist: 'Office-Manager' }
        }
    };

    /* ---------- Prozesse ---------- */
    D.procOrder = ['crm', 'delivery', 'handbook', 'books', 'auto', 'qa', 'marketing', 'deputy'];
    D.procs = {
        crm:       { cost: 3000,  upkeep: 100,  fx: '+1 Interessent pro Monat. Mehr Bedenkzeit im Verkauf.' },
        delivery:  { cost: 4000,  upkeep: 0,    fx: '+3 Kapazität. Jeden Monat 5 Chaos weniger.' },
        handbook:  { cost: 3500,  upkeep: 0,    fx: 'Dein Team macht kein Chaos mehr. +1 Kapazität je Fachkraft.' },
        books:     { cost: 2500,  upkeep: 200,  fx: 'Nur 22 % statt 30 % Steuern. Schützt bei Ärger mit Geld.' },
        auto:      { cost: 7000,  upkeep: 300,  fx: '+4 Kapazität. Aktionen kosten weniger Energie.' },
        qa:        { cost: 5000,  upkeep: 200,  fx: 'Kunden bleiben länger. Jeden Monat +2 Ruf.' },
        marketing: { cost: 9000,  upkeep: 600,  fx: '+2 Interessenten pro Monat – ganz von allein.', req: 'crm' },
        deputy:    { cost: 12000, upkeep: 1500, fx: '+1 Aktion pro Monat. Jeden Monat +10 Energie.', reqCount: 3 }
    };

    /* ---------- Team ---------- */
    D.roleOrder = ['sales', 'delivery', 'assist'];
    D.roles = {
        sales:    { salary: 2800, fx: 'Bringt jeden Monat einen Interessenten und schließt selbst ab.' },
        delivery: { salary: 2600, fx: 'Erhöht deine Kapazität deutlich.' },
        assist:   { salary: 1900, fx: 'Jeden Monat +15 Energie für dich und 4 Chaos weniger.' }
    };
    D.hireFee = 1000;
    D.maxStaff = 6;

    D.first = ['Anna', 'Mehmet', 'Julia', 'Thomas', 'Aylin', 'Jonas', 'Sabine', 'David', 'Lena', 'Karl', 'Elif', 'Markus', 'Nina', 'Piotr', 'Clara', 'Ben'];
    D.last = ['Schneider', 'Yilmaz', 'Fischer', 'Weber', 'Kaya', 'Wagner', 'Becker', 'Nowak', 'Hoffmann', 'Schulz', 'Demir', 'Koch', 'Richter', 'Klein', 'Wolf', 'Petrović'];

    /* ---------- Hinweise im Verkaufsgespräch ---------- */
    D.hints = {
        green: ['Entscheidet selbst – niemand redet rein.', 'Das Budget ist schon freigegeben.', 'Kam über eine Empfehlung.', 'Hat klare Ziele und einen festen Termin.', 'Zahlt Rechnungen laut Auskunft pünktlich.', 'Fragt nach dem Ablauf, nicht nach Rabatt.'],
        neutral: ['Hat es ziemlich eilig.', 'Vergleicht noch zwei andere Angebote.', 'Macht so ein Projekt zum ersten Mal.', 'Meldet sich am liebsten per Sprachnachricht.'],
        red: ['„Mein letzter Dienstleister war unfähig. Der davor auch.“', 'Will erst zahlen, wenn alles fertig ist.', 'Erwartet Antworten auch sonntags um 23 Uhr.', '„Das ist doch in fünf Minuten gemacht, oder?“', 'Feilscht schon vor dem Angebot um den Preis.', 'Laut Auskunft laufen drei Mahnverfahren.']
    };
    D.tiers = {
        S: { mult: 0.7, label: 'Kleines Budget' },
        M: { mult: 1.0, label: 'Solides Budget' },
        L: { mult: 1.5, label: 'Großes Budget' }
    };

    /* ---------- Einwände (a[0] = stark, a[1] = okay, a[2] = schwach) ---------- */
    D.objections = [
        { q: 'Das ist mir ehrlich gesagt zu teuer.', a: ['Verstehe. Was kostet es Sie, wenn das Problem noch ein Jahr bleibt?', 'Wir können das Paket etwas kleiner schnüren.', 'Okay, ich gebe Ihnen 50 % Rabatt!'] },
        { q: 'Schicken Sie mir erst mal Unterlagen zu.', a: ['Gern. Welche zwei Fragen sollen die Unterlagen beantworten? Klären wir sie gleich.', 'Mache ich – und ich rufe Donnerstag um zehn dazu an.', 'Klar, ich schicke Ihnen unsere 80-seitige Broschüre.'] },
        { q: 'Das muss ich erst mit meinem Geschäftspartner besprechen.', a: ['Sehr gut. Holen wir ihn kurz dazu, dann hören Sie beide dasselbe.', 'Kein Problem. Wann sprechen Sie beide, damit ich danach anrufe?', 'Ach, der sagt bestimmt Ja. Unterschreiben Sie einfach.'] },
        { q: 'Wir haben dafür schon jemanden.', a: ['Prima. Was würden Sie sich von dem noch wünschen, wenn Sie einen Wunsch frei hätten?', 'Wir können mit einem kleinen Testauftrag starten.', 'Der ist doch viel schlechter als wir!'] },
        { q: 'Gerade ist ein ganz schlechter Zeitpunkt.', a: ['Verstehe. Was müsste passieren, damit es in drei Monaten besser passt als heute?', 'Dann starten wir klein und legen nächsten Monat richtig los.', 'Dann melden Sie sich einfach, wenn es passt.'] },
        { q: 'Können Sie garantieren, dass das funktioniert?', a: ['Garantieren kann ich meinen Ablauf: klare Schritte, feste Termine, messbare Ziele.', 'Ich zeige Ihnen gern drei Kunden, bei denen es geklappt hat.', 'Na klar, hundert Prozent Erfolgsgarantie!'] },
        { q: 'Ihr Wettbewerber ist 30 % günstiger.', a: ['Billiger geht immer. Woran merken Sie in einem Jahr, dass es die richtige Wahl war?', 'Dafür ist bei uns der Service inklusive.', 'Dann gehe ich eben auch 30 % runter.'] },
        { q: 'Ich will erst mal unverbindlich testen. Kostenlos.', a: ['Testen ja, kostenlos nein: Wir starten mit einem kleinen, bezahlten Pilotprojekt.', 'Ich kann Ihnen eine Stunde Beratung schenken.', 'Na gut, die ersten drei Monate sind gratis.'] }
    ];

    /* ---------- Bewährungsproben (Monat 4, 8, 12) ---------- */
    D.bosses = {
        4: {
            id: 'grosskunde', name: 'Dr. Brandt', role: 'Einkaufsleiter eines Konzerns', seed: 4711, bonusProc: 'delivery',
            title: 'Der Großkunde',
            intro: 'Ein Konzern klopft an: riesiger Auftrag, riesige Ansprüche. Wer hier alles zusagt, verkauft seine Seele.',
            rounds: [
                { q: 'Wir zahlen grundsätzlich erst nach 90 Tagen. Das ist bei uns Standard.', a: ['Bei uns gilt: die Hälfte vorab, der Rest nach 14 Tagen. Dafür liefern wir pünktlich.', 'Können wir uns bei 45 Tagen treffen?', 'Selbstverständlich, kein Problem!'] },
                { q: 'Sie müssten exklusiv für uns da sein. Rund um die Uhr.', a: ['Sie bekommen feste Ansprechzeiten und einen klaren Ablauf. Das ist verlässlicher als Dauerbereitschaft.', 'Exklusiv gern – das kostet dann einen Aufschlag.', 'Natürlich, mein Handy ist immer an.'] },
                { q: 'Und den Preis drücken wir noch um 25 %. Dafür gibt es ja Menge.', a: ['Gleicher Preis – dafür nehme ich gern etwas aus dem Umfang. Was darf wegfallen?', 'Bei zwei Jahren Laufzeit kann ich mir 10 % vorstellen.', 'Einverstanden, Hauptsache wir kommen zusammen.'] }
            ],
            out: {
                win: 'Dr. Brandt nickt anerkennend. Der Konzern unterschreibt – zu deinen Bedingungen.',
                mid: 'Ihr einigt euch in der Mitte. Guter Auftrag, aber er bindet viele Kräfte.',
                lose: 'Du hast alles zugesagt. Der Auftrag kommt – zu Knebelbedingungen. Das wird anstrengend.'
            }
        },
        8: {
            id: 'pruefung', name: 'Frau Eisenhut', role: 'Betriebsprüferin vom Finanzamt', seed: 8080, bonusProc: 'books',
            title: 'Die Betriebsprüfung',
            intro: 'Das Finanzamt hat sich angemeldet. Frau Eisenhut lächelt nicht. Sie hat einen sehr spitzen Bleistift dabei.',
            rounds: [
                { q: 'Dann zeigen Sie mir mal die Belege vom letzten Quartal.', a: ['Hier – digital abgelegt, nach Monat und Konto sortiert.', 'Moment, die sind irgendwo in diesem Ordner …', 'Belege? Ich dachte, die Kontoauszüge reichen.'] },
                { q: 'Dieses Abendessen für 480 Euro. War das geschäftlich?', a: ['Ja. Anlass, Teilnehmer und Thema stehen auf dem Bewirtungsbeleg.', 'Das war mit einem Kunden … glaube ich.', 'Das war mein Geburtstag, aber es waren auch Kunden da.'] },
                { q: 'Und das Fahrtenbuch für den Firmenwagen?', a: ['Wird digital geführt: jede Fahrt mit Ziel und Zweck.', 'Ich habe die Fahrten grob geschätzt.', 'Fahrtenbuch? Der Wagen fährt doch fast nur geschäftlich.'] }
            ],
            out: {
                win: 'Frau Eisenhut klappt den Ordner zu. „Selten so saubere Unterlagen gesehen.“ Keine Nachzahlung.',
                mid: 'Ein paar Belege fehlen. Es wird geschätzt – du zahlst 4.000 € nach.',
                lose: 'Das war ein Desaster. 10.000 € Nachzahlung, und dein Schreibtisch sieht aus wie nach einer Razzia.'
            }
        },
        12: {
            id: 'investorin', name: 'Frau Sommer', role: 'Investorin', seed: 1212, bonusProc: 'deputy',
            title: 'Die Investorin',
            intro: 'Zum Jahresende bewertet eine Investorin deine Firma. Ihre Frage ist immer dieselbe: Läuft der Laden auch ohne dich?',
            rounds: [
                { q: 'Was passiert mit der Firma, wenn Sie morgen vier Wochen ausfallen?', a: ['Sie läuft weiter. Die Abläufe stehen fest, und das Team kennt seine Aufgaben.', 'Dann wird es eng, aber mein Team ist motiviert.', 'Ich falle nicht aus. Ich hatte seit drei Jahren keinen Urlaub.'] },
                { q: 'Woher kommen Ihre Kunden im nächsten Jahr?', a: ['Aus einem planbaren Vertrieb: Wir wissen, wie viele Kontakte zu einem Abschluss führen.', 'Vor allem über Empfehlungen. Das lief bisher gut.', 'Die kommen schon. Qualität setzt sich durch.'] },
                { q: 'Warum sollte ich ausgerechnet in Sie investieren?', a: ['Weil die Zahlen stimmen und das Wachstum nicht mehr an mir persönlich hängt.', 'Weil ich härter arbeite als alle anderen.', 'Weil ich ein gutes Bauchgefühl habe.'] }
            ],
            out: {
                win: '„Das ist ein Unternehmen, kein Hamsterrad.“ Frau Sommer bewertet deine Firma mit 30 % Aufschlag.',
                mid: '„Solide, aber noch sehr von Ihnen abhängig.“ Es gibt 10 % Aufschlag auf den Firmenwert.',
                lose: '„Sie haben keinen Betrieb, Sie haben einen Job.“ Kein Aufschlag auf den Firmenwert.'
            }
        }
    };

    /* ---------- Ereignisse ----------
       choice.out: Liste möglicher Ausgänge {p, text, fx}. Ohne p = sicher.
       fx-Schlüssel: cash, chaos, energy, rep, leads, mrrCash (x Monatspreis), loseCustomer, loseStaff,
                     raise (Gehalt +), fix (Fixkosten +), hire (Rolle), gainCustomer {mult}            */
    D.events = [
        {
            id: 'laptop', art: 'fire', title: 'Der Rechner ist tot',
            text: 'Mitten im Monat gibt dein wichtigster Rechner den Geist auf. Wann war das letzte Backup? Gute Frage.',
            choices: [
                { label: 'Neues Gerät kaufen (2.000 €)', out: [{ text: 'Teuer, aber nach einem Tag läuft alles wieder.', fx: { cash: -2000 } }] },
                { label: 'Selbst reparieren und hoffen', out: [{ p: 0.5, text: 'Glück gehabt: Ein neues Netzteil, und er läuft wieder.', fx: { energy: -5 } }, { p: 0.5, text: 'Daten weg. Du baust eine Woche lang alles neu auf.', fx: { chaos: 15, energy: -15 } }] },
                { label: 'Backup einspielen', req: 'auto', out: [{ text: 'Zwei Stunden später arbeitest du weiter, als wäre nichts gewesen.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'steuer', art: 'amt', title: 'Post vom Finanzamt',
            text: 'Ein grauer Umschlag: Nachzahlung für das letzte Jahr. Fällig in 14 Tagen.',
            choices: [
                { label: 'Sofort zahlen (3.000 €)', out: [{ text: 'Weg ist das Geld. Aber die Sache ist erledigt.', fx: { cash: -3000 } }] },
                { label: 'Stundung beantragen', out: [{ text: 'Du zahlst erst mal 1.000 €. Der Papierkrieg kostet Nerven.', fx: { cash: -1000, chaos: 8, energy: -8 } }] },
                { label: 'Aus der Rücklage zahlen', req: 'books', out: [{ text: 'Deine Buchhaltung hatte das längst eingeplant. Es bleiben sogar 1.500 € übrig.', fx: { cash: -1500 } }] }
            ]
        },
        {
            id: 'krank', art: 'krank', title: '{staff} fällt aus',
            text: '{staff} meldet sich für drei Wochen krank. Die Arbeit bleibt liegen.',
            cond: function (s) { return s.staff.length > 0; },
            choices: [
                { label: 'Selbst einspringen', out: [{ text: 'Du arbeitest für zwei. Es geht – irgendwie.', fx: { energy: -25 } }] },
                { label: 'Aushilfe buchen (1.800 €)', out: [{ text: 'Die Aushilfe macht ihre Sache ordentlich.', fx: { cash: -1800 } }] },
                { label: 'Vertretung nach Handbuch', req: 'handbook', out: [{ text: 'Im Handbuch steht alles. Das Team fängt den Ausfall locker ab.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'empfehlung', art: 'sterne', title: 'Eine Empfehlung',
            text: '{cust} schwärmt im Bekanntenkreis von deiner Arbeit. Zwei Leute haben schon nach deiner Nummer gefragt.',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Sofort anrufen', out: [{ text: 'Beide wollen ein Angebot. Frisch empfohlen verkauft es sich am besten.', fx: { leads: 2, energy: -5 } }] },
                { label: 'Erst ein Dankeschön schicken (200 €)', out: [{ text: 'Das Geschenk kommt gut an – und es spricht sich herum.', fx: { cash: -200, rep: 6, leads: 1 } }] }
            ]
        },
        {
            id: 'bewertung', art: 'sturm', title: 'Ein Stern. Mit Ausrufezeichen.',
            text: 'Im Netz steht eine wütende Bewertung: „Nie wieder!“ Sie wird fleißig geteilt.',
            choices: [
                { label: 'Sachlich antworten und das Problem lösen', out: [{ text: 'Der Kunde ändert seine Bewertung. Andere lesen mit und sind beeindruckt.', fx: { energy: -10, rep: 4 } }] },
                { label: 'Ignorieren', out: [{ text: 'Die Bewertung bleibt oben stehen. Monatelang.', fx: { rep: -10 } }] },
                { label: 'Öffentlich zurückschießen', out: [{ p: 0.3, text: 'Deine Antwort geht viral – diesmal zu deinen Gunsten.', fx: { rep: 6, leads: 1 } }, { p: 0.7, text: 'Jetzt diskutiert die halbe Stadt über dich. Nicht nett.', fx: { rep: -18 } }] }
            ]
        },
        {
            id: 'messe', art: 'messe', title: 'Die Branchenmesse',
            text: 'Nächste Woche ist Messe. Ein eigener Stand kostet Geld, bringt aber Kontakte.',
            choices: [
                { label: 'Stand buchen (2.500 €)', out: [{ text: 'Drei Tage Dauerlächeln. Die Visitenkarten-Schale ist voll.', fx: { cash: -2500, leads: 4, rep: 4, energy: -10 } }] },
                { label: 'Nur als Besucher hingehen', out: [{ text: 'Ein gutes Gespräch am Kaffeestand.', fx: { leads: 1, energy: -8 } }] },
                { label: 'Zu Hause bleiben', out: [{ text: 'Du nutzt die ruhige Woche zum Aufräumen.', fx: { chaos: -5 } }] }
            ]
        },
        {
            id: 'abwerben', art: 'maske', title: 'Die Konkurrenz wirbt ab',
            text: 'Ein Wettbewerber bietet {staff} 20 % mehr Gehalt. {staff} fragt, was du dazu sagst.',
            cond: function (s) { return s.staff.length > 0; },
            choices: [
                { label: 'Gehalt erhöhen (+400 € pro Monat)', out: [{ text: '{staff} bleibt. Teurer, aber eingearbeitet.', fx: { raise: 400 } }] },
                { label: 'Ziehen lassen', out: [{ text: '{staff} räumt den Schreibtisch. Das Wissen geht mit.', fx: { loseStaff: true, chaos: 8 } }] },
                { label: 'Entwicklungsweg aus dem Handbuch zeigen', req: 'handbook', out: [{ text: '{staff} sieht eine Zukunft bei dir und bleibt – ohne Aufschlag.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'zuruf', art: 'geld', title: 'Auftrag auf Zuruf',
            text: 'Ein Bekannter will „mal eben schnell“ ein Sonderprojekt. Ohne Vertrag, dafür sofort.',
            choices: [
                { label: 'Machen (4.000 €)', out: [{ text: 'Das Geld ist da. Die Änderungswünsche auch – jeden Abend neue.', fx: { cash: 4000, chaos: 15, energy: -15 } }] },
                { label: 'Nur mit Vertrag und Anzahlung', out: [{ p: 0.6, text: 'Er unterschreibt. Sauberer Auftrag, sauberes Geld.', fx: { cash: 3000, chaos: 3 } }, { p: 0.4, text: '„So förmlich? Dann lass mal.“ Er springt ab.', fx: {} }] },
                { label: 'Freundlich ablehnen', out: [{ text: 'Du bleibst bei deinem Plan.', fx: { energy: 5 } }] }
            ]
        },
        {
            id: 'tool', art: 'preis', title: 'Preiserhöhung',
            text: 'Dein wichtigstes Werkzeug wird teurer: plus 300 € im Monat. Ab sofort.',
            choices: [
                { label: 'Zähneknirschend zahlen', out: [{ text: 'Die Fixkosten steigen dauerhaft um 300 €.', fx: { fix: 300 } }] },
                { label: 'Anbieter wechseln', out: [{ text: 'Der Umzug dauert zwei Wochen und nichts ist da, wo es war.', fx: { chaos: 10, energy: -10 } }] }
            ]
        },
        {
            id: 'muede', art: 'kaffee', title: 'Der Akku ist leer',
            text: 'Du arbeitest seit Wochen durch. Heute Morgen hast du Salz in den Kaffee getan.',
            choices: [
                { label: 'Langes Wochenende, Handy aus', out: [{ text: 'Drei Tage Ruhe. Im Postfach warten 140 Mails.', fx: { energy: 30, chaos: 6 } }] },
                { label: 'Durchziehen mit doppeltem Espresso', out: [{ text: 'Du schaffst viel. Gesund ist das nicht.', fx: { energy: -15, leads: 1 } }] },
                { label: 'Urlaub – die Vertretung übernimmt', req: 'deputy', out: [{ text: 'Eine Woche Meer. Der Laden läuft, als wärst du da.', fx: { energy: 45 } }] }
            ]
        },
        {
            id: 'verzug', art: 'brief', title: 'Die Rechnung ist offen',
            text: '{cust} hat seit 60 Tagen nicht gezahlt. Auf Anrufe folgt nur die Mailbox.',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Freundlich erinnern', out: [{ p: 0.5, text: '„Ach herrje, ganz vergessen!“ Das Geld kommt.', fx: { mrrCash: 1 } }, { p: 0.5, text: 'Keine Reaktion. Das Geld siehst du nie wieder.', fx: {} }] },
                { label: 'Inkasso einschalten', out: [{ text: 'Du bekommst 80 % – und verlierst den Kunden.', fx: { mrrCash: 0.8, loseCustomer: true, rep: -3 } }] },
                { label: 'Automatische Mahnung läuft schon', req: 'books', out: [{ text: 'Die dritte Mahnung hat gewirkt. Alles bezahlt, niemand ist böse.', fx: { mrrCash: 1 } }] }
            ]
        },
        {
            id: 'presse', art: 'zeitung', title: 'Die Zeitung ruft an',
            text: 'Das Lokalblatt möchte ein Porträt über dich schreiben. Kostet einen halben Tag.',
            choices: [
                { label: 'Interview geben', out: [{ text: 'Halbe Seite mit Foto. Deine Mutter kauft zwölf Exemplare.', fx: { energy: -10, rep: 10, leads: 1 } }] },
                { label: 'Keine Zeit', out: [{ text: 'Sie porträtieren stattdessen deinen Wettbewerber.', fx: { rep: -2 } }] }
            ]
        },
        {
            id: 'idee', art: 'idee', title: 'Eine gute Idee',
            text: 'Ein Praktikant fragt: „Warum machen wir das eigentlich jedes Mal von Hand?“ Er hätte da einen Vorschlag.',
            choices: [
                { label: 'Machen lassen (800 €)', out: [{ text: 'Nach einer Woche läuft eine nervige Aufgabe von allein.', fx: { cash: -800, chaos: -15 } }] },
                { label: 'Keine Experimente', out: [{ text: 'Alles bleibt, wie es ist. Leider.', fx: {} }] }
            ]
        },
        {
            id: 'abmahnung', art: 'brief', title: 'Abmahnung',
            text: 'Ein Anwalt schreibt: Auf deiner Website fehlt ein Pflichthinweis. Er will 1.500 €.',
            choices: [
                { label: 'Zahlen und abhaken (1.500 €)', out: [{ text: 'Ärgerlich, aber erledigt.', fx: { cash: -1500 } }] },
                { label: 'Eigene Anwältin einschalten', out: [{ p: 0.5, text: 'Sie drückt die Forderung auf 600 €.', fx: { cash: -600 } }, { p: 0.5, text: 'Der Streit zieht sich. Am Ende kostet es 2.500 €.', fx: { cash: -2500, energy: -5 } }] }
            ]
        },
        {
            id: 'sonderwunsch', art: 'kunde', title: 'Nur eine Kleinigkeit',
            text: '{cust}: „Können Sie das nicht eben noch mit reinnehmen? Ist doch nur eine Kleinigkeit.“',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Na gut, ausnahmsweise', out: [{ text: 'Aus der Kleinigkeit werden drei Tage Arbeit.', fx: { chaos: 12, rep: 3 } }] },
                { label: 'Gern – als Zusatzauftrag', out: [{ p: 0.6, text: 'Der Kunde nickt und zahlt 1.500 € extra.', fx: { cash: 1500 } }, { p: 0.4, text: 'Der Kunde ist verschnupft, verzichtet aber.', fx: { rep: -3 } }] },
                { label: 'Auf den festen Leistungsumfang verweisen', req: 'delivery', out: [{ text: 'Alles steht in der Checkliste. Der Kunde bucht den Zusatz ohne Murren.', fx: { cash: 1000, rep: 2 } }] }
            ]
        },
        {
            id: 'foerderung', art: 'amt', title: 'Fördergeld',
            text: 'Die Stadt fördert Digitalisierung mit 5.000 €. Der Antrag hat 34 Seiten.',
            choices: [
                { label: 'Antrag ausfüllen', out: [{ text: 'Zwei Abende Formulare. Dann kommt die Zusage.', fx: { cash: 5000, energy: -20 } }] },
                { label: 'Zu viel Papierkram', out: [{ text: 'Das Geld bekommt jemand anderes.', fx: {} }] }
            ]
        },
        {
            id: 'bewerbung', art: 'talent', title: 'Eine starke Bewerbung',
            text: 'Eine erfahrene Fachkraft bewirbt sich von selbst bei dir. So jemanden findest du sonst nie.',
            cond: function (s) { return s.staff.length < D.maxStaff; },
            choices: [
                { label: 'Sofort einstellen', out: [{ text: 'Vertrag unterschrieben. Ab Montag hast du mehr Kapazität – und mehr Gehalt zu zahlen.', fx: { hire: 'delivery' } }] },
                { label: 'Absagen', out: [{ text: 'Sie fängt beim Wettbewerber an.', fx: {} }] }
            ]
        },
        /* --- je Business --- */
        {
            id: 'ag_pitch', cases: ['agentur'], art: 'pokal', title: 'Pitch ohne Honorar',
            text: 'Ein Konzern lädt zum Pitch ein. Die Vorarbeit ist unbezahlt, fünf Agenturen treten an.',
            choices: [
                { label: 'Mitmachen', out: [{ p: 0.35, text: 'Gewonnen! Ein dicker Kunde unterschreibt.', fx: { energy: -25, gainCustomer: { mult: 2 }, rep: 5 } }, { p: 0.65, text: 'Zweiter Platz. Dafür gibt es nichts außer Augenringen.', fx: { energy: -25 } }] },
                { label: 'Absagen', out: [{ text: 'Du steckst die Zeit in Kunden, die zahlen.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'ag_neffe', cases: ['agentur'], art: 'kunde', title: 'Der Neffe kann das auch',
            text: '{cust}: „Mein Neffe kennt sich mit Computern aus. Der macht das Logo jetzt noch mal neu.“',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Lächeln und nicken', out: [{ text: 'Das Logo ist jetzt lila. Mit Schatten.', fx: { chaos: 8, rep: -3 } }] },
                { label: 'Die Markenregeln erklären', out: [{ text: 'Nach einer Stunde Überzeugungsarbeit bleibt alles, wie es war.', fx: { energy: -8, rep: 3 } }] }
            ]
        },
        {
            id: 'hw_material', cases: ['handwerk'], art: 'laster', title: 'Das Material fehlt',
            text: 'Der Großhändler liefert drei Wochen später. Die Baustelle steht.',
            choices: [
                { label: 'Teurer im Baumarkt kaufen (1.200 €)', out: [{ text: 'Es geht weiter. Die Marge ist dahin.', fx: { cash: -1200 } }] },
                { label: 'Abwarten', out: [{ text: 'Der Kunde ruft jeden Tag an. Zweimal.', fx: { chaos: 12, rep: -4 } }] },
                { label: 'Aus dem eigenen Lager nehmen', req: 'auto', out: [{ text: 'Deine Planung hatte Reserve vorgesehen. Niemand merkt etwas.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'hw_azubi', cases: ['handwerk'], art: 'fire', title: 'Rohrbruch',
            text: 'Der Azubi hat ein Rohr angebohrt. Im Keller des Kunden steht das Wasser knöcheltief.',
            choices: [
                { label: 'Selbst hinfahren und retten', out: [{ text: 'Mitternacht, nasse Füße, aber der Keller ist trocken.', fx: { energy: -18, rep: 2 } }] },
                { label: 'Notdienst bezahlen (1.500 €)', out: [{ text: 'Der Notdienst erledigt das in einer Stunde.', fx: { cash: -1500 } }] }
            ]
        },
        {
            id: 'ro_maschine', cases: ['roesterei'], art: 'zahnrad', title: 'Der Röster streikt',
            text: 'Mitten in der Charge bleibt die Trommel stehen. Es riecht nach verbranntem Geld.',
            choices: [
                { label: 'Reparatur sofort (2.500 €)', out: [{ text: 'Der Techniker kommt am selben Tag.', fx: { cash: -2500 } }] },
                { label: 'Bei einer anderen Rösterei rösten lassen (1.200 €)', out: [{ text: 'Es klappt, aber die Lieferungen kommen spät.', fx: { cash: -1200, chaos: 8 } }] },
                { label: 'Ersatzteil liegt im Regal', req: 'auto', out: [{ text: 'Dein Wartungsplan hatte genau das vorgesehen. Nach einer Stunde läuft die Trommel.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'ro_ernte', cases: ['roesterei'], art: 'preis', title: 'Schlechte Ernte',
            text: 'Rohkaffee wird deutlich teurer. Deine Kalkulation geht nicht mehr auf.',
            choices: [
                { label: 'Preise erhöhen', out: [{ p: 0.5, text: 'Die Kunden schlucken es. Kaffee bleibt Kaffee.', fx: { cash: 1000 } }, { p: 0.5, text: 'Ein Kunde kündigt aus Protest.', fx: { loseCustomer: true, cash: 500 } }] },
                { label: 'Die Mehrkosten selbst tragen (1.500 €)', out: [{ text: 'Die Kunden merken nichts. Dein Konto schon.', fx: { cash: -1500, rep: 3 } }] }
            ]
        },
        {
            id: 'sw_server', cases: ['software'], art: 'server', title: 'Server-Ausfall',
            text: 'Um 2:47 Uhr geht dein Dienst offline. Um 2:49 Uhr klingelt das Telefon.',
            choices: [
                { label: 'Nachtschicht einlegen', out: [{ text: 'Um sechs Uhr läuft alles wieder. Du nicht.', fx: { energy: -25, rep: -3 } }] },
                { label: 'Notfall-Dienst rufen (3.000 €)', out: [{ text: 'Profis lösen das in vierzig Minuten.', fx: { cash: -3000 } }] },
                { label: 'Die Überwachung hat schon umgeschaltet', req: 'qa', out: [{ text: 'Die Kunden haben nichts gemerkt. Du liest davon beim Frühstück.', fx: { rep: 3 } }] }
            ]
        },
        {
            id: 'sw_feature', cases: ['software'], art: 'kunde', title: 'Das eine Feature',
            text: '{cust} droht mit Kündigung, wenn eine bestimmte Funktion nicht bis Monatsende kommt.',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Sofort einbauen', out: [{ text: 'Die Funktion ist da. Zwei andere sind dabei kaputtgegangen.', fx: { chaos: 15, energy: -10 } }] },
                { label: 'Freundlich Nein sagen', out: [{ p: 0.5, text: 'Der Kunde bleibt trotzdem. Bluff durchschaut.', fx: { rep: 2 } }, { p: 0.5, text: 'Der Kunde macht ernst und kündigt.', fx: { loseCustomer: true } }] }
            ]
        }
    ];

    /* ---------- Duell-Ereignisse (nur im 2-Spieler-Modus) ---------- */
    D.events.push(
        {
            id: 'duell_preis', duel: true, art: 'preis', title: '{rival} unterbietet dich',
            text: '{rival} hat {cust} ein billigeres Angebot gemacht. Dein Kunde ruft an: „Was sagen Sie dazu?“',
            cond: function (s) { return s.customers.length > 0; },
            choices: [
                { label: 'Preis um 15 % senken', out: [{ text: '{cust} bleibt – zahlt aber ab sofort weniger.', fx: { custDiscount: 15 } }] },
                { label: 'Mit Qualität überzeugen', out: [{ p: 0.6, text: '{cust} bleibt. Qualität schlägt Preis!', fx: { energy: -10, rep: 4 } }, { p: 0.4, text: '{cust} wechselt zu {rival}. Bitter.', fx: { energy: -10, stealToRival: true } }] },
                { label: 'Kundenbindung aus der Feedback-Schleife', req: 'qa', out: [{ text: '{cust} winkt ab: „Wir sind bei Ihnen bestens aufgehoben.“', fx: { rep: 5 } }] }
            ]
        },
        {
            id: 'duell_koop', duel: true, art: 'messe', title: 'Gemeinsame Sache?',
            text: '{rival} schlägt vor, zusammen einen großen Info-Abend zu veranstalten. Kosten werden geteilt.',
            choices: [
                { label: 'Gemeinsam machen (je 1.500 €)', out: [{ text: 'Volles Haus! Beide sammeln neue Kontakte.', fx: { cash: -1500, leads: 2, rivalCash: -1500, rivalLeads: 2 } }] },
                { label: 'Idee klauen und allein machen (3.000 €)', out: [{ text: 'Dein Abend ist ein Erfolg. {rival} ist sauer – und das spricht sich herum.', fx: { cash: -3000, leads: 3, rep: -4 } }] },
                { label: 'Ablehnen', out: [{ text: 'Du bleibst lieber für dich.', fx: {} }] }
            ]
        },
        {
            id: 'duell_talent', duel: true, art: 'talent', title: 'Bieterkampf um ein Talent',
            text: 'Eine hervorragende Fachkraft hat zwei Angebote: von dir und von {rival}. Sie will sich heute entscheiden.',
            cond: function (s, rv) { return s.staff.length < D.maxStaff; },
            choices: [
                { label: 'Mehr bieten (Gehalt +500 €)', out: [{ text: 'Sie unterschreibt bei dir. Teuer – aber gut.', fx: { hire: 'delivery', fix: 500 } }] },
                { label: 'Nicht mitbieten', out: [{ text: 'Sie fängt bei {rival} an.', fx: { rivalHire: 'delivery' } }] }
            ]
        },
        {
            id: 'duell_presse', duel: true, art: 'zeitung', title: 'Duell in der Zeitung',
            text: 'Das Lokalblatt vergleicht dich und {rival}: „Wer ist die bessere Wahl?“ Sie wollen ein Statement.',
            choices: [
                { label: 'Fair bleiben und Fakten nennen', out: [{ text: 'Sachlich und souverän. Die Leser mögen das.', fx: { rep: 6, leads: 1 } }] },
                { label: 'Gegen {rival} sticheln', out: [{ p: 0.5, text: 'Die Leser lachen – auf Kosten von {rival}.', fx: { leads: 2, rep: 2 } }, { p: 0.5, text: 'Das kam schlecht an. Du wirkst kleinlich.', fx: { rep: -8 } }] }
            ]
        }
    );

    D.players = [
        { name: 'Spieler 1', color: '#22d3ee' },
        { name: 'Spieler 2', color: '#f472b6' }
    ];

    /* ---------- Titel am Spielende ---------- */
    D.ranks = [
        { t: 'Selbst und ständig', d: 'Du hast überlebt. Aber ohne dich steht hier alles still.' },
        { t: 'Solider Betrieb', d: 'Ein ordentliches Geschäft. Mit mehr System wäre noch viel drin.' },
        { t: 'Unternehmen mit System', d: 'Deine Abläufe tragen. So baut man etwas, das bleibt.' },
        { t: 'Der Laden läuft ohne dich', d: 'Meisterhaft. Du könntest ein halbes Jahr segeln gehen.' }
    ];

    G.PPDATA = D;
})(typeof window !== 'undefined' ? window : globalThis);
