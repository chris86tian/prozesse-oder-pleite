# Prozesse oder Pleite

Ein Business-Spiel für den Fernseher: Baue in 12 Monaten ein Unternehmen auf, das auch ohne dich läuft.
Gespielt wird komplett mit der Fire-TV-Fernbedienung – allein oder im Duell zu zweit.

![Banner](tools/icons/banner-1280.png)

## Was steckt drin

- **5 Branchen:** Second-Hand-Shop, Werbeagentur, Handwerksbetrieb, Kaffeerösterei, Software-Startup – jede mit eigener Spielmechanik, eigenen Ereignissen und eigenem Schwierigkeitsgrad.
- **3D-Stadt (three.js):** Jede Firma ist ein Grundstück. Das Gebäude wächst von der Garage zur Firmenzentrale, Prozesse kreisen als Zahnräder, Mitarbeiter laufen übers Gelände, Kunden parken als Lieferwagen, Chaos lässt das Haus qualmen.
- **2-Spieler-Duell:** Abwechselnd je 3 Aktionen pro Monat. Duell-Ereignisse betreffen beide (Preiskampf, Abwerben, Kooperation). Am Ende entscheidet die Investorin mit fairen Punkten: Wie stark ist die Firma *für ihre Branche*?
- **Verkaufsgespräche in zwei Runden:** erst den Bedarf erkennen, dann den Einwand kontern – über 50 Fragen, jede mit Erklärung, warum die beste Antwort die beste ist.
- **15 Business-Skills:** Marge, Fixkosten, Steuern, Liquidität, Einwände, Prozesse … Jeder Skill wird beim Spielen entdeckt, kindgerecht erklärt und mit einer Quizfrage gemeistert.
- **Lernmodus:** doppelte Bedenkzeit bei allen Timern.
- **Bewährungsproben** in Monat 4, 8 und 12, eine Mentorin mit passenden Tipps, Spielstand wird automatisch gespeichert.

## Steuerung

| Fernbedienung | Funktion |
|---|---|
| Pfeiltasten | Auswählen |
| OK oder ⏯ | Bestätigen |
| Zurück | Zurück / Pause |
| ☰ Menü | Ton an/aus |

## Installieren auf dem Fire TV

Die fertige APK liegt unter **Releases**.

**Per ADB vom Rechner** (Fire TV: Einstellungen → Mein Fire TV → Entwickleroptionen → ADB-Debugging an):

```bash
adb connect <IP-des-Fire-TV>:5555
adb install -r ProzesseOderPleite-FireTV.apk
```

**Oder direkt am Fire TV** mit der App *Downloader*: APK-Link aus dem Release eingeben, installieren.

## Im Browser spielen

Das Spiel ist eine reine Web-App ohne Server. Zum Ausprobieren am Rechner:

```bash
python3 -m http.server 8766 --directory game
```

Dann `http://localhost:8766` öffnen (Fenster 1280 × 720, Pfeiltasten + Enter).

## Selbst bauen

Benötigt: JDK 17 und die Android-Build-Tools (`build-tools;34.0.0`, `platforms;android-34`). Gebaut wird ohne Gradle.

```bash
./build_apk.sh            # baut ProzesseOderPleite-FireTV.apk
FIRETV=<IP>:5555 ./build_apk.sh --install   # baut und installiert direkt
```

Beim ersten Bau wird ein lokaler Signatur-Schlüssel unter `build/release.keystore` erzeugt (nicht im Repo). Updates lassen sich nur mit demselben Schlüssel über eine bestehende Installation spielen.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `game/data.js` | Branchen, Prozesse, Team, Ereignisse, Bewährungsproben |
| `game/learn.js` | Second-Hand-Shop, Verkaufsfragen mit Erklärungen, Business-Skills |
| `game/engine.js` | Spiellogik ohne Oberfläche (auch in Node lauffähig) |
| `game/ui.js` | Bildschirme, Fernbedienungs-Navigation, Duell, Sound, Spielstand |
| `game/scene3d.js` | 3D-Stadt mit three.js |
| `game/art.js` | Illustrationen als SVG |
| `android/` | Minimale WebView-App für Fire TV |
| `tools/sim.js` | Balancing-Simulation: `node tools/sim.js 400 0.6` |
| `tools/render_icons.sh` | Rendert Banner und App-Icon |

## Lizenzen

- [three.js](https://threejs.org) – MIT
- [Inter](https://rsms.me/inter/) – SIL Open Font License
