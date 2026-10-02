(() => {
  "use strict";

  const TYPES = [
    { key: "Film", varName: "--type-film" },
    { key: "TV Drama", varName: "--type-drama" },
    { key: "Studio & Theme Park", varName: "--type-studio" },
  ];

  // Language names are shown in their own script and are never translated
  // (a language picker doesn't localize its own labels).
  const LANGUAGES = [
    { key: "kr", label: "한국어" },
    { key: "en", label: "English" },
  ];

  const I18N = {
    en: {
      brandSub: "Korea Filming Location Explorer",
      pageTitle: "FRAME — Korea Filming Locations",
      typeLabel: "Type",
      languageLabel: "Language",
      searchLabel: "Search",
      searchPlaceholder: "Search title…",
      backLabel: "National view",
      backTitle: "Back to national view (Esc)",
      mapTitleDefault: "South Korea — filming location density",
      mapSubDefault:
        "Hover a province to preview. Scroll to zoom and drag to pan, or click a province to jump to its filming locations.",
      mapSubRegion:
        "Hover a dot to preview, click to see full details on the right. Press Esc or use National view to zoom back out.",
      legendDensity: "Location density",
      legendLow: "Low",
      legendHigh: "High",
      legendType: "Type",
      typeNames: {
        Film: "Film",
        "TV Drama": "TV Drama",
        "Studio & Theme Park": "Studio & Theme Park",
      },
      byType: "By type",
      statMatching: "Matching records",
      statMapped: "Mapped locations",
      statProvinces: "Provinces",
      statMunicipalities: "Municipalities",
      statDistinct: "Distinct titles",
      statsAllTitle: "All of South Korea",
      statsAllSub: (n, mapped) =>
        `${n} matching record${n === 1 ? "" : "s"} · ${mapped} mapped`,
      statsRegionSub: (n) =>
        `${n} matching record${n === 1 ? "" : "s"} in this province`,
      provincesByCount: "Provinces by count",
      locationsIn: (name) => `Locations in ${name}`,
      unlocatedNote: (n) =>
        `${n} matching record${n === 1 ? "" : "s"} have no recorded location and are not shown on the map.`,
      tooltipCount: (n) => `${n} filming location${n === 1 ? "" : "s"}`,
      detailTitleLabel: "Title",
      detailType: "Type",
      detailProvince: "Province",
      detailCity: "City/County",
      detailNeighborhood: "Neighborhood",
      detailRecordId: "Record ID",
      dash: "—",
      loading: "Loading map…",
      errData: "Couldn't load the map data. Check your connection and reload the page.",
      errLib: "Couldn't load the map libraries (Leaflet / D3). Check your connection and reload the page.",
      errTiles:
        "The OpenStreetMap base map couldn't be loaded (blocked or offline). Boundaries and data still work.",
      mapAria: "Map of South Korea filming locations. Use arrow keys to pan and plus/minus to zoom.",
      listAria: (name) => `Show ${name}`,
    },
    kr: {
      brandSub: "한국 촬영지 탐색기",
      pageTitle: "FRAME — 한국 촬영지 탐색기",
      typeLabel: "유형",
      languageLabel: "언어",
      searchLabel: "검색",
      searchPlaceholder: "제목 검색…",
      backLabel: "전국 보기",
      backTitle: "전국 보기로 돌아가기 (Esc)",
      mapTitleDefault: "대한민국 — 촬영지 밀도",
      mapSubDefault:
        "지역에 마우스를 올려 미리보세요. 스크롤로 확대·축소, 드래그로 이동할 수 있고, 지역을 클릭하면 해당 지역의 촬영지로 바로 이동합니다.",
      mapSubRegion:
        "점에 마우스를 올리면 미리보기가, 클릭하면 오른쪽에 상세 정보가 표시됩니다. Esc 또는 전국 보기로 돌아갈 수 있습니다.",
      legendDensity: "위치 밀도",
      legendLow: "낮음",
      legendHigh: "높음",
      legendType: "유형",
      typeNames: {
        Film: "영화",
        "TV Drama": "TV 드라마",
        "Studio & Theme Park": "스튜디오 · 테마파크",
      },
      byType: "유형별",
      statMatching: "일치하는 기록",
      statMapped: "지도에 표시된 위치",
      statProvinces: "시·도 수",
      statMunicipalities: "시·군·구 수",
      statDistinct: "고유 타이틀 수",
      statsAllTitle: "대한민국 전체",
      statsAllSub: (n, mapped) => `${n}건 일치 · ${mapped}건 지도 표시`,
      statsRegionSub: (n) => `이 지역에서 ${n}건 일치`,
      provincesByCount: "건수별 지역",
      locationsIn: (name) => `${name} 내 촬영지`,
      unlocatedNote: (n) =>
        `${n}건은 위치 정보가 없어 지도에 표시되지 않습니다.`,
      tooltipCount: (n) => `촬영지 ${n}곳`,
      detailTitleLabel: "제목",
      detailType: "유형",
      detailProvince: "시·도",
      detailCity: "시·군·구",
      detailNeighborhood: "읍·면·동",
      detailRecordId: "기록 ID",
      dash: "—",
      loading: "지도를 불러오는 중…",
      errData: "지도 데이터를 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요.",
      errLib: "지도 라이브러리(Leaflet / D3)를 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요.",
      errTiles:
        "OpenStreetMap 배경 지도를 불러오지 못했습니다(차단되었거나 오프라인). 경계와 데이터는 계속 사용할 수 있습니다.",
      mapAria: "대한민국 촬영지 지도. 방향키로 이동하고 +/- 키로 확대·축소할 수 있습니다.",
      listAria: (name) => `${name} 보기`,
    },
  };
  function t() {
    return I18N[state.language];
  }

  const state = {
    records: [],
    provinceFeatures: [],
    muniFeatureByCode: new Map(),
    provinceByCode: new Map(),
    recordsByProvince: new Map(),
    activeTypes: new Set(TYPES.map((t) => t.key)),
    language: "kr",
    search: "",
    // Single source of truth for drill-down. The viewport never decides
    // these (except the one zoom-out rule in onZoomEnd).
    selectedProvinceCode: null,
    selectedRecordId: null,
    hoverProvinceCode: null,
    counts: new Map(),
    scale: null,
    dropZoom: 0,
    programmaticUntil: 0,
  };

  const els = {
    wrap: document.getElementById("map-wrap"),
    mapDiv: document.getElementById("map"),
    status: document.getElementById("map-status"),
    statusText: document.getElementById("map-status-text"),
    notice: document.getElementById("map-notice"),
    legend: document.getElementById("legend"),
    tooltip: document.getElementById("tooltip"),
    mapTitle: document.getElementById("map-title"),
    mapSub: document.getElementById("map-sub"),
    typeFilters: document.getElementById("type-filters"),
    languageFilters: document.getElementById("language-filters"),
    searchInput: document.getElementById("search-input"),
    resetView: document.getElementById("reset-view"),
    resetViewLabel: document.getElementById("reset-view-label"),
    brandSub: document.getElementById("brand-sub"),
    labelType: document.getElementById("label-type"),
    labelLanguage: document.getElementById("label-language"),
    labelSearch: document.getElementById("label-search"),
    typeBreakdownHeading: document.getElementById("type-breakdown-heading"),
    unlocatedNote: document.getElementById("unlocated-note"),
    statsTitle: document.getElementById("stats-title"),
    statsSub: document.getElementById("stats-sub"),
    statTiles: document.getElementById("stat-tiles"),
    typeBreakdown: document.getElementById("type-breakdown"),
    detailBlock: document.getElementById("detail-block"),
    detailTitle: document.getElementById("detail-title"),
    detailList: document.getElementById("detail-list"),
    listHeading: document.getElementById("list-heading"),
    recordList: document.getElementById("record-list"),
  };

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const reduceMotion = () => reducedMotionQuery.matches;

  function typeColor(key) {
    return cssVar(TYPES.find((t) => t.key === key)?.varName || "--type-film");
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  // ---------- language-aware display ----------

  // The English and Korean source files describe the exact same 286
  // locations (identical ids, identical geo fields) - they're two labelings
  // of one dataset, not two different sets of places. The language toggle is
  // exclusive (OR, not blended): whichever language is active is the only
  // one shown or searched, everywhere in the UI.

  function isKr() {
    return state.language === "kr";
  }

  function displayName(r) {
    return isKr() ? r.nameKr || r.nameEn || "" : r.nameEn || r.nameKr || "";
  }

  function displayMuniName(r) {
    return isKr()
      ? r.muniNameKr || r.muniName || null
      : r.muniName || r.muniNameKr || null;
  }

  function displayNeighborhood(r) {
    return isKr()
      ? r.neighborhoodKr || r.neighborhood || null
      : r.neighborhood || r.neighborhoodKr || null;
  }

  function displayProvince(r) {
    return isKr()
      ? r.provinceKr || r.province || null
      : r.province || r.provinceKr || null;
  }

  function searchableText(r) {
    return isKr()
      ? [r.nameKr, r.searchKr].filter(Boolean)
      : [r.nameEn].filter(Boolean);
  }

  // ---------- filtering ----------

  function passesFilter(r) {
    if (!state.activeTypes.has(r.type)) return false;
    if (state.search) {
      const hay = searchableText(r).join(" ").toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  }

  function filteredRecords() {
    return state.records.filter(passesFilter);
  }

  // ---------- boot ----------

  applyStaticI18N();
  showStatus(t().loading);

  boot();

  async function boot() {
    if (typeof L === "undefined" || typeof d3 === "undefined" || typeof topojson === "undefined") {
      showStatus(t().errLib, true);
      return;
    }
    let provinceTopo, muniTopo, records;
    try {
      [provinceTopo, muniTopo, records] = await Promise.all([
        d3.json("geo/provinces-topo.json"),
        d3.json("geo/municipalities-topo.json"),
        d3.json("data/records.json"),
      ]);
    } catch (err) {
      console.error(err);
      showStatus(t().errData, true);
      return;
    }

    const provinceObj = provinceTopo.objects.skorea_provinces_2018_geo;
    const muniObj = muniTopo.objects.skorea_municipalities_2018_geo;

    state.provinceFeatures = topojson.feature(provinceTopo, provinceObj).features;
    state.provinceFeatures.forEach((f) =>
      state.provinceByCode.set(f.properties.code, f),
    );
    topojson
      .feature(muniTopo, muniObj)
      .features.forEach((f) => state.muniFeatureByCode.set(f.properties.code, f));

    state.records = records;
    state.records.forEach((r) => {
      if (!r.provinceCode) return;
      if (!state.recordsByProvince.has(r.provinceCode))
        state.recordsByProvince.set(r.provinceCode, []);
      state.recordsByProvince.get(r.provinceCode).push(r);
    });

    bindControls();
    buildTypeFilters();
    buildLanguageFilters();
    buildLegend();
    initMap();
    refreshChoropleth(false);
    syncDots();
    renderMapHeading();
    renderStats();
    updateResetButton();
  }

  function showStatus(msg, isError) {
    els.statusText.textContent = msg;
    els.status.classList.toggle("error", !!isError);
    els.status.classList.remove("done");
  }
  function hideStatus() {
    if (!els.status.classList.contains("error"))
      els.status.classList.add("done");
  }

  function applyStaticI18N() {
    const s = t();
    document.title = s.pageTitle;
    document.documentElement.lang = state.language === "kr" ? "ko" : "en";
    els.brandSub.textContent = s.brandSub;
    els.labelType.textContent = s.typeLabel;
    els.labelLanguage.textContent = s.languageLabel;
    els.labelSearch.textContent = s.searchLabel;
    els.searchInput.placeholder = s.searchPlaceholder;
    els.searchInput.setAttribute("aria-label", s.searchLabel);
    els.resetViewLabel.textContent = s.backLabel;
    els.resetView.title = s.backTitle;
    els.resetView.setAttribute("aria-label", s.backLabel);
    els.typeBreakdownHeading.textContent = s.byType;
    els.mapDiv.setAttribute("aria-label", s.mapAria);
    if (!els.status.classList.contains("error") && !els.status.classList.contains("done"))
      els.statusText.textContent = s.loading;
  }

  // ---------- filter UI ----------

  function bindControls() {
    els.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      onFilterChange();
    });
    els.resetView.addEventListener("click", () => goNational());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") goNational();
    });
  }

  function paintChip(chip, ty) {
    const on = state.activeTypes.has(ty.key);
    chip.classList.toggle("active", on);
    chip.setAttribute("aria-pressed", String(on));
    chip.style.setProperty("--chip-color", typeColor(ty.key));
    chip.style.background = on ? typeColor(ty.key) : "transparent";
    chip.style.color = on ? "#fff" : "";
    chip.style.borderColor = on ? "transparent" : "";
  }

  function buildTypeFilters() {
    els.typeFilters.innerHTML = "";
    TYPES.forEach((ty) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      const dot = document.createElement("span");
      dot.className = "dot";
      const label = document.createElement("span");
      label.textContent = t().typeNames[ty.key];
      chip.append(dot, label);
      paintChip(chip, ty);
      chip.addEventListener("click", () => {
        if (state.activeTypes.has(ty.key)) state.activeTypes.delete(ty.key);
        else state.activeTypes.add(ty.key);
        paintChip(chip, ty);
        onFilterChange();
      });
      els.typeFilters.appendChild(chip);
    });
  }

  function buildLanguageFilters() {
    els.languageFilters.innerHTML = "";
    LANGUAGES.forEach((l) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(l.key === state.language));
      btn.className = l.key === state.language ? "active" : "";
      btn.textContent = l.label;
      btn.addEventListener("click", () => {
        if (state.language === l.key) return;
        state.language = l.key;
        [...els.languageFilters.children].forEach((c) => {
          c.classList.toggle("active", c === btn);
          c.setAttribute("aria-checked", String(c === btn));
        });
        onLanguageChange();
      });
      els.languageFilters.appendChild(btn);
    });
  }

  function onLanguageChange() {
    applyStaticI18N();
    buildTypeFilters();
    buildLegend();
    renderMapHeading();
    renderStats();
  }

  function buildLegend() {
    const s = t();
    els.legend.innerHTML = "";
    const seq = document.createElement("div");
    seq.innerHTML = `
      <div class="legend-title">${escapeHtml(s.legendDensity)}</div>
      <div class="legend-scale">
        <span class="muted" style="font-size:10.5px">${escapeHtml(s.legendLow)}</span>
        <span class="legend-ramp"></span>
        <span class="muted" style="font-size:10.5px">${escapeHtml(s.legendHigh)}</span>
      </div>
    `;
    els.legend.appendChild(seq);

    const typeWrap = document.createElement("div");
    typeWrap.innerHTML = `<div class="legend-title" style="margin-top:2px">${escapeHtml(s.legendType)}</div>`;
    TYPES.forEach((ty) => {
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="dot" style="background:${typeColor(ty.key)}"></span><span>${escapeHtml(s.typeNames[ty.key])}</span>`;
      typeWrap.appendChild(row);
    });
    els.legend.appendChild(typeWrap);
  }

  // Filters scope everything at once, updating the existing layers in place
  // (no map re-creation, so zoom/position are never lost).
  function onFilterChange() {
    refreshChoropleth(true);
    const sel = state.selectedRecordId
      ? state.records.find((r) => r.id === state.selectedRecordId)
      : null;
    if (sel && !passesFilter(sel)) state.selectedRecordId = null;
    syncDots();
    renderStats();
  }

  // ---------- map ----------

  // Everything provider-specific lives here, so swapping tiles later is a
  // one-place change. Note: tile.openstreetmap.org is for light use only -
  // see https://operations.osmfoundation.org/policies/tiles/ before using
  // this at scale; swap in a commercial/self-hosted provider if needed.
  const MAP_CONFIG = {
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    minZoom: 5,
    maxZoom: 18, // OSM standard layer supports up to 19; 18 keeps load modest
    boundsPadding: 0.12, // fraction of Korea's bounds allowed beyond the edge
    fitPadding: [24, 24],
    regionMaxZoom: 11,
    flyDuration: 0.9, // seconds
  };

  const REF_ZOOM = 7; // zoom at which dot-spread offsets are measured in px
  const BASE_DOT_R = 4.5;
  const SELECTED_DOT_R = 6.5;
  const FILL_OPACITY = 0.4;
  const ZERO_FILL_OPACITY = 0.14;

  let map, canvasRenderer, provinceGroup, dotGroup;
  let koreaBounds, nationalZoom;
  const provinceLayers = new Map(); // province code -> L.Polygon layer
  const dotMarkers = new Map(); // record id -> L.CircleMarker
  const dotRecords = []; // records that have a municipality

  function initMap() {
    const bbox = d3.geoBounds({
      type: "FeatureCollection",
      features: state.provinceFeatures,
    });
    koreaBounds = L.latLngBounds(
      [bbox[0][1], bbox[0][0]],
      [bbox[1][1], bbox[1][0]],
    );

    const rm = reduceMotion();
    map = L.map(els.mapDiv, {
      maxBounds: koreaBounds.pad(MAP_CONFIG.boundsPadding),
      maxBoundsViscosity: 0.9,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      zoomAnimation: !rm,
      fadeAnimation: !rm,
      markerZoomAnimation: !rm,
      attributionControl: true,
    });
    els.mapDiv.setAttribute("role", "region");
    els.mapDiv.setAttribute("aria-label", t().mapAria);

    // Tiles: no prefetching (keepBuffer default, no custom preloading).
    const tiles = L.tileLayer(MAP_CONFIG.tileUrl, {
      attribution: MAP_CONFIG.attribution,
      maxZoom: MAP_CONFIG.maxZoom,
      maxNativeZoom: MAP_CONFIG.maxZoom,
      crossOrigin: false,
    }).addTo(map);

    let tileOk = 0;
    let tileErr = 0;
    tiles.on("tileload", () => {
      tileOk++;
      els.notice.hidden = true;
    });
    tiles.on("tileerror", () => {
      tileErr++;
      if (tileOk === 0 && tileErr >= 3) {
        els.notice.textContent = t().errTiles;
        els.notice.hidden = false;
        hideStatus();
      }
    });
    tiles.once("load", hideStatus);
    setTimeout(hideStatus, 6000);

    // One shared canvas renderer for polygons and dots: SVG polygons under a
    // separate canvas layer would never receive mouse events.
    canvasRenderer = L.canvas({ padding: 0.3, tolerance: 4 });

    provinceGroup = L.geoJSON(
      { type: "FeatureCollection", features: state.provinceFeatures },
      {
        renderer: canvasRenderer,
        bubblingMouseEvents: false,
        style: () => ({ weight: 1, fillOpacity: 0 }),
        onEachFeature: (feature, layer) => {
          const code = feature.properties.code;
          provinceLayers.set(code, layer);
          layer.on({
            mouseover: () => {
              state.hoverProvinceCode = code;
              styleProvince(code);
            },
            mousemove: (e) =>
              showTooltip(e.containerPoint, provinceTooltipHTML(feature)),
            mouseout: () => {
              state.hoverProvinceCode = null;
              styleProvince(code);
              hideTooltip();
            },
            click: () => {
              if (code !== state.selectedProvinceCode) selectProvince(code);
            },
          });
        },
      },
    ).addTo(map);

    dotGroup = L.layerGroup().addTo(map);
    createDots();

    map.on("movestart", hideTooltip);
    map.on("zoomend", onZoomEnd);
    map.on("moveend", updateResetButton);
    map.on("resize", onMapResize);

    // Keep Leaflet in sync with layout changes (mobile stacking, legend...).
    if (window.ResizeObserver) {
      new ResizeObserver(() => map.invalidateSize({ animate: false })).observe(
        els.wrap,
      );
    }

    recomputeNationalZoom();
    map.fitBounds(koreaBounds, {
      padding: MAP_CONFIG.fitPadding,
      animate: false,
    });

    // follow the OS/theme setting
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", refreshTheme);
    new MutationObserver(refreshTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function recomputeNationalZoom() {
    nationalZoom = map.getBoundsZoom(koreaBounds, false, L.point(48, 48));
    // a half-level of slack below the national fit, so users can't wander
    // off the peninsula but the whole country is always reachable
    map.setMinZoom(Math.max(MAP_CONFIG.minZoom, nationalZoom - 0.5));
  }

  function onMapResize() {
    const nearNational = Math.abs(map.getZoom() - nationalZoom) < 0.3;
    recomputeNationalZoom();
    if (!state.selectedProvinceCode && nearNational) {
      map.fitBounds(koreaBounds, {
        padding: MAP_CONFIG.fitPadding,
        animate: false,
      });
    }
  }

  // Moves driven by the app (not the user) are marked so the zoom-out rule
  // below ignores the intermediate zoom levels of a fly animation.
  function markProgrammatic(seconds) {
    state.programmaticUntil = performance.now() + seconds * 1000 + 400;
  }

  function moveToBounds(bounds, extra) {
    const opts = Object.assign(
      { padding: MAP_CONFIG.fitPadding, maxZoom: MAP_CONFIG.regionMaxZoom },
      extra,
    );
    if (reduceMotion()) {
      markProgrammatic(0);
      map.fitBounds(bounds, Object.assign(opts, { animate: false }));
    } else {
      markProgrammatic(MAP_CONFIG.flyDuration);
      map.flyToBounds(bounds, Object.assign(opts, { duration: MAP_CONFIG.flyDuration }));
    }
  }

  function moveToLatLng(latlng, zoom) {
    if (reduceMotion()) {
      markProgrammatic(0);
      map.setView(latlng, zoom, { animate: false });
    } else {
      markProgrammatic(MAP_CONFIG.flyDuration);
      map.flyTo(latlng, zoom, { duration: MAP_CONFIG.flyDuration });
    }
  }

  // Zoom-out rule: if the user manually zooms out to (almost) the national
  // view while a province is selected, the selection is released - there's
  // no province "in focus" any more. Zooming in/panning never changes it.
  function onZoomEnd() {
    updateResetButton();
    if (!state.selectedProvinceCode) return;
    if (performance.now() < state.programmaticUntil) return;
    if (map.getZoom() <= state.dropZoom) clearSelection();
  }

  // ---------- choropleth ----------

  function provinceLabel(feature) {
    return isKr() ? feature.properties.name : feature.properties.name_eng;
  }

  function provinceTooltipHTML(feature) {
    const code = feature.properties.code;
    const count = (state.recordsByProvince.get(code) || []).filter(
      passesFilter,
    ).length;
    return `<div class="tt-title">${escapeHtml(provinceLabel(feature))}</div>
      <div class="tt-value tt-strong">${escapeHtml(t().tooltipCount(count))}</div>`;
  }

  function countByProvince() {
    const counts = new Map();
    state.provinceFeatures.forEach((f) => counts.set(f.properties.code, 0));
    filteredRecords().forEach((r) => {
      if (!r.provinceCode) return;
      counts.set(r.provinceCode, (counts.get(r.provinceCode) || 0) + 1);
    });
    return counts;
  }

  function fillTarget(code) {
    if (code === state.selectedProvinceCode) return 0; // fade out the fill
    const c = state.counts.get(code) || 0;
    const base = c === 0 ? ZERO_FILL_OPACITY : FILL_OPACITY;
    return code === state.hoverProvinceCode ? Math.min(0.8, base + 0.18) : base;
  }

  // Everything except the (animated) fill opacity.
  function styleProvince(code, includeFill = true) {
    const layer = provinceLayers.get(code);
    if (!layer) return;
    const selected = code === state.selectedProvinceCode;
    const hovered = code === state.hoverProvinceCode;
    const c = state.counts.get(code) || 0;
    const style = {
      color: selected ? cssVar("--text-primary") : cssVar("--text-secondary"),
      weight: selected ? 2.6 : hovered ? 2.2 : 1,
      opacity: selected ? 1 : 0.8,
      fillColor: c === 0 ? cssVar("--baseline") : state.scale(c),
    };
    if (includeFill) style.fillOpacity = fillTarget(code);
    layer.setStyle(style);
  }

  let fadeRaf = 0;
  // Recompute counts + colour scale and restyle in place; the fill opacity
  // of provinces whose target changed (selection/filter) eases over 400ms.
  function refreshChoropleth(animate) {
    state.counts = countByProvince();
    const max = d3.max(Array.from(state.counts.values())) || 1;
    state.scale = d3
      .scaleLinear()
      .domain([0, max / 2, max])
      .range([cssVar("--ramp-lo"), cssVar("--ramp-mid"), cssVar("--ramp-hi")])
      .interpolate(d3.interpolateRgb)
      .clamp(true);

    const from = new Map();
    provinceLayers.forEach((layer, code) => {
      from.set(code, layer.options.fillOpacity ?? 0);
      styleProvince(code, false);
    });

    cancelAnimationFrame(fadeRaf);
    if (!animate || reduceMotion()) {
      provinceLayers.forEach((layer, code) =>
        layer.setStyle({ fillOpacity: fillTarget(code) }),
      );
      return;
    }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 400);
      const e = d3.easeCubicOut(p);
      provinceLayers.forEach((layer, code) => {
        const a = from.get(code);
        layer.setStyle({ fillOpacity: a + (fillTarget(code) - a) * e });
      });
      if (p < 1) fadeRaf = requestAnimationFrame(step);
    };
    fadeRaf = requestAnimationFrame(step);
  }

  // ---------- dots ----------

  // Records sharing a municipality are spread on a small deterministic
  // spiral (same constants as V1). Offsets are measured in px at REF_ZOOM
  // and converted through the map's own CRS, so they scale with zoom just
  // like V1's offsets scaled with the zoom transform.
  function createDots() {
    const geoRecords = state.records.filter((r) => r.muniCode);
    const groups = new Map();
    geoRecords.forEach((r) => {
      if (!groups.has(r.muniCode)) groups.set(r.muniCode, []);
      groups.get(r.muniCode).push(r);
    });
    const centroids = new Map();
    groups.forEach((group, code) => {
      const f = state.muniFeatureByCode.get(code);
      if (!f) return;
      const [lng, lat] = d3.geoCentroid(f);
      if (Number.isNaN(lng)) return;
      centroids.set(code, L.latLng(lat, lng));
    });

    groups.forEach((group, code) => {
      const center = centroids.get(code);
      if (!center) return;
      const basePt = map.project(center, REF_ZOOM);
      group.forEach((r, i) => {
        let off = [0, 0];
        if (group.length > 1) {
          const radius = 5 + 3.2 * Math.sqrt(i);
          const angle = i * 137.508 * (Math.PI / 180);
          off = [radius * Math.cos(angle), radius * Math.sin(angle)];
        }
        const ll = map.unproject(basePt.add(off), REF_ZOOM);
        const marker = L.circleMarker(ll, {
          renderer: canvasRenderer,
          radius: BASE_DOT_R,
          bubblingMouseEvents: false,
        });
        marker.on({
          mouseover: () => {
            marker.setRadius(dotRadius(r) + 1.5);
          },
          mousemove: (e) => showTooltip(e.containerPoint, dotTooltipHTML(r)),
          mouseout: () => {
            marker.setRadius(dotRadius(r));
            hideTooltip();
          },
          click: () => selectRecord(r.id),
        });
        marker.__record = r;
        dotMarkers.set(r.id, marker);
        dotRecords.push(r);
        styleDot(r);
      });
    });
  }

  function dotRadius(r) {
    return r.id === state.selectedRecordId ? SELECTED_DOT_R : BASE_DOT_R;
  }

  function styleDot(r) {
    const marker = dotMarkers.get(r.id);
    if (!marker) return;
    const selected = r.id === state.selectedRecordId;
    marker.setStyle({
      fillColor: typeColor(r.type),
      fillOpacity: 1,
      color: selected ? cssVar("--text-primary") : "#fff",
      weight: selected ? 2.6 : 1.4,
      opacity: 1,
    });
    marker.setRadius(dotRadius(r));
    if (selected) marker.bringToFront();
  }

  // Dots follow the selected province + filters, never the viewport.
  function syncDots() {
    const sel = state.selectedProvinceCode;
    dotRecords.forEach((r) => {
      const marker = dotMarkers.get(r.id);
      const show = !!sel && r.provinceCode === sel && passesFilter(r);
      const has = dotGroup.hasLayer(marker);
      if (show && !has) dotGroup.addLayer(marker);
      else if (!show && has) dotGroup.removeLayer(marker);
      styleDot(r);
    });
  }

  function dotTooltipHTML(r) {
    const s = t();
    const rows = [
      [s.detailTitleLabel, displayName(r) || s.dash],
      [s.detailType, s.typeNames[r.type] || r.type],
      [s.detailProvince, displayProvince(r) || s.dash],
      [s.detailCity, displayMuniName(r) || r.district || s.dash],
      [s.detailNeighborhood, displayNeighborhood(r) || s.dash],
    ];
    const rowsHtml = rows
      .map(([dt, dd]) => `<dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd>`)
      .join("");
    return `<div class="tt-title">${escapeHtml(displayName(r))}</div>
      <dl class="tt-detail">${rowsHtml}</dl>`;
  }

  // ---------- selection / navigation ----------

  // Clicking a province while already drilled into another switches
  // straight to the new one (fly + restyle); nothing goes via national view.
  function selectProvince(code) {
    const feature = state.provinceByCode.get(code);
    const layer = provinceLayers.get(code);
    if (!feature || !layer) return;
    const bounds = layer.getBounds();

    state.selectedProvinceCode = code;
    state.selectedRecordId = null;
    state.hoverProvinceCode = null;
    hideTooltip();

    // Release the selection if the user later zooms back out to near the
    // national view (never above half a level below the province fit).
    const fitZoom = map.getBoundsZoom(
      bounds,
      false,
      L.point(MAP_CONFIG.fitPadding[0] * 2, MAP_CONFIG.fitPadding[1] * 2),
    );
    state.dropZoom = Math.min(nationalZoom + 0.5, fitZoom - 0.75);

    refreshChoropleth(true);
    syncDots();
    renderMapHeading();
    renderStats();
    updateResetButton();
    moveToBounds(bounds);
  }

  function clearSelection() {
    if (!state.selectedProvinceCode && !state.selectedRecordId) return;
    state.selectedProvinceCode = null;
    state.selectedRecordId = null;
    refreshChoropleth(true);
    syncDots();
    renderMapHeading();
    renderStats();
    updateResetButton();
  }

  function goNational() {
    if (!map) return;
    clearSelection();
    hideTooltip();
    moveToBounds(koreaBounds, { maxZoom: MAP_CONFIG.maxZoom });
  }

  function selectRecord(id, opts) {
    const r = state.records.find((x) => x.id === id);
    if (!r) return;
    const prev = state.selectedRecordId;
    state.selectedRecordId = id;
    if (prev && dotMarkers.has(prev)) styleDot(dotMarkers.get(prev).__record);
    styleDot(r);
    renderStats();
    const li = els.recordList.querySelector("li.selected");
    if (li) li.scrollIntoView({ block: "nearest" });
    if (opts && opts.pan) {
      const marker = dotMarkers.get(id);
      if (marker) moveToLatLng(marker.getLatLng(), Math.max(map.getZoom(), 11));
    }
  }

  function updateResetButton() {
    if (!map) return;
    const away = Math.abs(map.getZoom() - nationalZoom) > 0.3;
    els.resetView.disabled = !(state.selectedProvinceCode || away);
  }

  function refreshTheme() {
    buildTypeFilters();
    buildLegend();
    refreshChoropleth(false);
    dotRecords.forEach(styleDot);
    renderStats();
  }

  function renderMapHeading() {
    const s = t();
    if (state.selectedProvinceCode) {
      const feature = state.provinceByCode.get(state.selectedProvinceCode);
      els.mapTitle.textContent = provinceLabel(feature);
      els.mapSub.textContent = s.mapSubRegion;
    } else {
      els.mapTitle.textContent = s.mapTitleDefault;
      els.mapSub.textContent = s.mapSubDefault;
    }
  }

  // ---------- tooltip ----------

  // (x, y) are container pixels, which equal map-wrap pixels (the map fills it)
  function showTooltip(pt, html) {
    const wrapW = els.wrap.clientWidth;
    els.tooltip.innerHTML = html;
    els.tooltip.hidden = false;

    const ttRect = els.tooltip.getBoundingClientRect();
    const flipBelow = pt.y - ttRect.height - 12 < 0;
    els.tooltip.style.top = flipBelow ? `${pt.y + 12}px` : `${pt.y}px`;
    els.tooltip.style.transform = flipBelow
      ? "translate(-50%, 12px)"
      : "translate(-50%, calc(-100% - 12px))";

    const halfWidth = ttRect.width / 2;
    const clampedX = Math.min(
      Math.max(pt.x, halfWidth + 4),
      wrapW - halfWidth - 4,
    );
    els.tooltip.style.left = `${clampedX}px`;
  }
  function hideTooltip() {
    els.tooltip.hidden = true;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ---------- stats pane ----------

  function renderStats() {
    const all = filteredRecords();
    const unlocatedAll = state.records.filter((r) => !r.provinceCode);
    const unlocatedFiltered = unlocatedAll.filter(passesFilter);
    els.unlocatedNote.textContent = unlocatedFiltered.length
      ? t().unlocatedNote(unlocatedFiltered.length)
      : "";

    if (state.selectedProvinceCode) {
      renderRegionStats(all);
    } else {
      renderNationalStats(all);
    }
  }

  function typeCounts(records) {
    const map = new Map(TYPES.map((ty) => [ty.key, 0]));
    records.forEach((r) => map.set(r.type, (map.get(r.type) || 0) + 1));
    return map;
  }

  function renderTypeBreakdown(records) {
    const s = t();
    const counts = typeCounts(records);
    const max = Math.max(1, ...counts.values());
    els.typeBreakdown.innerHTML = "";
    TYPES.forEach((ty) => {
      const c = counts.get(ty.key) || 0;
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label"><span class="dot" style="background:${typeColor(ty.key)}"></span>${escapeHtml(s.typeNames[ty.key])}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(c / max) * 100}%;background:${typeColor(ty.key)}"></span></span>
        <span class="bar-count">${c}</span>
      `;
      els.typeBreakdown.appendChild(row);
    });
  }

  function statTile(value, label) {
    const div = document.createElement("div");
    div.className = "stat-tile";
    div.innerHTML = `<div class="value">${value}</div><div class="label">${label}</div>`;
    return div;
  }

  // keyboard-operable list row
  function makeRow(li, label, onActivate) {
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", label);
    li.addEventListener("click", onActivate);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    });
  }

  function renderNationalStats(records) {
    const s = t();
    els.statsTitle.textContent = s.statsAllTitle;
    const mapped = records.filter((r) => r.muniCode).length;
    const provincesRepresented = new Set(
      records.filter((r) => r.provinceCode).map((r) => r.provinceCode),
    ).size;
    els.statsSub.textContent = s.statsAllSub(records.length, mapped);

    els.statTiles.innerHTML = "";
    els.statTiles.appendChild(statTile(records.length, s.statMatching));
    els.statTiles.appendChild(statTile(mapped, s.statMapped));
    els.statTiles.appendChild(statTile(provincesRepresented, s.statProvinces));
    els.statTiles.appendChild(
      statTile(new Set(records.map((r) => r.nameEn)).size, s.statDistinct),
    );

    renderTypeBreakdown(records);

    els.detailBlock.hidden = true;
    els.listHeading.textContent = s.provincesByCount;

    const counts = countByProvince();
    const ranked = state.provinceFeatures
      .map((f) => ({ feature: f, count: counts.get(f.properties.code) || 0 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);

    els.recordList.innerHTML = "";
    ranked.forEach(({ feature, count }) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = cssVar("--accent");
      const name = document.createElement("span");
      name.className = "rl-name";
      name.textContent = provinceLabel(feature);
      const loc = document.createElement("span");
      loc.className = "rl-loc";
      loc.textContent = String(count);
      li.append(dot, name, loc);
      makeRow(li, `${s.listAria(provinceLabel(feature))} (${count})`, () =>
        selectProvince(feature.properties.code),
      );
      els.recordList.appendChild(li);
    });
  }

  function renderRegionStats(allFiltered) {
    const s = t();
    const code = state.selectedProvinceCode;
    const feature = state.provinceByCode.get(code);
    const records = allFiltered.filter((r) => r.provinceCode === code);

    els.statsTitle.textContent = provinceLabel(feature);
    const municipalities = new Set(
      records.map((r) => r.muniName).filter(Boolean),
    ).size;
    els.statsSub.textContent = s.statsRegionSub(records.length);

    els.statTiles.innerHTML = "";
    els.statTiles.appendChild(statTile(records.length, s.statMatching));
    els.statTiles.appendChild(
      statTile(records.filter((r) => r.muniCode).length, s.statMapped),
    );
    els.statTiles.appendChild(statTile(municipalities, s.statMunicipalities));
    els.statTiles.appendChild(
      statTile(new Set(records.map((r) => r.nameEn)).size, s.statDistinct),
    );

    renderTypeBreakdown(records);

    els.listHeading.textContent = s.locationsIn(provinceLabel(feature));
    els.recordList.innerHTML = "";
    records
      .slice()
      .sort((a, b) => displayName(a).localeCompare(displayName(b)))
      .forEach((r) => {
        const li = document.createElement("li");
        const isSel = r.id === state.selectedRecordId;
        li.classList.toggle("selected", isSel);
        li.setAttribute("aria-pressed", String(isSel));
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = typeColor(r.type);
        const name = document.createElement("span");
        name.className = "rl-name";
        name.textContent = displayName(r);
        const loc = document.createElement("span");
        loc.className = "rl-loc";
        loc.textContent = displayMuniName(r) || "—";
        li.append(dot, name, loc);
        makeRow(li, `${displayName(r)}, ${displayMuniName(r) || ""}`, () =>
          selectRecord(r.id, { pan: true }),
        );
        els.recordList.appendChild(li);
      });

    if (state.selectedRecordId) {
      const record = state.records.find((r) => r.id === state.selectedRecordId);
      if (record) {
        els.detailBlock.hidden = false;
        els.detailTitle.textContent = displayName(record);
        els.detailList.innerHTML = "";
        const rows = [
          [s.detailTitleLabel, displayName(record) || s.dash],
          [s.detailType, s.typeNames[record.type] || record.type],
          [s.detailProvince, displayProvince(record) || s.dash],
          [s.detailCity, displayMuniName(record) || record.district || s.dash],
          [s.detailNeighborhood, displayNeighborhood(record) || s.dash],
          [s.detailRecordId, record.id],
        ];
        rows.forEach(([dt, dd]) => {
          const dtEl = document.createElement("dt");
          dtEl.textContent = dt;
          const ddEl = document.createElement("dd");
          ddEl.textContent = dd;
          els.detailList.append(dtEl, ddEl);
        });
        return;
      }
    }
    els.detailBlock.hidden = true;
  }
})();
