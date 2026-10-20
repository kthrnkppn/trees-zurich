// Canonical GeoJSON property names from the Stadt Zürich Baumkataster feed —
// a single source of truth so main.js and stats.js don't each redefine (and
// risk drifting on) the same field names independently.
export const GENUS_FIELD = 'baumgattunglat'; // latin genus, e.g. "Acer"
export const SPECIES_FIELD = 'baumartlat'; // latin species epithet — groups all cultivars
export const YEAR_FIELD = 'pflanzjahr';
export const ID_FIELD = 'baumnummer'; // unique across the whole data set; the identity for share links
export const LATIN_NAME_FIELD = 'baumnamelat'; // full latin binomial, used for rarity + wiki links
export const DE_NAME_FIELD = 'baumnamedeu'; // curated German common name
