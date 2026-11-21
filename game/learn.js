/* Prozesse oder Pleite – Lerninhalte: Second-Hand-Shop, Verkaufsfragen mit Erklärungen, Business-Skills */
(function (G) {
    'use strict';
    var D = G.PPDATA;

    /* =====================================================================
       Neue Branche: Second-Hand-Shop (Mode gebraucht kaufen & verkaufen)
       Kleine Beträge: moneyScale skaliert alle Euro-Werte (Prozesse, Gehälter,
       Ereignisse, Kredit) auf Taschengeld-Niveau.
       ===================================================================== */
    D.cases.reselling = {
        id: 'reselling', name: 'Second-Hand-Shop', color: '#ec4899', diff: 1, moneyScale: 0.08,
        tag: 'Gebrauchte Mode günstig kaufen, schön fotografieren, mit Gewinn verkaufen.',
        twist: 'Kleine Beträge, echte Lektionen: Jeder Einkauf kostet erst Geld, bevor er Geld bringt.',
        startCash: 1200, fix: 120, setup: 0, mrr: 170, duration: null, varPct: 0.4,
        cap: 5, staffCap: 4, churn: 0.07, hitLeads: 2, salesCloses: 2, salaryMult: 1,
        unit: 'Stammkäuferin', units: 'Stammkäufer', payWord: 'pro Monat',
        acq: 'Inserate einstellen', acqDesc: 'Fotos machen, Preis festlegen, online stellen! Stoppe den Zeiger im grünen Feld – jeder Treffer bringt zwei Interessenten.',
        care: 'Bewertungen beantworten',
        stars: [15000, 28000, 41000],
        levels: ['Kinderzimmer', 'Kellerlager', 'Kleiner Laden', 'Second-Hand-Kette'],
        companies: ['Lea aus Köln', 'Mia, die Sammlerin', 'Jonas (Sneaker-Fan)', 'Frau Berger', 'Emma aus Hamburg', 'Familie Schulz', 'Noah (Vintage-Fan)', 'Sophie aus München', 'Ben (Streetwear)', 'Hannah, die Bastlerin'],
        wants: ['eine Vintage-Jeans', 'Sneaker in Größe 38', 'ein Paket Kinderkleidung', 'eine Designer-Tasche', 'eine warme Winterjacke'],
        procs: {
            crm: 'Preis-Checkliste', delivery: 'Versand-Station', auto: 'Inserat-Vorlagen', books: 'Kassenbuch',
            qa: 'Qualitäts-Check', marketing: 'Social-Media-Kanal', handbook: 'Foto-Anleitung', deputy: 'Beste Freundin als Partnerin'
        },
        roles: { sales: 'Social-Media-Helferin', delivery: 'Pack-Helfer', assist: 'Buchhaltungs-Hilfe' }
    };
    D.caseOrder = ['reselling', 'agentur', 'handwerk', 'roesterei', 'software'];

    D.events.push(
        {
            id: 'rs_ausserhalb', cases: ['reselling'], art: 'maske', title: 'Bezahlen außerhalb der App?',
            text: 'Eine Käuferin schreibt: „Überweis ich dir lieber direkt, dann sparen wir die Gebühr. Schick mir deine Bankdaten!“',
            choices: [
                { label: 'Nein – nur über die App mit Käuferschutz', out: [{ text: 'Richtig! In der App sind beide geschützt. Die Käuferin kauft trotzdem.', fx: { rep: 5, cash: 600 } }] },
                { label: 'Okay, Gebühr sparen klingt gut', out: [{ p: 0.6, text: 'Es war ein Trick: Das Geld kam nie, die Ware ist weg.', fx: { cash: -1500, rep: -3 } }, { p: 0.4, text: 'Diesmal ging es gut. Aber ohne Schutz – riskant!', fx: { cash: 600, chaos: 5 } }] }
            ]
        },
        {
            id: 'rs_fake', cases: ['reselling'], art: 'kunde', title: 'Zu schön, um echt zu sein',
            text: 'Auf dem Flohmarkt gibt es „Marken-Sneaker“ für 5 €. Weiterverkaufen würde sich lohnen … wenn sie echt wären.',
            choices: [
                { label: 'Finger weg – Fälschungen verkaufen ist verboten', out: [{ text: 'Gute Entscheidung. Dein Shop bleibt sauber, deine Bewertungen auch.', fx: { rep: 4 } }] },
                { label: 'Kaufen und als „Marke“ anbieten', out: [{ text: 'Eine Käuferin meldet die Fälschung. Konto verwarnt, Geld zurück.', fx: { cash: -800, rep: -12 } }] }
            ]
        },
        {
            id: 'rs_paket', cases: ['reselling'], art: 'laster', title: 'Das Paket ist weg',
            text: 'Ein Paket kommt nie an. Die Käuferin will ihr Geld zurück.',
            choices: [
                { label: 'Sendungsnummer zeigen und Nachforschung starten', out: [{ text: 'Mit Sendungsnummer übernimmt der Versand den Schaden. Alles gut.', fx: { energy: -5, rep: 2 } }] },
                { label: 'Geld selbst erstatten', out: [{ text: 'Fair, aber teuer.', fx: { cash: -600, rep: 3 } }] },
                { label: 'Versand-Station hat alles dokumentiert', req: 'delivery', out: [{ text: 'Foto vom Paket, Sendungsnummer, Beleg – nach einem Tag ist alles geklärt.', fx: { rep: 4 } }] }
            ]
        },
        {
            id: 'rs_meldung', cases: ['reselling'], art: 'amt', title: 'Die Plattform meldet ans Finanzamt',
            text: 'Wer im Jahr 30 Verkäufe oder 2.000 Euro Umsatz schafft, wird von Plattformen ans Finanzamt gemeldet. Du bist knapp dran.',
            choices: [
                { label: 'Einnahmen sauber aufschreiben', out: [{ text: 'Mit Zahlen auf dem Papier kannst du alles erklären. Kein Stress.', fx: { energy: -10, chaos: -5 } }] },
                { label: 'Ignorieren', out: [{ text: 'Später fehlen Belege. Das Sortieren kostet Nerven.', fx: { chaos: 12, energy: -10 } }] },
                { label: 'Das Kassenbuch ist aktuell', req: 'books', out: [{ text: 'Alles drin, alles belegt. Das Finanzamt kann kommen.', fx: { rep: 2 } }] }
            ]
        },
        {
            id: 'rs_viral', cases: ['reselling'], art: 'sterne', title: 'Dein Outfit-Foto geht viral',
            text: 'Ein Foto von dir mit einer Vintage-Jacke wird tausendfach geteilt. Plötzlich wollen alle etwas von dir kaufen.',
            choices: [
                { label: 'Schnell neue Teile einstellen', out: [{ text: 'Volle Nachrichten-Box! Viele neue Interessenten.', fx: { leads: 3, energy: -15 } }] },
                { label: 'Ruhig bleiben und Bestehendes verkaufen', out: [{ text: 'Du verkaufst alles, was da ist – zum vollen Preis.', fx: { cash: 900 } }] }
            ]
        }
    );

    /* Eigene Bewährungsproben für den Second-Hand-Shop */
    D.bossesByCase = {
        reselling: {
            4: {
                id: 'grosskunde', name: 'Frau Lindner', role: 'Inhaberin einer Boutique', seed: 4712, bonusProc: 'delivery', customerName: 'Boutique Lindner',
                title: 'Die Boutique',
                intro: 'Eine Boutique will regelmäßig Teile von dir kaufen. Ein großer Schritt – aber zu wessen Bedingungen?',
                rounds: [
                    { q: 'Ich zahle erst, wenn ich die Sachen weiterverkauft habe.', a: ['Ich liefere gern – bezahlt wird bei Übergabe. So bleibt es für uns beide fair.', 'Können wir die Hälfte gleich machen?', 'Okay, zahl einfach irgendwann.'] },
                    { q: 'Du müsstest jede Woche 20 Teile liefern.', a: ['Ich sage zu, was ich in guter Qualität schaffe: 10 Teile pro Woche, fest.', 'Ich versuche es.', 'Klar, auch 50!'] },
                    { q: 'Und den Preis halbieren wir.', a: ['Gleicher Preis – dafür bekommst du geprüfte Qualität und pünktliche Lieferung.', '10 % Nachlass, wenn du jeden Monat bestellst.', 'Na gut, Hauptsache du kaufst.'] }
                ],
                out: {
                    win: 'Frau Lindner lächelt: „Du verhandelst wie ein Profi.“ Die Boutique wird Stammkundin – zu deinen Bedingungen.',
                    mid: 'Ihr trefft euch in der Mitte. Gutes Geschäft, aber du musst viel liefern.',
                    lose: 'Du hast allem zugestimmt. Die Boutique kauft – aber du arbeitest fast umsonst.'
                }
            },
            8: {
                id: 'pruefung', name: 'Herr Kaya', role: 'Prüfer der Verkaufsplattform', seed: 8081, bonusProc: 'books',
                title: 'Der Konto-Check',
                intro: 'Die Plattform prüft dein Verkäuferkonto. Ehrlichkeit und Ordnung zählen jetzt.',
                rounds: [
                    { q: 'Kannst du zeigen, wie viel du dieses Jahr verkauft hast?', a: ['Ja, hier ist mein Kassenbuch – jeder Verkauf mit Datum und Betrag.', 'Ungefähr … so 40 Teile?', 'Keine Ahnung, ich schreib nichts auf.'] },
                    { q: 'Eine Käuferin sagt, die Jacke hatte einen Fleck, der nicht beschrieben war.', a: ['Stimmt, den habe ich übersehen. Ich erstatte ihr das Geld und prüfe künftig genauer.', 'Der Fleck war doch winzig.', 'Die lügt bestimmt.'] },
                    { q: 'Verkaufst du auch neue Ware als gebraucht?', a: ['Nein. Alles ist ehrlich beschrieben – mit echten Fotos.', 'Nur manchmal.', 'Merkt doch keiner.'] }
                ],
                out: {
                    win: 'Herr Kaya ist beeindruckt: „Vorbildliches Verkäuferkonto!“ Du bekommst das Top-Verkäufer-Abzeichen.',
                    mid: 'Ein paar Dinge musst du nachbessern. Das kostet dich 4.000 €.',
                    lose: 'Verwarnung! Du musst Käufern 10.000 € erstatten, und dein Konto steht unter Beobachtung.'
                }
            }
        }
    };

    /* =====================================================================
       Verkaufsgespräch Runde 1: Bedarf erkennen (a[0] stark, a[1] okay, a[2] schwach)
       ===================================================================== */
    D.needs = [
        { q: 'Ich interessiere mich für {want}. Was kostet das?', a: ['Gern! Damit ich passend anbieten kann: Wofür brauchen Sie es genau?', 'Ab {price} im Monat.', 'Das kommt drauf an. Mal so, mal so.'], why: 'Wer sofort nur den Preis nennt, verkauft ein Produkt. Wer erst nach dem Ziel fragt, kann den Wert erklären.' },
        { q: 'Ich weiß noch nicht genau, was ich will.', a: ['Kein Problem. Was ärgert Sie gerade am meisten?', 'Ich schicke Ihnen mal alle Angebote.', 'Dann melden Sie sich, wenn Sie es wissen.'], why: 'Probleme sind der beste Startpunkt. Wer das Problem kennt, findet die passende Lösung.' },
        { q: 'Wir hatten so etwas schon mal. Hat nicht geklappt.', a: ['Was genau ist damals schiefgelaufen?', 'Bei uns klappt das bestimmt.', 'Dann war das eben der falsche Anbieter.'], why: 'Aus alten Fehlern lernst du, was der Kunde wirklich braucht – und was du anders machen musst.' },
        { q: 'Bis wann könnten Sie liefern?', a: ['Bis wann brauchen Sie es – und was passiert, wenn es später kommt?', 'In etwa vier Wochen.', 'Sofort! Wir haben immer Zeit.'], why: 'Frag nach dem Grund für den Termin. So erfährst du, wie dringend es ist und was davon abhängt.' },
        { q: 'Ich habe nur ganz kurz Zeit.', a: ['Dann nur eine Frage: Was müsste passieren, damit es sich für Sie lohnt?', 'Ich fasse mich kurz: Wir sind die Besten.', 'Dann rufe ich lieber ein andermal an.'], why: 'Eine kluge Frage ist besser als eine lange Rede. Der Kunde sagt dir selbst, was wichtig ist.' },
        { q: 'Was unterscheidet Sie von anderen?', a: ['Darf ich erst fragen, was Ihnen bei der Wahl am wichtigsten ist?', 'Wir haben viel Erfahrung.', 'Die anderen sind einfach schlecht.'], why: 'Erst verstehen, was dem Kunden wichtig ist – dann genau diesen Unterschied zeigen. Und nie über andere lästern.' },
        { q: 'Ich vergleiche gerade drei Angebote.', a: ['Sehr gut. Nach welchen Punkten entscheiden Sie?', 'Unser Angebot ist sicher das beste.', 'Dann warte ich mal ab.'], why: 'Wer die Entscheidungs-Kriterien kennt, kann gezielt überzeugen.' },
        { q: 'Wie läuft das bei Ihnen ab?', a: ['Erst verstehe ich Ihr Ziel, dann bekommen Sie einen klaren Plan mit Terminen.', 'Wir legen einfach los und schauen dann.', 'Das sehen wir dann schon.'], why: 'Ein klarer Ablauf gibt Sicherheit. Das ist ein Prozess – und Prozesse verkaufen sich gut.' },
        { q: 'Meine Chefin hat gesagt, ich soll mir das anschauen.', a: ['Was ist Ihrer Chefin dabei besonders wichtig?', 'Dann schicke ich ihr direkt ein Angebot.', 'Kann ich nicht gleich mit der Chefin reden?'], why: 'Finde heraus, wer entscheidet und worauf es dieser Person ankommt – ohne dein Gegenüber zu übergehen.' },
        { q: 'Können Sie auch Sonderwünsche erfüllen?', a: ['Welcher Wunsch ist es – und warum ist er wichtig?', 'Ja, gegen Aufpreis.', 'Klar, wir machen einfach alles!'], why: 'Wer alles verspricht, kann nicht alles halten. Erst verstehen, dann ehrlich zusagen.' },
        { q: 'Ein Freund hat Sie empfohlen.', a: ['Wie schön! Was hat er Ihnen erzählt – und was hat Sie neugierig gemacht?', 'Super, dann kennen Sie uns ja schon.', 'Dann bekommt er 10 % Provision.'], why: 'Empfehlungen sind Gold. Frag nach, was den Kunden überzeugt hat – das ist dein bestes Verkaufsargument.' },
        { q: 'Ich will das unbedingt bis zum Wochenende!', a: ['Verstehe. Was ist am Wochenende – damit wir das Wichtigste zuerst schaffen?', 'Das wird knapp, aber wir versuchen es.', 'Kein Problem, wir arbeiten einfach nachts.'], why: 'Hinter Eile steckt oft ein Anlass. Wer ihn kennt, setzt die richtigen Prioritäten – statt sich zu überlasten.' }
    ];

    /* Erklärungen für die bisherigen Einwände (gleiche Reihenfolge wie in data.js) */
    var whys = [
        'Rabatt ist der teuerste Weg. Zeig lieber, was es kostet, nichts zu tun.',
        'Unterlagen sind oft eine höfliche Absage. Kläre die offenen Fragen sofort.',
        'Bezieh die zweite Person mit ein, statt Druck zu machen.',
        'Frag nach Wünschen – nie schlecht über die Konkurrenz reden.',
        'Ein „später“ hat Gründe. Wer sie kennt, findet einen Weg.',
        'Versprich nur, was du halten kannst: deinen Ablauf.',
        'Billiger geht immer. Lenke den Blick auf den Wert, nicht den Preis.',
        'Gratis arbeiten macht dich wertlos. Ein kleiner bezahlter Start zeigt, dass beide es ernst meinen.'
    ];
    D.objections.forEach(function (o, i) { if (!o.why) o.why = whys[i] || ''; });

    D.objections.push(
        { q: 'Ich muss erst eine Nacht drüber schlafen.', a: ['Gern. Welche Frage geht Ihnen dabei noch durch den Kopf?', 'Ich rufe Sie morgen an.', 'Das Angebot gilt aber nur heute!'], why: 'Kein Druck – aber die offene Frage gleich klären. Künstliche Fristen zerstören Vertrauen.' },
        { q: 'Sie sind mir zu klein.', a: ['Gerade deshalb haben Sie bei uns einen festen Ansprechpartner. Wie wichtig ist Ihnen das?', 'Wir wachsen gerade stark.', 'Größe ist doch egal.'], why: 'Mach aus der Schwäche eine Stärke – und frag, ob sie dem Kunden wichtig ist.' },
        { q: 'Das klingt zu gut, um wahr zu sein.', a: ['Verständlich. Was müssten Sie sehen, um sicher zu sein?', 'Es ist wirklich so gut!', 'Vertrauen Sie mir einfach.'], why: 'Misstrauen löst du mit Beweisen, nicht mit Beteuerungen.' },
        { q: 'Wir haben gerade kein Budget.', a: ['Wann wird das Budget geplant – und wer entscheidet darüber?', 'Wir können Ratenzahlung anbieten.', 'Dann leihen Sie sich doch Geld.'], why: 'Kein Budget heißt oft „nicht jetzt“. Finde heraus, wann und wer entscheidet.' },
        { q: 'Ich habe schlechte Bewertungen über Sie gelesen.', a: ['Danke für die Offenheit. Welche war das? Ich erkläre gern, was wir daraus gelernt haben.', 'Das waren Einzelfälle.', 'Die sind alle gefälscht.'], why: 'Ehrlich mit Kritik umgehen schafft mehr Vertrauen als jede Ausrede.' },
        { q: 'Gibt es Rabatt, wenn ich sofort unterschreibe?', a: ['Statt Rabatt gebe ich Ihnen etwas dazu: einen schnelleren Start.', '5 % sind drin.', 'Klar, 30 % – Hauptsache, Sie unterschreiben.'], why: 'Gib lieber etwas dazu, als den Preis zu senken. Rabatte bleiben für immer.' },
        { q: 'Ich will erst Referenzen sehen.', a: ['Sehr gern. Welche Branche interessiert Sie? Dann passt die Referenz.', 'Ich schicke Ihnen eine Liste.', 'Wir geben keine Referenzen raus.'], why: 'Eine passende Referenz überzeugt mehr als zehn beliebige.' },
        { q: 'Das ist mir alles zu kompliziert.', a: ['Was genau wirkt kompliziert? Dann zeige ich Ihnen den einfachsten Weg.', 'Das ist eigentlich ganz einfach.', 'Dann ist das wohl nichts für Sie.'], why: 'Frag nach, was unklar ist, und mach es einfach – statt dem Kunden zu widersprechen.' },
        { q: 'Was ist, wenn ich nicht zufrieden bin?', a: ['Dann reden wir sofort, und Sie können nach dem ersten Monat kündigen.', 'Das ist noch nie passiert.', 'Das wird schon nicht passieren.'], why: 'Ein klares Versprechen für den Notfall nimmt die Angst vor der Entscheidung.' },
        { q: 'Mein Neffe kann das auch.', a: ['Super, dass Sie jemanden haben. Wie viel Zeit hat er dafür – und wenn er mal ausfällt?', 'Wir sind halt Profis.', 'Dann fragen Sie doch Ihren Neffen.'], why: 'Nicht abwerten – frag nach Zeit und Verlässlichkeit. Da liegt dein Vorteil.' },
        /* --- je Branche --- */
        { cases: ['reselling'], q: 'Geht auch 5 € weniger?', a: ['Den Preis lasse ich – aber den Versand übernehme ich.', 'Na gut, 2 € weniger.', 'Nimm es für die Hälfte.'], why: 'Lieber etwas dazugeben als den Preis senken. So bleibt dein Gewinn erhalten.' },
        { cases: ['reselling'], q: 'Ist das echt oder gefälscht?', a: ['Echt – hier sind Fotos vom Etikett und vom Kaufbeleg.', 'Echt, versprochen!', 'Keine Ahnung, sieht aber echt aus.'], why: 'Beweise schaffen Vertrauen. Und Fälschungen zu verkaufen ist verboten.' },
        { cases: ['reselling'], q: 'Kannst du es mir bis nächste Woche zurücklegen?', a: ['Zwei Tage gern – danach biete ich es wieder an.', 'Okay, ich warte auf dich.', 'Nein, jetzt oder nie!'], why: 'Klare, freundliche Regeln: Du kommst entgegen, blockierst aber nicht ewig deine Ware.' },
        { cases: ['reselling'], q: 'Zahle ich lieber direkt per Überweisung, ohne App?', a: ['Nein, wir bleiben in der App – da sind wir beide geschützt.', 'Hm, eher nicht.', 'Klar, schick einfach das Geld!'], why: 'Außerhalb der App gibt es keinen Käuferschutz. Das ist ein beliebter Betrugstrick.' },
        { cases: ['reselling'], q: 'Der Versand ist mir zu teuer.', a: ['Nimm noch ein zweites Teil dazu – dann lohnt sich der Versand doppelt.', 'Ich verschicke günstiger, aber ohne Sendungsnummer.', 'Dann hol es ab, ich schreib dir meine Adresse.'], why: 'Bündeln erhöht den Wert pro Paket. Und gib Fremden nie einfach deine Adresse.' },
        { cases: ['agentur'], q: 'Eine Website gibt es im Baukasten für 10 € im Monat.', a: ['Stimmt. Die Frage ist: Bringt sie Ihnen Kunden? Darum kümmern wir uns.', 'Unsere ist aber schöner.', 'Dann nehmen Sie doch den Baukasten.'], why: 'Verkaufe das Ergebnis (mehr Kunden), nicht das Werkzeug (eine Website).' },
        { cases: ['agentur'], q: 'Wir wollen erst mal nur ein Logo, mehr nicht.', a: ['Gern. Wo soll das Logo überall wirken – damit es zu allem passt?', 'Ein Logo allein bringt nichts.', 'Logos machen wir nicht unter 5.000 €.'], why: 'Klein starten ist okay. Frag nach dem Großen und Ganzen – so wächst der Auftrag ganz natürlich.' },
        { cases: ['handwerk'], q: 'Können Sie das auch ohne Rechnung machen?', a: ['Nein, nur mit Rechnung – dafür haben Sie Gewährleistung und alles ist sauber.', 'Hm, mal sehen.', 'Klar, bar auf die Hand!'], why: 'Arbeit ohne Rechnung ist Schwarzarbeit und verboten. Mit Rechnung sind beide abgesichert.' },
        { cases: ['handwerk'], q: 'Andere Betriebe hätten nächste Woche Zeit.', a: ['Verstehe. Was ist Ihnen wichtiger: schnell oder richtig gut gemacht?', 'Wir beeilen uns auch.', 'Dann nehmen Sie die doch.'], why: 'Lenke den Blick auf Qualität und frag, was dem Kunden wirklich wichtig ist.' },
        { cases: ['roesterei'], q: 'Im Supermarkt kostet ein Kilo nur 12 €.', a: ['Stimmt. Probieren Sie mal den Unterschied – frisch geröstet schmeckt anders.', 'Unser Kaffee ist eben besser.', 'Dann kaufen Sie im Supermarkt.'], why: 'Lass erleben statt behaupten: Eine Kostprobe überzeugt mehr als jedes Wort.' },
        { cases: ['roesterei'], q: 'Wir trinken im Büro eh nur Filterkaffee.', a: ['Perfekt, dafür haben wir eine eigene Röstung. Wie viele Tassen am Tag?', 'Filterkaffee ist langweilig.', 'Dann sind wir wohl falsch.'], why: 'Pass dein Angebot an den Kunden an – und frag nach der Menge, um gut zu planen.' },
        { cases: ['software'], q: 'Excel reicht uns doch.', a: ['Wie viel Zeit kostet Excel Ihr Team pro Woche – und was passiert bei Fehlern?', 'Excel ist veraltet.', 'Dann bleiben Sie halt bei Excel.'], why: 'Zeig, was die alte Lösung wirklich kostet: Zeit und Fehler.' },
        { cases: ['software'], q: 'Unsere Daten müssen in Deutschland bleiben.', a: ['Absolut verständlich – unsere Server stehen in Deutschland, das zeige ich Ihnen gern.', 'Das ist bei uns kein Thema.', 'Daten sind doch überall sicher.'], why: 'Datenschutz ernst nehmen und Fakten zeigen – das schafft Vertrauen.' }
    );

    /* =====================================================================
       Business-Skills: freischalten, lernen, mit einer Quizfrage meistern
       quiz.a[0] ist richtig (wird im Spiel gemischt)
       ===================================================================== */
    D.skills = [
        { id: 'marketing', icon: '📣', name: 'Kunden finden', text: 'Ohne Kunden kein Geschäft. Marketing heißt: Menschen erfahren, dass es dich gibt. Je mehr passende Interessenten, desto mehr Verkäufe.',
            quiz: { q: 'Was ist das Ziel von Marketing?', a: ['Dass passende Menschen von deinem Angebot erfahren', 'Möglichst bunte Werbung machen', 'Allen Leuten alles verkaufen'], why: 'Es geht um die RICHTIGEN Leute – die, die dein Angebot wirklich brauchen.' } },
        { id: 'bedarf', icon: '👂', name: 'Zuhören & Bedarf erkennen', text: 'Gute Verkäufer reden weniger und fragen mehr. Wer versteht, was der Kunde wirklich braucht, kann genau das anbieten.',
            quiz: { q: 'Ein Kunde fragt sofort nach dem Preis. Was ist klug?', a: ['Erst fragen, wofür er es braucht', 'Sofort den niedrigsten Preis nennen', 'Das Thema wechseln'], why: 'Wenn du sein Ziel kennst, kannst du den Wert erklären – dann wirkt der Preis fair.' } },
        { id: 'einwand', icon: '🛡️', name: 'Einwände behandeln', text: 'Ein „Nein“ oder „zu teuer“ ist oft eine Frage in Verkleidung. Bleib ruhig, frag nach dem Grund und löse ihn.',
            quiz: { q: 'Der Kunde sagt „Das ist mir zu teuer“. Beste Reaktion?', a: ['Nachfragen und den Wert zeigen', 'Sofort 50 % Rabatt geben', 'Beleidigt auflegen'], why: 'Rabatte kosten dich jeden Monat Geld. Den Wert zu zeigen, kostet nichts.' } },
        { id: 'warnzeichen', icon: '🚩', name: 'Schwierige Kunden erkennen', text: 'Nicht jeder Kunde ist ein guter Kunde. Wer nicht zahlen will oder alle schlecht macht, kostet mehr, als er bringt.',
            quiz: { q: 'Welcher Kunde ist ein Warnzeichen?', a: ['Einer, der erst zahlen will, wenn alles fertig ist', 'Einer, der nach dem Ablauf fragt', 'Einer, der über eine Empfehlung kommt'], why: 'Wer nicht im Voraus zahlen will, zahlt oft gar nicht. Lieber freundlich Nein sagen.' } },
        { id: 'preis', icon: '🏷️', name: 'Preis & Wert', text: 'Der Preis ist, was der Kunde zahlt. Der Wert ist, was er bekommt. Wer den Wert erklärt, muss nicht billig sein.',
            quiz: { q: 'Warum sind Rabatte gefährlich?', a: ['Sie senken deinen Gewinn – oft dauerhaft', 'Sie sind verboten', 'Kunden mögen keine Rabatte'], why: 'Wer einmal billiger war, bleibt es meistens. Lieber etwas dazugeben.' } },
        { id: 'marge', icon: '📊', name: 'Umsatz ist nicht Gewinn', text: 'Umsatz ist alles Geld, das reinkommt. Davon gehen Einkauf, Material und Kosten ab. Was übrig bleibt, ist die Marge – dein echter Verdienst.',
            quiz: { q: 'Du verkaufst eine Jacke für 30 €, sie hat dich 12 € gekostet. Wie hoch ist deine Marge?', a: ['18 €', '30 €', '42 €'], why: '30 € Umsatz minus 12 € Einkauf = 18 € Marge. Davon gehen noch Fixkosten ab.' } },
        { id: 'fixkosten', icon: '🏠', name: 'Fixkosten', text: 'Fixkosten fallen jeden Monat an – egal ob du etwas verkaufst: Miete, Software, Versicherung. Je niedriger sie sind, desto leichter wird es.',
            quiz: { q: 'Was ist eine Fixkoste?', a: ['Die monatliche Miete', 'Der Einkauf für einen Verkauf', 'Ein Trinkgeld vom Kunden'], why: 'Miete zahlst du jeden Monat gleich – auch wenn du nichts verkaufst.' } },
        { id: 'steuern', icon: '🏛️', name: 'Steuern & Rücklagen', text: 'Vom Gewinn bekommt das Finanzamt einen Teil. Kluge Unternehmer legen dieses Geld sofort zur Seite, damit es später keinen Schreck gibt.',
            quiz: { q: 'Was ist eine Steuer-Rücklage?', a: ['Geld, das du für das Finanzamt beiseitelegst', 'Ein Geschenk vom Staat', 'Ein Kredit von der Bank'], why: 'Wer es beiseitelegt, kann die Steuer bezahlen, ohne in Not zu geraten.' } },
        { id: 'liquiditaet', icon: '💧', name: 'Liquidität', text: 'Liquidität heißt: genug Geld auf dem Konto, um alle Rechnungen pünktlich zu bezahlen. Auch erfolgreiche Firmen gehen pleite, wenn das Geld zur falschen Zeit fehlt.',
            quiz: { q: 'Warum kann eine Firma mit vielen Kunden trotzdem pleitegehen?', a: ['Wenn das Geld zu spät reinkommt und Rechnungen fällig sind', 'Weil Kunden immer Geld kosten', 'Das kann nicht passieren'], why: 'Entscheidend ist, WANN das Geld da ist. Deshalb lohnt der Blick in die Prognose.' } },
        { id: 'kunden', icon: '💛', name: 'Kunden halten', text: 'Einen neuen Kunden zu finden ist viel teurer, als einen bestehenden glücklich zu halten. Stammkunden sind das Fundament jeder Firma.',
            quiz: { q: 'Was hält Stammkunden am besten?', a: ['Verlässlicher Service und gute Betreuung', 'Ständig neue Werbung', 'Möglichst selten melden'], why: 'Wer sich gut betreut fühlt, bleibt – und empfiehlt dich weiter.' } },
        { id: 'prozesse', icon: '⚙️', name: 'Prozesse & Systeme', text: 'Ein Prozess ist ein fester Ablauf, der immer gleich gut funktioniert – auch wenn du nicht dabei bist. So wächst eine Firma, ohne im Chaos zu versinken.',
            quiz: { q: 'Wozu sind Prozesse gut?', a: ['Damit Arbeit verlässlich klappt – auch ohne dich', 'Damit alles länger dauert', 'Damit man mehr Papier hat'], why: 'Prozesse machen dich unabhängig. Das macht deine Firma wertvoll.' } },
        { id: 'team', icon: '👥', name: 'Team & Verantwortung', text: 'Allein schaffst du nur begrenzt viel. Mit einem Team wächst die Firma – aber jede Person kostet jeden Monat Gehalt. Die Arbeit muss das Gehalt einbringen.',
            quiz: { q: 'Wann lohnt es sich, jemanden einzustellen?', a: ['Wenn genug Arbeit da ist, die mehr einbringt als das Gehalt', 'Sobald man sich einsam fühlt', 'Immer sofort am Anfang'], why: 'Eine neue Person muss sich rechnen – sonst frisst das Gehalt den Gewinn.' } },
        { id: 'risiko', icon: '⛈️', name: 'Risiko & Krisen', text: 'Es geht immer mal etwas schief: Technik kaputt, Kunde zahlt nicht, Konkurrenz greift an. Gute Unternehmer haben einen Plan B und etwas Geld in Reserve.',
            quiz: { q: 'Was hilft am besten gegen Krisen?', a: ['Eine Geld-Reserve und feste Abläufe', 'Einfach hoffen, dass nichts passiert', 'Alles Geld sofort ausgeben'], why: 'Reserve und Prozesse machen Krisen klein – Hoffnung leider nicht.' } },
        { id: 'kredit', icon: '🏦', name: 'Kredit & Zinsen', text: 'Ein Kredit ist geliehenes Geld. Er hilft in Engpässen, kostet aber jeden Monat Zinsen und muss zurückgezahlt werden.',
            quiz: { q: 'Du leihst dir 1.000 € zu 2 % Zinsen im Monat. Was kostet das pro Monat?', a: ['20 €', '2 €', '200 €'], why: '2 % von 1.000 € sind 20 € – jeden Monat, bis du zurückzahlst.' } },
        { id: 'skalierung', icon: '🚀', name: 'Wachstum', text: 'Wachsen heißt: mehr Kunden, ohne dass alles an dir hängt. Dafür braucht es Team, Prozesse – und genug Geld, um sie zu bezahlen.',
            quiz: { q: 'Was macht eine Firma für Investoren besonders wertvoll?', a: ['Wenn sie auch ohne den Chef gut läuft', 'Wenn der Chef immer Überstunden macht', 'Wenn sie möglichst viele Büros hat'], why: 'Eine Firma, die nur mit dir funktioniert, ist ein Job. Eine, die ohne dich läuft, ist ein Unternehmen.' } }
    ];
})(typeof window !== 'undefined' ? window : globalThis);
