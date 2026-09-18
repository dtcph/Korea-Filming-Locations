# FRAME / Korea Filming Locations

An interactive, drill-down map of Korean drama/film/CF filming locations, built
with D3 + TopoJSON, plain CSS and vanilla JS (no build step).

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
- `app.js` — D3 map, zoom/drill-down, filtering, tooltips, stats panel
- `data.csv` — the English-language source dataset (CP949-encoded)
- `data_kr.csv` — the Korean-language source dataset (CP949-encoded), same ids
- `data/records.json` — the two CSVs merged by id: each record carries both
  language's titles, is matched to a province + municipality code, and gets a
  derived `type` (Film / TV Drama / Studio & Theme Park) inferred from the
  English title
- `geo/provinces-topo.json`, `geo/municipalities-topo.json` — South Korea
  administrative boundaries (from the `southkorea/southkorea-maps` project),
  used both to draw the map and to place each record at its municipality's
  centroid (their Korean `name` property also supplies the native-script
  province/city labels)

## How it works

1. **National view** — a choropleth of all 17 provinces, shaded by how many
   (filtered) records fall in each one.
2. **Click a province** — the view zooms to fill the map pane, dots appear for
   every record in that province (placed at their municipality centroid, with
   a small deterministic spread when several records share one municipality),
   and the right-hand panel switches to that province's stats.
3. **Hover/click a dot** — hover shows a quick tooltip; clicking pins full
   details (type, province, city/county, neighborhood, record ID) in the right
   panel and in the location list.
4. **Back to national view** — the "National view" button in the header, or
   the Esc key.

Filters (type chips, language, title search) scope the choropleth, the dots,
and every number in the stats panel at once.

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
opening the file directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Data source

Seoul Open Data Plaza:
https://data.seoul.go.kr/dataList/OA-13021/A/1/datasetView.do

Administrative boundaries: https://github.com/southkorea/southkorea-maps
(KOSTAT 2018 boundaries, simplified TopoJSON).
