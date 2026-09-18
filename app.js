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
        "Hover a province to preview. Scroll to zoom and drag to pan - zoom in close enough and individual locations appear, or click a region to jump straight to it.",
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
        "지역에 마우스를 올려 미리보세요. 스크롤로 확대·축소, 드래그로 이동할 수 있고 충분히 확대하면 개별 촬영지가 나타납니다. 지역을 클릭하면 바로 이동합니다.",
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
    selectedProvinceCode: null,
    selectedRecordId: null,
    projection: null,
    path: null,
    k: 1,
  };

  const els = {
    svg: document.getElementById("map-svg"),
    wrap: document.getElementById("map-wrap"),
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

  function typeColor(key) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(
        TYPES.find((t) => t.key === key)?.varName || "--type-film",
      )
      .trim();
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

  Promise.all([
    d3.json("geo/provinces-topo.json"),
    d3.json("geo/municipalities-topo.json"),
    d3.json("data/records.json"),
  ]).then(([provinceTopo, muniTopo, records]) => {
    const provinceObj = provinceTopo.objects.skorea_provinces_2018_geo;
    const muniObj = muniTopo.objects.skorea_municipalities_2018_geo;

    state.provinceFeatures = topojson.feature(
      provinceTopo,
      provinceObj,
    ).features;
    state.provinceFeatures.forEach((f) =>
      state.provinceByCode.set(f.properties.code, f),
    );

    const muniFeatures = topojson.feature(muniTopo, muniObj).features;
    muniFeatures.forEach((f) =>
      state.muniFeatureByCode.set(f.properties.code, f),
    );

    state.records = records;
    state.records.forEach((r) => {
      if (!r.provinceCode) return;
      if (!state.recordsByProvince.has(r.provinceCode))
        state.recordsByProvince.set(r.provinceCode, []);
      state.recordsByProvince.get(r.provinceCode).push(r);
    });

    buildTypeFilters();
    buildLanguageFilters();
    buildLegend();
    initMap();
    renderMapHeading();
    renderStats();

    window.addEventListener(
      "resize",
      debounce(() => {
        initMap(true);
      }, 200),
    );
  });

  function applyStaticI18N() {
    const s = t();
    document.title = s.pageTitle;
    document.documentElement.lang = state.language === "kr" ? "ko" : "en";
    els.brandSub.textContent = s.brandSub;
    els.labelType.textContent = s.typeLabel;
    els.labelLanguage.textContent = s.languageLabel;
    els.labelSearch.textContent = s.searchLabel;
    els.searchInput.placeholder = s.searchPlaceholder;
    els.resetViewLabel.textContent = s.backLabel;
    els.resetView.title = s.backTitle;
    els.typeBreakdownHeading.textContent = s.byType;
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ---------- filter UI ----------

  function buildTypeFilters() {
    els.typeFilters.innerHTML = "";
    TYPES.forEach((ty) => {
      const chip = document.createElement("button");
      chip.className = "chip active";
      chip.type = "button";
      chip.style.setProperty("--chip-color", cssVar(ty.varName));
      chip.style.background = cssVar(ty.varName);
      chip.style.color = "#fff";
      chip.style.borderColor = "transparent";
      const dot = document.createElement("span");
      dot.className = "dot";
      const label = document.createElement("span");
      label.textContent = t().typeNames[ty.key];
      chip.append(dot, label);
      chip.addEventListener("click", () => {
        if (state.activeTypes.has(ty.key)) {
          state.activeTypes.delete(ty.key);
          chip.classList.remove("active");
          chip.style.background = "transparent";
          chip.style.color = "";
          chip.style.borderColor = "";
        } else {
          state.activeTypes.add(ty.key);
          chip.classList.add("active");
          chip.style.background = cssVar(ty.varName);
          chip.style.color = "#fff";
          chip.style.borderColor = "transparent";
        }
        onFilterChange();
      });
      els.typeFilters.appendChild(chip);
    });

    els.searchInput.addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      onFilterChange();
    });

    els.resetView.addEventListener("click", () => goNational());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") goNational();
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
    onFilterChange();
    renderMapHeading();
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
      row.innerHTML = `<span class="dot" style="background:${cssVar(ty.varName)}"></span><span>${escapeHtml(s.typeNames[ty.key])}</span>`;
      typeWrap.appendChild(row);
    });
    els.legend.appendChild(typeWrap);
  }

  function onFilterChange() {
    updateChoropleth();
    updateDotsVisibility();
    renderStats();
  }

  // ---------- map ----------

  let viewport, provinceLayer, dotLayer, zoomBehavior;

  function initMap(preserveSelection) {
    const rect = els.wrap.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    els.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    els.svg.innerHTML = "";

    state.projection = d3.geoMercator().fitExtent(
      [
        [16, 16],
        [width - 16, height - 16],
      ],
      { type: "FeatureCollection", features: state.provinceFeatures },
    );
    state.path = d3.geoPath(state.projection);

    const svg = d3.select(els.svg);
    viewport = svg.append("g").attr("class", "viewport");
    provinceLayer = viewport.append("g").attr("class", "province-layer");
    dotLayer = viewport.append("g").attr("class", "dot-layer");

    // Free navigation: wheel zooms, drag pans. Programmatic "zoom to
    // region" reuses the same behavior (via .transform on a transition)
    // so a single "zoom" handler drives both interactive and animated moves.
    zoomBehavior = d3
      .zoom()
      .scaleExtent([1, 12])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("start", hideTooltip)
      .on("zoom", (event) => {
        applyZoomTransform(event.transform);
        // only an actual user-driven wheel/drag should be able to drop
        // focus this way - a programmatic click-to-zoom transition also
        // passes through k=1 at its very first tick (it animates FROM the
        // old transform) and must never self-cancel because of that.
        if (
          event.sourceEvent &&
          state.selectedProvinceCode &&
          event.transform.k <= 1.001
        ) {
          clearFocusState();
          updateDotsVisibility();
        }
      });

    svg.call(zoomBehavior).on("dblclick.zoom", null);

    // Clicking the empty background (not a province/dot) while a region is
    // focused exits back to free pan/zoom mode.
    svg.on("click", (event) => {
      if (event.target === els.svg && state.selectedProvinceCode) {
        goNational();
      }
    });

    drawProvinces();
    drawDots();
    updateChoropleth();
    updateDotsVisibility();

    if (preserveSelection && state.selectedProvinceCode) {
      zoomToProvince(state.selectedProvinceCode, true);
    } else {
      svg.call(zoomBehavior.transform, d3.zoomIdentity);
    }
  }

  function drawProvinces() {
    provinceLayer
      .selectAll("path.province-path")
      .data(state.provinceFeatures, (d) => d.properties.code)
      .join("path")
      .attr("class", "province-path")
      .attr("d", state.path)
      .attr("vector-effect", "non-scaling-stroke")
      .on("mousemove", (event, d) => {
        if (state.selectedProvinceCode) return;
        showTooltip(event, provinceTooltipHTML(d));
      })
      .on("mouseleave", hideTooltip)
      .on("click", (event, d) => {
        // A focused region fills most of the viewport, so "outside" it in
        // practice means a click that lands on a different (dimmed)
        // province - that exits back to free pan/zoom mode. Clicking the
        // focused region itself is a no-op; clicking any province while
        // unfocused zooms into it, same as before.
        if (state.selectedProvinceCode) {
          if (d.properties.code !== state.selectedProvinceCode) {
            goNational();
          }
          return;
        }
        zoomToProvince(d.properties.code);
      });
  }

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

  function updateChoropleth() {
    const counts = countByProvince();
    const max = d3.max(Array.from(counts.values())) || 1;
    const scale = d3
      .scaleLinear()
      .domain([0, max])
      .range([cssVar("--seq-100"), cssVar("--seq-700")])
      .interpolate(d3.interpolateRgb);

    provinceLayer.selectAll("path.province-path").attr("fill", (d) => {
      const c = counts.get(d.properties.code) || 0;
      return c === 0 ? cssVar("--gridline") : scale(c);
    });
  }

  // ---------- dots ----------

  function dotBasePosition(record) {
    const feature = state.muniFeatureByCode.get(record.muniCode);
    if (!feature) return null;
    const centroid = state.path.centroid(feature);
    if (!centroid || Number.isNaN(centroid[0])) return null;
    return centroid;
  }

  function groupJitter(records) {
    // group records sharing the same municipality centroid and spread them
    // in a small deterministic spiral so overlapping points stay legible.
    const groups = new Map();
    records.forEach((r) => {
      const key = r.muniCode;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    const offsets = new Map();
    groups.forEach((group) => {
      group.forEach((r, i) => {
        if (group.length === 1) {
          offsets.set(r.id, [0, 0]);
        } else {
          const radius = 5 + 3.2 * Math.sqrt(i);
          const angle = i * 137.508 * (Math.PI / 180);
          offsets.set(r.id, [
            radius * Math.cos(angle),
            radius * Math.sin(angle),
          ]);
        }
      });
    });
    return offsets;
  }

  const BASE_DOT_R = 4.5;
  const SELECTED_DOT_R = 6.5;

  function drawDots() {
    const geoRecords = state.records.filter((r) => r.muniCode);
    const offsets = groupJitter(geoRecords);

    const groups = dotLayer
      .selectAll("g.dot-mark")
      .data(geoRecords, (d) => d.id)
      .join("g")
      .attr("class", "dot-mark")
      .attr("tabindex", 0)
      .attr("transform", (d) => {
        const pos = dotBasePosition(d);
        if (!pos) return "translate(-9999,-9999)";
        const off = offsets.get(d.id) || [0, 0];
        d.__x = pos[0] + off[0];
        d.__y = pos[1] + off[1];
        return `translate(${d.__x},${d.__y})`;
      });

    groups.each(function (d) {
      const g = d3.select(this);
      g.selectAll("*").remove();
      g.append("circle")
        .attr("class", "core")
        .attr("r", BASE_DOT_R)
        .attr("fill", typeColor(d.type));
    });

    groups
      .on("mousemove", (event, d) => {
        showTooltip(event, dotTooltipHTML(d));
        d3.select(event.currentTarget).classed("focused", true);
      })
      .on("mouseleave", (event) => {
        hideTooltip();
        d3.select(event.currentTarget).classed("focused", false);
      })
      .on("focus", (event, d) => showTooltip(event, dotTooltipHTML(d)))
      .on("blur", hideTooltip)
      .on("click", (event, d) => {
        event.stopPropagation();
        selectRecord(d.id);
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

  // Free-zoom threshold: scroll in this close (without ever clicking a
  // region) and individual points reveal themselves anyway; zoom back out
  // past it and they disappear, leaving just the whole-map choropleth.
  const DOT_REVEAL_K = 2.5;

  function updateDotsVisibility() {
    const freeReveal = !state.selectedProvinceCode && state.k >= DOT_REVEAL_K;
    dotLayer.selectAll("g.dot-mark").style("display", (d) => {
      if (state.selectedProvinceCode) {
        // focused on one region: only that region's dots, regardless of k
        if (d.provinceCode !== state.selectedProvinceCode) return "none";
        return passesFilter(d) ? null : "none";
      }
      if (!freeReveal) return "none";
      return passesFilter(d) ? null : "none";
    });
    rescaleDots();
  }

  function rescaleDots() {
    dotLayer.selectAll("g.dot-mark circle.core").attr("r", (d) => {
      const base =
        d.id === state.selectedRecordId ? SELECTED_DOT_R : BASE_DOT_R;
      return base / state.k;
    });
    dotLayer
      .selectAll("g.dot-mark circle.core")
      .attr("stroke-width", 1.4 / state.k);
    dotLayer
      .selectAll("g.dot-mark")
      .classed("selected", (d) => d.id === state.selectedRecordId);
  }

  // ---------- zoom / regions ----------

  // Single source of truth for the viewport transform - fed both by
  // interactive wheel/drag input and by programmatic "snap to region" moves
  // (see zoomToProvince/goNational), so free navigation and click-to-zoom
  // share one consistent, always-in-sync zoom state.
  function applyZoomTransform(transform) {
    state.k = transform.k;
    viewport.attr("transform", transform);
    provinceLayer
      .selectAll("path.province-path")
      .attr("stroke-width", 1.1 / state.k);
    updateDotsVisibility();
  }

  function clearFocusState() {
    state.selectedProvinceCode = null;
    state.selectedRecordId = null;
    provinceLayer
      .selectAll("path.province-path")
      .classed("dimmed", false)
      .classed("active-region", false);
    renderMapHeading();
    renderStats();
    els.resetView.disabled = true;
  }

  function zoomToProvince(code, immediate) {
    const feature = state.provinceByCode.get(code);
    if (!feature) return;
    const rect = els.wrap.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const [[x0, y0], [x1, y1]] = state.path.bounds(feature);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const padding = 0.82;
    const k = Math.min(8, padding * Math.min(width / dx, height / dy));
    const tx = width / 2 - k * cx;
    const ty = height / 2 - k * cy;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(k);

    state.selectedProvinceCode = code;
    state.selectedRecordId = null;

    provinceLayer
      .selectAll("path.province-path")
      .classed("dimmed", (d) => d.properties.code !== code)
      .classed("active-region", (d) => d.properties.code === code);

    const svg = d3.select(els.svg);
    if (immediate) {
      svg.call(zoomBehavior.transform, transform);
    } else {
      svg
        .transition()
        .duration(650)
        .ease(d3.easeCubicInOut)
        .call(zoomBehavior.transform, transform);
    }
    updateDotsVisibility();
    renderMapHeading();
    renderStats();
    els.resetView.disabled = false;
  }

  function goNational() {
    if (!state.selectedProvinceCode) return;
    clearFocusState();
    d3.select(els.svg)
      .transition()
      .duration(650)
      .ease(d3.easeCubicInOut)
      .call(zoomBehavior.transform, d3.zoomIdentity);
    updateDotsVisibility();
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

  function selectRecord(id) {
    state.selectedRecordId = id;
    rescaleDots();
    renderStats();
  }

  // ---------- tooltip ----------

  function showTooltip(event, html) {
    const wrapRect = els.wrap.getBoundingClientRect();
    els.tooltip.innerHTML = html;
    els.tooltip.hidden = false;

    const x = event.clientX - wrapRect.left;
    const y = event.clientY - wrapRect.top;
    const ttRect = els.tooltip.getBoundingClientRect();

    // keep the tooltip within the map pane: flip below the cursor if there
    // isn't room above it, and clamp sideways so it never clips off-screen
    const flipBelow = y - ttRect.height - 12 < 0;
    els.tooltip.style.top = flipBelow ? `${y + 12}px` : `${y}px`;
    els.tooltip.style.transform = flipBelow
      ? "translate(-50%, 12px)"
      : "translate(-50%, calc(-100% - 12px))";

    const halfWidth = ttRect.width / 2;
    const clampedX = Math.min(Math.max(x, halfWidth + 4), wrapRect.width - halfWidth - 4);
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
        <span class="bar-label"><span class="dot" style="background:${cssVar(ty.varName)}"></span>${escapeHtml(s.typeNames[ty.key])}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(c / max) * 100}%;background:${cssVar(ty.varName)}"></span></span>
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
      li.addEventListener("click", () =>
        zoomToProvince(feature.properties.code),
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
        li.classList.toggle("selected", r.id === state.selectedRecordId);
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
        li.addEventListener("click", () => selectRecord(r.id));
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
