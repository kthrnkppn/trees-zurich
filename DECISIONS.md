# Design Decisions Log

Running record of non-obvious choices — **why** the code is the way it is.
Each entry protects a decision the agent might otherwise undo in a later session.

Add a new entry whenever a meaningful, non-obvious decision is made.

---

## 2026-10 · Rarity explanations unfold on activation, not tooltips

The "Lebende Genbank" / "Einzelgänger" buttons explain themselves in a text
block that unfolds beneath them while their star mode is active
(`#rarity-info`, swapped per mode, folds on deactivate — `syncRarityInfo()`
in main.js). Katharina rejected hover tooltips after she couldn't find the
explanation on the page: tooltips are invisible on touch devices and
undiscoverable. Wording is data-honest by design: "einmalige Obstsorten"
(not "alte" — the data proves uniqueness, not the age of the cultivar; most
are historic landraces, a few are modern breeds), and the loner text spells
out "Zürich, not the world".

**Do not:** move these explanations back into `title` attributes, or make
the wording claim more than the filter rule supports (uniqueness within the
city's tree catalogue).

---

## 2026-10 · Touch-target sizes: ≥40px on the map, invisible hit-area extensions inline

Katharina's accessibility pass found the small controls under the 44px touch
guideline (WCAG 2.5.5 / Apple HIG): map control buttons were the library's
29px, the popup's × was 24px, the card share icon ~15px, the filter share and
help buttons 24px, the DE|EN buttons ~21px tall.

Fixes, all in style.css, visual design preserved:
- Map control buttons (geolocate, zoom, compass, fullscreen) → 40×40. Their
  icons are centred background images that scale with the button — verified
  before resizing. Attribution stays library-sized (excluded from the rule).
- Popup close × → 36×36, flex-centred, hover colour + inside focus ring. The
  header band's white strip grew with it (26 → 36px) so the × still sits
  entirely on plain paper; `.tp-head` top/right padding and the fountain
  popup's right padding grew to reserve the bigger column.
- Card share icon: the 15px glyph keeps its exact inline position; an
  invisible `::after` (inset −9px → ~33px, −14px under `pointer: coarse`
  → ~43px) carries the real hit target. Pseudo-elements are part of the
  element for hit testing — this grows the target without disturbing the
  title's line flow.
- Filter share + help buttons → 32×32; DE|EN buttons via padding → ~31px tall.

**Do not:** shrink these back for visual tidiness, remove the `::after` hit
extension (the glyph alone is un-hittable), or resize map-control icons via
fixed sprite offsets — they are centred (`50% 50%`), which is what makes the
button growth safe.

---

## 2026-10 · Filter sharing re-added: `?f=` + share button in the Filter panel

Filter sharing is back (it was built, then cut before the tree-sharing release —
see "Share links: parsed once on load" below). Katharina's placement call: the
share icon lives **in the Filter panel's heading row** (`#share-filter`, next to
the "Filter" h2) — it shares exactly what that panel configures, while the tree
cards' share buttons keep meaning "share this tree". Same icon, different
object, placed where the object lives. With no filter active the button shares
the plain URL; it never greys out.

Encoding (helpers.js, pure + unit-tested): `f` = compact JSON, only active
dimensions. Curated collections travel **by id** (`{"c":"allergie"}` — the
receiver resolves against its own collections.js, so later edits propagate);
search-derived genus groups travel as raw query + genus list
(`{"c":{"q":"Kastanie","g":[...]}}` — they exist in no dataset). Keys: `g` genus,
`s` species (only with a genus), `ym`/`yx` year range, `u` unknown-year,
`w` young-tree, `b` Blutbuche. Language never travels.

Decoding rules that matter:
- Malformed/hostile payloads degrade to the plain map: unknown keys ignored,
  every value length- and range-checked (names ≤64 chars, years 1665–2100),
  and a payload with nothing left after sanitizing → null.
- The two year-window toggles stay mutually exclusive in links (`u` wins,
  matching the UI's own order); a year range is never encoded while a toggle
  owns the window.
- Blutbuche is standalone by design — `jumpToBlutbuche()` resets everything,
  so a `b` link drops all other keys.
- A stale/unknown curated id (collection renamed or removed since the link was
  made) degrades to the plain map, never to a half-built scope.

`applySharedFilter()` (main.js) rebuilds the filter by **driving the real
control paths** — genus/species change events, the year-unknown checkbox, the
young-tree toggle, the "Filtern" button — never by silently setting
`filterState`. That is what keeps every control honestly mirroring its slice
(entry above) on the receiving end too. A genus drilled into a collection
(legend tap) rides along inside the scope. `?baum=` wins if a link somehow
carries both. As with tree links, the URL keeps the share until the visitor
takes over (`sharedLinkActive`, set after the consume calls).

**Do not:** set `filterState` directly in the shared-filter path (that's how
the display-lies state bugs crept in before), encode collection *genera lists*
for curated chips (id only), or drop a shared-filter step silently into a
"best effort" mixture the controls can't display.

---

## 2026-10 · Every control mirrors its own slice of the filter state

The old genus-group behaviour faked a state: the search field showed
"Kastanie · 2 Gattungen" (not a real search term) while the genus dropdown
claimed "Alle Gattungen" over an already-filtered map. Katharina's redesign
rule: **each control honestly shows its own dimension** — search field = the
name/query ("Kastanie" raw; "Allergiebäume" for a curated chip, even though
nothing was typed), genus dropdown = the active scope, species dropdown = the
scope's species, year fields = the auto-span.

Implementation (`applyCollectionScope` in main.js, one path for curated chips
AND synthetic search groups):
- Scoped genus dropdown: "Alle Gattungen" (exit) + a `__scope__` option
  ("n Gattungen", selected) + only the member genera — NOT all ~115. This
  kills the "field says Allergiebäume, pick Taschentuchbaum below" mismatch.
- Species dropdown lists all scope species in `<optgroup>`s per genus, values
  encoded `Genus|art` (epithets repeat across genera). Picking one narrows to
  that single genus (scope ends, chip deactivates, field clears) and selects
  the species via `jumpToSpecies`.
- `searchFieldShowsCollection` flag: a scope label leaves the field when the
  scope ends (reset, drill-down, chip toggle-off); user-typed text survives
  reset as before. Typing over a scope keeps it applied until a new selection
  or reset (typing only opens suggestions).
- After `fillGenusSelect()` inside the genus change handler, re-select the
  picked genus — the rebuild resets the select's value to '0' otherwise
  (display lies while the filter is right).
- The species dropdown mirrors the same pattern (Katharina): resting display
  is a count entry ("36 Arten" / "{n} species", `filter.speciesCount`,
  selected via the same `__scope__` sentinel), "Alle Arten" stays the first
  option and the clear-action, grouped species open below. Applies to
  multi-genus scopes AND single-genus lists (fillSpecies). Picking the count
  entry means "no species picked" — never filter on the sentinel value.

**Do not:** show "Alle Gattungen" while a collection is active, put the scope
label into the search field as if it were a query result ("Kastanie · 2
Gattungen" there is dead), or leave the full genus list in the dropdown under
a scope. This state shape is the contract a future shareable-filter URL
(`?f=…`) will encode — keep curated-by-id vs. synthetic-genera-list distinct
when serializing.

---

## 2026-10 · Tree search: genus intent wins on Enter

Plain "Linde" + Enter used to jump to "Lindenblättrige Birke" because Enter
picks `suggestions[0]` and the old order followed catalogue index order —
prefix matches ("lindenblättrige…" starts with "linde") outranked the genus
entry whenever that genus came later in `treeMeta.genera`. `searchTrees()` now
ranks on two independent dimensions: match quality (exact whole word →
word-final compound like "sommerlinde" → word-start prefix → loose substring;
hyphens ignored on both sides so "stieleiche" finds "Stiel-Eiche") and **genus
before species across all quality tiers**. A query that matches any genus name
means "show me that genus", so Enter applies the genus filter — identical to
clicking the legend chip. Species-intent queries still win once no genus name
matches ("Rotbuche", "Lindenblättrige", "Stieleiche").

**Do not:** "simplify" the genus-first rule back into a single quality-sorted
list — that reintroduces the Enter-jumps-to-wrong-species bug for "Kastanie"
(vs. "Kastanienblättrige Eiche") and friends. Also keep the hyphen-stripping
in `rank()`: genus/species haystacks are hyphenated, queries are not.

## 2026-10 · Search genus groups: compound names filter several genera

User expectation (Katharina): "Kastanie" + Enter should show Ross- AND
Edelkastanie — every tree commonly called that. Refining her follow-up
("most people don't care that a Hainbuche isn't a Buche"), the rule became
**tail matching**: a search term gathers every genus whose name *ends* with
it (exact names included) into one group — "Kastanie" → Ross-/Edelkastanie,
"Buche" → Fagus + Hainbuche + Südbuche + Hopfenbuche, "Tanne" → Abies +
Spiesstanne + Schirmtanne + Hemlocktanne. A group only forms when at least
one *proper compound* match exists, so a full genus name stays alone:
"Walnuss" must not drag in the Flügelnuss, and "Linde" stays Tilia because
no other genus name ends in "-linde" (the "Steinlinde" is Phillyrea anyway,
whose genus entry has no German alias in GenusDeNames).

Selecting the group entry (kind `genusgroup`, label like "Buche · 4
Gattungen") calls `jumpToGenusGroup()`, which sets `filterState.collection`
to a **synthetic collection object** (`{ id: 'search:…', genera }`) — the
exact mechanism the curated collection chips use, so legend, counts,
drill-down and reset all work for free.

- Group members are dropped when absent from the loaded data (`genusCount >
  0`, guarded by `genusCounts.size` since the index exists before data load).
- The rank's token split is `/[\s/]+/`, not just whitespace: Prunus's genus
  name is "Kirsche/Pflaume", and without slash splitting "Kirsche" would
  miss the genus entirely and fall through to a species match.
- No chip exists for the group; the escape path is the genus dropdown "Alle
  Gattungen" (its change handler clears `filterState.collection`).

**Do not:** reuse curated collection ids or add the group to
`collectionChips` — the synthetic id never matches a chip, which is what
keeps the chips' active-state logic untouched. And do not "fix" the
generous tail matches (Ölweide inside "Weide", Heckenkirsche inside
"Kirsche"): that generosity is the point — the group label and legend name
every member, so nothing is hidden from the user.

## 2026-10 · One tree card at a time

`openTreePopup()` closes the previously open tree card before opening a new
one. Plain map clicks never stacked cards (MapLibre's default `closeOnClick`
closes them), but the jump paths — share links, tree-ID search, stats
coordinates — bypass the map canvas and previously stacked new cards on top of
old ones. With tree-ID search this became easily reachable in normal use.

**Do not:** "restore" multi-popup coexistence for the spotlight/dimming stack.
`openTreePopups` now normally holds a single entry; the stack logic stays as a
guard for every close path, not as a coexistence feature.

## 2026-10 · Baum-ID search: digit heuristic + gone trees included

Tree IDs (baumnummer) are searchable in "Baum suchen" so a shared `?baum=` link
is findable in both directions. Two non-obvious choices:
- **Digit heuristic:** ID matching only runs when the query contains a digit —
  IDs always have one (`nn-1851`, `WD-13806`), genus/species names never do.
  This keeps plain name searches free of ID noise and skips the lazy index.
- **Gone trees are indexed too** (marked "verschwunden"); selecting one reuses
  `flyToTreeByNummer()`'s graveyard path. Because graveyard data loads *after*
  the tree data, `treeIdIndex` is reset there (`treeIdIndex = null`) and never
  cached before `allFeatures` is populated.

**Do not:** drop the digit heuristic or fold IDs into the static `searchIndex`
(it is built at parse time, before the async tree data exists).

## 2026-10 · style.css loads AFTER the MapLibre stylesheets

For weeks our `.maplibregl-popup-content` overrides (padding, tip colour,
radius) silently lost to the library's `padding: 15px 10px` — style.css was
linked before the unpkg MapLibre CSS in index.html, and equal-specificity
rules resolve by order. Nothing visibly broke until the tinted header band
relied on the padding values, when the mismatch became grossly visible
(band overhanging the card). The link now sits after both library CSS files.

**Do not:** move the style.css link back above the library CSS (e.g. to keep
"our styles first") — every MapLibre default we restyle depends on winning
the order. When overriding a third-party stylesheet, always load ours last.

## 2026-10 · Tree popups: focus the card, not its first link

MapLibre's `focusAfterOpen` (default true) focuses the popup's first focusable
element on open — the tree-name Wikipedia link — which paints the browser's
default blue focus ring over the name, one box per wrapped line, on every
programmatic open (share links, but also normal taps). Fix: `focusAfterOpen:
false` in `openTreePopup()`, then focus `.maplibregl-popup-content` manually
(`tabindex="-1"`). Screen readers still announce the popup and Tab still
reaches its links, but nothing visibly lights up; the card's own focus ring is
suppressed in CSS because it would read as a glitch, while links keep their
rings when genuinely keyboard-tabbed. The fountain popup has no focusable
elements, so MapLibre's default never focused anything there — left untouched.

**Do not:** revert to `focusAfterOpen: true`, and don't remove the manual
focus call "because nothing seems to use it" — it is the screen-reader
announcement path.

---

## 2026-10 · Selection dimming: tied to popup open/close, not to share links

Opening a tree popup dims every other tree dot to 25% opacity (paint
expressions per layer, built by `selectionDimExpr()` in helpers.js); closing
the popup restores full opacity. This is deliberately a *selection* behavior,
not a share-link special case: a shared link simply auto-opens the popup, so
the recipient gets the same spotlight with no extra state, no extra URL
params, and no exit chip needed — closing the card IS the exit.

Details that matter:
- Several popups can coexist (MapLibre never removes old ones). `openTreePopups`
  (main.js) tracks them; the dim spotlight follows the most recently opened
  tree and falls back to the previous one when the top popup closes.
- Popups for trees without a `baumnummer` (pre-ID graveyard ghosts) never dim
  anything — the spotlight expression would match nothing and dim even the
  selected ghost.
- Per-layer base opacities are preserved on restore: gone-ghosts are 0.85,
  everything else 1. The treasure layer is a symbol layer, so it dims
  `icon-opacity`, not circle paint properties.

**Do not:** add a separate "share mode" state machine or URL flag for shared
trees, and don't dim on hover — dimming means "a card is open".

---

## 2026-10 · Share links: parsed once on load; tree sharing only

One link type for this release: `?baum=<baumnummer>` (a single tree — flies
there, opens the popup, clears any filter that would hide the tree). Links
never carry language or any other state. Filter sharing (`?f=…`) was built and
then deliberately removed before release: the sidebar "Ansicht teilen" button,
its `encodeShareFilter`/`decodeShareFilter` helpers, and `applySharedFilter`
are gone. A stale `?f=` param from an old link is simply ignored — parse
falls through to the plain map. Filter sharing may return in a future release;
if so, re-add it with the same encode-once shape (`f` = compact JSON).

`flyToTreeByNummer()` looks trees up by `baumnummer`, not coordinates —
coordinates drift when the city data updates, IDs don't. Vanished trees are
resolved from the full graveyard (`graveyardFeatures`), not the revealed-year
subset.

**Do not:** resolve share-link trees by coordinates.

---

## 2026-10 · Share-link URL: released when the visitor takes over

A shared tree link is consumed once on load, but the URL keeps pointing at the
shared tree until the visitor takes ownership of the map: closing the tree
card, or driving any filter themselves (any later `applyFilters` call). At
that moment the address bar quietly switches to the plain URL (`replaceState`,
no history entry), so a reload no longer re-applies the share — while the card
is still open, a reload restores the shared tree. This amends (not reverts)
the copy-only principle above: the share button still builds its URL fresh on
demand; the takeover release is the single scoped exception. `sharedLinkActive`
is set only AFTER the load-time consume calls so their internal
applyFilters/reset calls don't count as takeover.

**Do not:** strip the URL earlier (reload while the card is open should
restore the shared tree), or use `pushState` (it would pollute the back
button).

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

## 2026-10-21 · Fountains: show ALL of them, no usability pre-filter
The fountain layer shows every fountain in the WVZ dataset except the ones
currently shut off (`abgestellt != "nein"` — a factual status, the only rule
kept in `scripts/fetch_brunnen.py`). The old first-instance usability filter
(art=öffentlich, material_trog required, no Notwasserbrunnen, ~783 of ~1288)
was removed deliberately: it kept excluding usable fountains — street-facing
ones classified "privat" for sitting on private ground (Katharina's own
neighbourhood fountain), trough-less columns that still fill a can, drinking
fountains with scooping basins. Visitors judge accessibility better than the
dataset does. The young-tree hint wording reflects this: "Blaue Tropfen
zeigen Brunnen — nicht jeder ist frei zugänglich."

**Do not:** reintroduce an art/trough/brunnenart pre-filter in
fetch_brunnen.py, and do not add a "private fountain" styling distinction —
the whole point is to show pins without judging them.

---

## 2026-10-21 · "Im Sommer" section: seasonal sidebar position
The young-tree/watering control lives in its own "Im Sommer" panel between
Filter and Sammlungen in the HTML. From October through April,
`positionSummerSection()` (main.js) moves it below the "Raritäten &
Kuriositäten" panel (originally only below the Sammlungen — Katharina moved
it further down in 2026-10: the gene bank matters in winter too, so the
rarities must not be pushed away by a summer control); May–September
(`isWateringSeason()` in helpers.js, pure + unit-tested) it stays put.
Repositioning, never hiding — the control must remain visible and functional
year-round. Deterministic by date: everyone sees the same order on the same
day.

**Do not:** hide or remove the section in winter, drive placement from live
rain data (unpredictable moves), or un-mirror `isWateringSeason` between
helpers.js and tests/helpers.test.js (the test file mirrors pure functions
by design — change both together).

---

## 2026-10-21 · "Unbekanntes Pflanzjahr" is a checkbox, not a chip/button
The year-unknown control sits in the Pflanzjahr fieldset as a real
`<input type="checkbox">` (label `.year-unknown-field`, custom square/lime
styling). Deliberate choice after discussing a move into "Sammlungen": it is a
data-quality condition that *stacks* on top of genus/species/collection
(Hainbuche + unknown year → only undated Hainbuchen), while collection chips
*replace* each other and the genus selection. A checkbox telegraphs that
combining behavior; a chip would promise chip semantics. Needs `padding: 0` —
the shared input padding stretches the custom box otherwise.

**Do not:** restyle it as a `.collection-chip`, move it into the Sammlungen
panel as a chip, or "unify" it with the young-tree treasure-btn — and keep the
mutual exclusion with the young-tree toggle (both own the year window).

---

## 2026-10-21 · Year fields auto-span the current selection
On every genus/species/collection change (not year-driven changes), the two year
fields refill with the real planting-year span of that selection
(`plantingYearSpan()` in `helpers.js` + `syncYearRange()` in `main.js`), so
selecting "Eiche" instantly shows "oldest oak: 1850". Until "Filtern" is
pressed this is informational only — the map does not narrow further.

**Rules (do not break):**
- A range the user typed or applied deliberately survives selection changes
  (`yearFieldsDirty` / non-default applied range). Only a range identical to
  the untouched full defaults (1665–current year) yields to the next auto-span.
- The "unknown year" and "young tree" toggles own the year window — never
  auto-fill while either is active.
- A selection with no dated trees leaves the fields untouched (`span === null`).
- Auto-fill never sets `filterState.yearMin/Max` itself; only the "Filtern"
  button turns the displayed span into a real filter (pre-existing semantics:
  any applied range excludes undated trees).

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
