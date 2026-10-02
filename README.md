# FRAME / Korea Filming Locations

An interactive, drill-down map of Korean drama/film/CF filming locations, built
on a real OpenStreetMap base map (Leaflet), with D3 + TopoJSON for the data
layers, plain CSS and vanilla JS (no build step).

**Data note:** despite the source file's Korean title ("서울시 드라마CF촬영장소 정보"),
the dataset contains no Seoul-only records and no coordinates — it's a
nationwide list of province/city/district names. The app therefore covers all
of South Korea rather than Seoul alone, and geocodes each record by matching
its province/district text to a real municipality boundary (see `data/` below).

The dataset ships in two parallel CSVs — an English translation and the
original Korean — that describe the exact same 286 physical locations (same
ids, same province/district/neighborhood presence for every id). They're
merged by id rather than treated as separate location sets, so every record
carries both a `nameEn` and a `nameKr` (plus the Korean search term and
native-script province/city/neighborhood names) at a single geocoded
position. A **Language** filter in the header controls which title is shown
on the map/list/tooltips and which language the search box matches — it never
duplicates or hides dots, since both languages point at the same place.

## Included

- `index.html` — page structure
- `styles.css` — visual design (light/dark aware, tokens from the dataviz palette)
- `app.js` — Leaflet map, province overlay, drill-down, filtering, tooltips, stats panel
  (tile provider settings live in the `MAP_CONFIG` constant)
- `data.csv` — the English-language source dataset (CP949-encoded)
- `data_kr.csv` — the Korean-language source dataset (CP949-encoded), same ids
- `data/records.json` — the two CSVs merged by id: each record carries both
  language's titles, is matched to a province + municipality code, and gets a
  derived `type` (Film / TV Drama / Studio & Theme Park) inferred from the
  English title
- `geo/provinces-topo.json`, `geo/municipalities-topo.json` — South Korea
  administrative boundaries (from the `southkorea/southkorea-maps` project),
  used both for the province overlay and to place each record at its municipality's
  centroid (their Korean `name` property also supplies the native-script
  province/city labels)

## How it works

The base map is [Leaflet](https://leafletjs.com) 1.9.4 with OpenStreetMap
standard raster tiles; Leaflet, D3 and topojson-client load from CDNs with
pinned versions (Leaflet with SRI hashes). Scroll/pinch to zoom, drag to pan,
or use the +/- buttons and arrow keys. Panning is limited to South Korea
(including Jeju) plus a little padding.

1. **National view** — the 17 province polygons (TopoJSON converted with
   `topojson-client`, drawn as a Leaflet GeoJSON layer) are shaded by how many
   filtered records fall in each, semi-transparent so basemap roads and labels
   stay readable, with thin outlines and a legend. Hovering highlights a
   province and shows its name and count.
2. **Click a province** (on the map or in the right-hand list) — the map flies
   to it, its fill fades out (outline stays), a dot appears for every matching
   record at its municipality centroid (small deterministic spiral when several
   share one), and the panel switches to that province's stats.
3. **Hover/click a dot** — hover shows a tooltip; clicking pins full details
   (type, province, city/county, neighborhood, record ID) in the panel and
   highlights the row in the list. Clicking a list row pans/zooms to its dot.
4. **Back to national view** — the header button or Esc flies back to the
   whole country, clears the selected province and pinned dot, and restores
   the choropleth.

**Free navigation rules.** The *selected province* — not the viewport —
drives the stats panel and the dots, so panning/zooming around never changes
them. Clicking another province while one is selected switches straight to it.
Zooming out by hand to roughly the national zoom releases the selection
(equivalent to National view, without moving the map).

Filters (type chips, language, title search) scope the choropleth, dots, list
and every number at once; layers are updated in place, so the current
zoom/position is kept. The map follows the light/dark theme (dark mode applies
a CSS filter to the tile pane only). With `prefers-reduced-motion`, fly
animations are replaced by instant view changes. The layout stacks the panel
under the map on narrow screens.

### Tile provider and OSM attribution

Provider, attribution and zoom limits are in one constant at the top of the map
section of `app.js` (`MAP_CONFIG`); change `tileUrl` / `attribution` to swap
providers. The default is `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
with the required "© OpenStreetMap contributors" attribution (shown by the
map). It respects the
[OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
no prefetching or bulk loading, the browser's Referer is not stripped
(`<meta name="referrer">` keeps the origin-only default), and max zoom is 18.
The public OSM tile servers are meant for light use; for heavy traffic use a
dedicated tile provider.

## Regenerating `data/records.json`

If `data.csv` or `data_kr.csv` changes, rebuild the merged dataset with:

```bash
python3 data/build_records.py
```

The matching logic (with a couple of manual aliases for known typos/ambiguous
names in the source data) lives in that script; it reads both CSVs plus the
two topology files in `geo/` and writes `data/records.json`.

## Run locally

Because the app fetches JSON via `fetch`, it needs a local server rather than
opening the file directly (an internet connection is needed for the CDN
scripts and map tiles):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data source

Seoul Open Data Plaza:
https://data.seoul.go.kr/dataList/OA-13021/A/1/datasetView.do

Administrative boundaries: https://github.com/southkorea/southkorea-maps
(KOSTAT 2018 boundaries, simplified TopoJSON).
