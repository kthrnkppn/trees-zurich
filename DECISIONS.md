# Design Decisions Log

Running record of non-obvious choices — **why** the code is the way it is.
Each entry protects a decision the agent might otherwise undo in a later session.

Add a new entry whenever a meaningful, non-obvious decision is made.

---

## 2026-10 · Geolocate control: manual error handling + silent accuracy fallback
The stock `GeolocateControl` (maplibre-gl 4.7.1) fails silently on iOS when the
phone refuses a location: it fires an `error` event nobody handled, greys out
the button with the red-slash icon, and (with `trackUserLocation: true`)
hard-disables it until reload. iOS often refuses *without showing a prompt*
(Location Services off, browser app not allowed, site previously denied), so
mobile users saw a dead button with no explanation.

`main.js` now listens to the control's `error` event and shows a `.geo-toast`
banner with case-specific messages (DE/EN in `i18n.js`, key mapping +
browser-name detection as pure functions in `helpers.js`, tested in
`tests/geolocate.test.js`). After a permission denial the button is re-enabled
so a later tap retries without a reload.

**Why this design:**
- `positionOptions` includes `timeout: 20000` — without it the browser default
  is "wait forever" and the timeout message could never fire.
- One silent retry with `enableHighAccuracy: false` on the first
  "position unavailable" (GPS often fails indoors; wifi/cell fixes don't).
  The control reads `options.positionOptions` fresh on every `trigger()`, so
  mutating it between triggers is supported; a second failed attempt shows the
  "move a few steps" message instead of looping.
- `detectBrowserName()` checks Edge (`Edg/`) **before** Chrome — Edge desktop
  UAs contain the Chrome token too.
- On insecure origins (`!window.isSecureContext`, e.g. the dev server via a
  LAN IP over http) browsers block location outright and report it as a
  denial — there, *every* failure gets the `geo.insecure` "open via https://"
  message instead of misleading settings instructions. Production is HTTPS
  (GitHub Pages), so real users never see this.
- `trigger()` from the `ACTIVE_ERROR` state needs two calls: one exits the
  error state, the second restarts the watch.

**Do not:** remove the `error` listener or re-add an un-`timeout`-ed
positionOptions; **do not** show technical error text — messages stay
plain-language and action-oriented.

---

## 2026-10-xx · Fountain layer: no standalone button
Fountains are wired exclusively to the "Durstige Jungbäume" filter.
Adding a separate fountain button was considered and rejected — fountains only make
sense in a watering context. Showing them independently would confuse users about
their purpose.

**Do not:** add `setFountainsVisible()` inside any `exit…()` function chain.
**Do not:** add a separate fountains toggle button to the sidebar.
`setFountainsVisible()` is called only from the `youngTreeToggle` handler and from
`deactivateYoungTree()`.

---

## 2026-09-xx · Rain stations: Waldegg (WAG) instead of Uetliberg (UEB)
Uetliberg (UEB) is a wind/temperature station with **no rain gauge** — the
`rre150d0` column is all zeros across its full history (0 of 5107 days). Waldegg
(WAG) covers the same Uetliberg/Albishang west slope and delivers real mm values.

**Do not:** switch back to Uetliberg. It will always return zeros.

Four stations are used: Fluntern (SMA/east), Affoltern (REH/north), Kloten
(KLO/NNW), Waldegg (WAG/SW). Two MeteoSwiss networks: `ogd-smn` for SMA/REH/KLO,
`ogd-smn-precip` for WAG — same CSV column, same parser.

---

## 2026-09-xx · Rain baseline norm: ~115 l/m²
The displayed summer-month norm (~115 l/m²) is derived from the actual 30-day
values of these four stations, not from a published MeteoSwiss product. It is used
only for orientation ("is this month dry?"), not as an official figure.

---

## 2026-09-xx · No drinking-water label on fountain popups
The `wasserart` field in the WVZ dataset only contains values like
"Quellwasser" / "Züriwasser" — there is **no reliable `trinkwasser` flag**.
In Zürich, almost all fountains are drinkable; the few that aren't are signed on
site. Adding an invented "drinking water" label would be inaccurate and misleading.

**Do not:** infer drinkability from `wasserart` or any other field in the dataset.
Show `wasserart` raw, or nothing.

---

## 2026-09-xx · popup `<details>` open state decided in JS, not CSS
The `<details open>` attribute is set at render time in `getPopupContent()` based
on `matchMedia('(min-width: 761px)')`. This is intentional — some browsers render
collapsed `<details>` via an internal `content-visibility` mechanism that author
CSS cannot reliably override. Deciding `open` in JS before the element is inserted
into the DOM is the only robust approach.

**Do not:** try to force `<details>` open with CSS. Use the JS render-time check.

---

## 2026-09-xx · Blutbuche distinguished by German name only
Blutbuche cultivars (Fagus sylvatica 'Atropunicea', 'Riversii', etc.) share the
same `baumgattunglat` = "Fagus" and `baumartlat` = "sylvatica" as ordinary beeches.
Only `baumnamedeu` identifies them ("Blutbuche", "Blut-Buche (var. purpurea)", …).

`isBlutbuche()` in `helpers.js` and `BLUTBUCHE_DE_NAMES` in `main.js` must stay
in sync. The `genusInfo` Fagus description ("silbergraue Rinde … im Herbst
kupferbraun") is replaced with a Blutbuche-specific fact for these trees because
the generic description would be wrong for red-leaved cultivars.

---

## 2026-09-xx · Jungbaum threshold: pflanzjahr ≥ current year − 4
Grün Stadt Zürich waters street trees through their **5th year of standing**
(not 5 years after planting date). The planting year counts as year 1, so the
threshold is `pflanzjahr >= currentYear - 4`. This is stored as `YOUNG_TREE_MIN_YEAR`
and recalculated each page load.

**Do not:** change to `currentYear - 5`. The off-by-one is intentional.

---

## 2026-xx-xx · No branches / PRs; direct push to main
The project is a solo effort. All commits go directly to `main`, which deploys
immediately to GitHub Pages. There is a Raspberry Pi cron job that also pushes to
`main` (data updates on the 1st and 15th of each month).

**Always:** run `git pull --rebase` before pushing to avoid conflicts with the
Raspi's automated commits.

---

## 2026-xx-xx · Geocoder uses Nominatim, not MapLibre's built-in
Nominatim is free, keyless, and account-free. MapLibre's built-in geocoder requires
Maptiler/MapBox keys. Privacy principle: no third-party keys, no accounts.
Fair-use: `minLength: 3`, `debounceSearch: 350ms`, biased to Zürich viewbox.

---

## 2026-xx-xx · `gone-trees.json` is an accumulating graveyard, not a diff
The file grows indefinitely — every disappeared tree is appended with a
`verschwunden: "YYYY-MM-DD"` date. Trees that reappear (data glitches) are removed
again. The app shows only one year's worth at a time (the revealed year), but the
file is the permanent record.

The year is "revealed" from 1 December of that year. Before December: a greyed
teaser button with an "available from December" tooltip.

`GONE_INCOMPLETE_THROUGH_YEAR` in `main.js` shows a disclaimer for years that were
only partially tracked (tracking began mid-2026).
