# salabdating — swipe-demo

Een presentatiedemo van een dating-app: je swipet door willekeurige profielen en
krijgt op willekeurige momenten wel of geen match. Bij een match verschijnt het
bericht dat het profiel zelf heeft opgegeven.

Alles is statisch (HTML, CSS, JavaScript) — geen build, geen dependencies.

## Live demo

https://wolwoltje68.github.io/salabdating/

> Eenmalig instellen: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
> Daarna publiceert de workflow `.github/workflows/pages.yml` de site bij elke push.

## Bediening

| Actie | Hoe |
| --- | --- |
| Naar rechts (leuk) | Kaart naar rechts slepen, op ❤️ klikken of `→` |
| Naar links (overslaan) | Kaart naar links slepen, op ✕ klikken of `←` |
| Stapel opnieuw schudden | Middelste knop |
| Matchscherm sluiten | `Esc`, `Enter` of "Verder swipen" |

Slepen werkt met muis, touch en pen (pointer events), dus ook op een tablet of
telefoon tijdens de presentatie.

## Hoe het werkt

1. `app.js` leest `profiles/index.json` — dat is de lijst met profielbestanden.
2. Elk profiel wordt als los JSON-bestand uit `profiles/` opgehaald.
3. De profielen worden geschud (Fisher-Yates), zodat de volgorde elke keer anders is.
4. Swipe je naar rechts, dan bepaalt `Math.random()` of het een match wordt.
   De kans komt uit het veld `matchKans` van het profiel (standaard `0.5`).
5. Bij een match verschijnt het matchscherm met de tekst uit `matchTekst`.
   Geen match? Dan verschijnt kort een melding in beeld.

## Mappen

```
index.html          de pagina
styles.css          vormgeving
app.js              swipe-logica, laden van profielen, matchafhandeling
profiles/
  index.json        lijst met profielbestanden
  lotte.json        één profiel per bestand
  ...
images/
  lotte.svg         afbeelding bij het profiel
  jij.svg           jouw eigen foto op het matchscherm
  ...
```

## Een profiel toevoegen

1. Zet de afbeelding in `images/` (bijv. `images/mees.svg`, ook `.jpg`/`.png`/`.webp` mag).
2. Maak `profiles/mees.json`:

```json
{
  "id": "mees",
  "naam": "Mees",
  "leeftijd": 28,
  "woonplaats": "Zwolle",
  "afstand": 11,
  "werk": "Fotograaf",
  "bio": "Korte introductie van maximaal een paar regels.",
  "interesses": ["Fotografie", "Hardlopen", "Koken"],
  "afbeelding": "images/mees.svg",
  "matchKans": 0.5,
  "matchTekst": "Deze tekst verschijnt in beeld zodra het een match is."
}
```

3. Voeg `"mees.json"` toe aan `profiles/index.json`.

Alle velden behalve `naam` en `afbeelding` zijn optioneel: ontbreekt `matchKans`,
dan is de kans 50%; ontbreekt `matchTekst`, dan toont het matchscherm een
standaardregel.

## Lokaal draaien

De profielen worden met `fetch()` opgehaald, dus openen via `file://` werkt niet.
Start een kleine webserver in de projectmap:

```bash
python3 -m http.server 8000
# of: npx serve .
```

Open daarna http://localhost:8000.

## Over de afbeeldingen

De portretten zijn zelfgemaakte SVG-illustraties, zodat de demo geen rechten van
derden gebruikt en razendsnel laadt. Vervang ze gerust door echte foto's — pas
dan alleen het veld `afbeelding` in het profiel aan.
