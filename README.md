# salabdating — swipe demo

A presentation demo of a dating app. You swipe through random profiles and get a
match at random moments. When it is a match, the message written by that profile
appears on screen.

Everything is static (HTML, CSS, JavaScript) — no build step, no dependencies.

## Demo account

The demo is presented from a **male account looking for women**, so every profile
in the deck is a woman. The account's own photo (shown on the match screen) is
`images/you.jpg`.

The profiles are written in English for an Arabic audience: Arabic names, cities
across the Gulf and the Levant, and illustrated portraits in `images/`.

## Live demo

https://wolwoltje68.github.io/salabdating/

GitHub Pages is set to **Deploy from a branch** (`claude/dating-app-swipe-gjun2e`,
folder `/ (root)`), so GitHub rebuilds the site on every push. The workflow in
`.github/workflows/pages.yml` is the alternative route (Source: GitHub Actions)
and is not used in that setup.

## Controls

| Action | How |
| --- | --- |
| Swipe right (like) | Drag the card right, click ❤️, or press `→` |
| Swipe left (skip) | Drag the card left, click ✕, or press `←` |
| Reshuffle the deck | Middle button |
| Close the match screen | `Esc`, `Enter`, or "Keep swiping" |

Dragging uses pointer events, so it works with a mouse, a touchscreen and a pen —
handy on a tablet or phone during the presentation.

## How it works

1. `app.js` reads `profiles/index.json` — the list of profile files.
2. Each profile is fetched from `profiles/` as its own JSON file.
3. The profiles are shuffled (Fisher-Yates), so the order differs every session.
4. On a right swipe, `Math.random()` decides whether it becomes a match. The odds
   come from the profile's `matchChance` field (defaults to `0.5`).
5. On a match, the match screen shows the text from `matchText`. No match? A short
   message appears instead.

## Folders

```
index.html          the page
styles.css          styling
app.js              swipe logic, profile loading, match handling
profiles/
  index.json        list of profile files
  layla.json        one profile per file
  ...
images/
  layla.jpg         photo for that profile (800x1040)
  you.jpg           the account's own photo on the match screen
  ...
```

## Adding a profile

1. Put the photo in `images/` (for example `images/salma.jpg`; `.png` and `.webp`
   work too). Portrait format, roughly 800x1040, keeps the cards consistent.
2. Create `profiles/salma.json`:

```json
{
  "id": "salma",
  "name": "Salma",
  "age": 28,
  "city": "Doha",
  "distance": 11,
  "work": "Photographer",
  "bio": "A short introduction, a couple of lines at most.",
  "interests": ["Photography", "Running", "Cooking"],
  "image": "images/salma.jpg",
  "matchChance": 0.5,
  "matchText": "This text appears on screen the moment it is a match."
}
```

3. Add `"salma.json"` to `profiles/index.json`.

Every field except `name` and `image` is optional: without `matchChance` the odds
are 50%, and without `matchText` the match screen shows a default line.

## Running locally

The profiles are loaded with `fetch()`, so opening the page over `file://` does not
work. Start a small web server in the project folder:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then open http://localhost:8000.

## About the photos

The portraits are custom-made illustrations rendered to JPEG, so the demo uses no
third-party image rights and loads instantly. Replace them with real photos
whenever you like — only the `image` field in the profile needs to change.
