(() => {
  "use strict";

  const TYPES = [
    { key: "Film", label: "Film", varName: "--type-film" },
    { key: "TV Drama", label: "TV Drama", varName: "--type-drama" },
    { key: "Studio & Theme Park", label: "Studio & Theme Park", varName: "--type-studio" },
  ];

  const LANGUAGES = [
    { key: "all", label: "All" },
    { key: "en", label: "English" },
    { key: "kr", label: "한국어" },
  ];

  const state = {
    records: [],
    provinceFeatures: [],
    muniFeatureByCode: new Map(),
    provinceByCode: new Map(),
    recordsByProvince: new Map(),
    activeTypes: new Set(TYPES.map((t) => t.key)),
    language: "all",
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
      .getPropertyValue(TYPES.find((t) => t.key === key)?.varName || "--type-film")
      .trim();
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---------- language-aware display ----------

  // The English and Korean source files describe the exact same 286
  // locations (identical ids, identical geo fields) - they're two labelings
  // of one dataset, not two different sets of places. The language filter
  // therefore controls which title/location text is shown and searched,
  // rather than hiding any dots.

  function displayName(r) {
    if (state.language === "en") return r.nameEn || r.nameKr || "";
    if (state.language === "kr") return r.nameKr || r.nameEn || "";
    return [r.nameEn, r.nameKr].filter(Boolean).join(" · ");
  }

  function displayMuniName(r) {
    if (state.language === "kr") return r.muniNameKr || r.muniName || null;
    if (state.language === "en") return r.muniName || r.muniNameKr || null;
    return r.muniName || r.muniNameKr || null;
  }

  function displayNeighborhood(r) {
    if (state.language === "kr") return r.neighborhoodKr || r.neighborhood || null;
    return r.neighborhood || r.neighborhoodKr || null;
  }

  function searchableText(r) {
    if (state.language === "en") return [r.nameEn].filter(Boolean);
    if (state.language === "kr") return [r.nameKr, r.searchKr].filter(Boolean);
    return [r.nameEn, r.nameKr, r.searchKr].filter(Boolean);
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

  Promise.all([
    d3.json("geo/provinces-topo.json"),
    d3.json("geo/municipalities-topo.json"),
    d3.json("data/records.json"),
  ]).then(([provinceTopo, muniTopo, records]) => {
    const provinceObj = provinceTopo.objects.skorea_provinces_2018_geo;
    const muniObj = muniTopo.objects.skorea_municipalities_2018_geo;

    state.provinceFeatures = topojson.feature(provinceTopo, provinceObj).features;
    state.provinceFeatures.forEach((f) => state.provinceByCode.set(f.properties.code, f));

    const muniFeatures = topojson.feature(muniTopo, muniObj).features;
    muniFeatures.forEach((f) => state.muniFeatureByCode.set(f.properties.code, f));

    state.records = records;
    state.records.forEach((r) => {
      if (!r.provinceCode) return;
      if (!state.recordsByProvince.has(r.provinceCode)) state.recordsByProvince.set(r.provinceCode, []);
      state.recordsByProvince.get(r.provinceCode).push(r);
    });

    buildTypeFilters();
    buildLanguageFilters();
    buildLegend();
    initMap();
    renderStats();

    window.addEventListener("resize", debounce(() => {
      initMap(true);
    }, 200));
  });

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
    TYPES.forEach((t) => {
      const chip = document.createElement("button");
      chip.className = "chip active";
      chip.type = "button";
      chip.style.setProperty("--chip-color", cssVar(t.varName));
      chip.style.background = cssVar(t.varName);
      chip.style.color = "#fff";
      chip.style.borderColor = "transparent";
      const dot = document.createElement("span");
      dot.className = "dot";
      const label = document.createElement("span");
      label.textContent = t.label;
      chip.append(dot, label);
      chip.addEventListener("click", () => {
        if (state.activeTypes.has(t.key)) {
          state.activeTypes.delete(t.key);
          chip.classList.remove("active");
          chip.style.background = "transparent";
          chip.style.color = "";
          chip.style.borderColor = "";
        } else {
          state.activeTypes.add(t.key);
          chip.classList.add("active");
          chip.style.background = cssVar(t.varName);
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
    onFilterChange();
    renderMapHeading();
  }

  function buildLegend() {
    els.legend.innerHTML = "";
    const seq = document.createElement("div");
    seq.innerHTML = `
      <div class="legend-title">Location density</div>
      <div class="legend-scale">
        <span class="muted" style="font-size:10.5px">Low</span>
        <span class="legend-ramp"></span>
        <span class="muted" style="font-size:10.5px">High</span>
      </div>
    `;
    els.legend.appendChild(seq);

    const typeWrap = document.createElement("div");
    typeWrap.innerHTML = `<div class="legend-title" style="margin-top:2px">Type</div>`;
    TYPES.forEach((t) => {
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `<span class="dot" style="background:${cssVar(t.varName)}"></span><span>${t.label}</span>`;
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

  let viewport, provinceLayer, dotLayer;

  function initMap(preserveSelection) {
    const rect = els.wrap.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    els.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    els.svg.innerHTML = "";

    state.projection = d3.geoMercator().fitExtent(
      [[16, 16], [width - 16, height - 16]],
      { type: "FeatureCollection", features: state.provinceFeatures }
    );
    state.path = d3.geoPath(state.projection);

    const svg = d3.select(els.svg);
    viewport = svg.append("g").attr("class", "viewport");
    provinceLayer = viewport.append("g").attr("class", "province-layer");
    dotLayer = viewport.append("g").attr("class", "dot-layer");

    drawProvinces();
    drawDots();
    updateChoropleth();
    updateDotsVisibility();

    if (preserveSelection && state.selectedProvinceCode) {
      zoomToProvince(state.selectedProvinceCode, true);
    } else {
      applyZoomTransform(d3.zoomIdentity, true);
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
        zoomToProvince(d.properties.code);
      });
  }

  function provinceLabel(feature) {
    if (state.language === "kr") return feature.properties.name;
    if (state.language === "en") return feature.properties.name_eng;
    return `${feature.properties.name_eng} · ${feature.properties.name}`;
  }

  function provinceTooltipHTML(feature) {
    const code = feature.properties.code;
    const count = (state.recordsByProvince.get(code) || []).filter(passesFilter).length;
    return `<div class="tt-title">${escapeHtml(provinceLabel(feature))}</div>
      <div class="tt-value"><span class="tt-strong">${count}</span> filming location${count === 1 ? "" : "s"}</div>`;
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
    const scale = d3.scaleLinear().domain([0, max]).range([cssVar("--seq-100"), cssVar("--seq-700")]).interpolate(d3.interpolateRgb);

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
          offsets.set(r.id, [radius * Math.cos(angle), radius * Math.sin(angle)]);
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
    const loc = [displayMuniName(r), displayNeighborhood(r)].filter(Boolean).join(", ");
    return `<div class="tt-title">${escapeHtml(displayName(r))}</div>
      <div class="tt-value">${escapeHtml(r.type)} · <span class="tt-strong">${escapeHtml(loc)}</span></div>`;
  }

  function updateDotsVisibility() {
    dotLayer.selectAll("g.dot-mark").style("display", (d) => {
      // dots only appear once a region is selected, so they never sit on
      // top of the national choropleth and steal its clicks/hover
      if (!state.selectedProvinceCode) return "none";
      if (d.provinceCode !== state.selectedProvinceCode) return "none";
      return passesFilter(d) ? null : "none";
    });
    rescaleDots();
  }

  function rescaleDots() {
    dotLayer.selectAll("g.dot-mark circle.core").attr("r", (d) => {
      const base = d.id === state.selectedRecordId ? SELECTED_DOT_R : BASE_DOT_R;
      return base / state.k;
    });
    dotLayer.selectAll("g.dot-mark circle.core").attr("stroke-width", 1.4 / state.k);
    dotLayer.selectAll("g.dot-mark").classed("selected", (d) => d.id === state.selectedRecordId);
  }

  // ---------- zoom / regions ----------

  function applyZoomTransform(transform, immediate) {
    state.k = transform.k;
    const sel = immediate ? viewport : viewport.transition().duration(650).ease(d3.easeCubicInOut);
    sel.attr("transform", transform);
    provinceLayer.selectAll("path.province-path").attr("stroke-width", 1.1 / state.k);
    rescaleDots();
    // keep visual stroke width correct through the transition too
    if (!immediate) {
      sel.on("start", tickStroke).on("end", tickStroke);
      const start = performance.now();
      const raf = () => {
        if (performance.now() - start > 700) return;
        rescaleDots();
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    function tickStroke() {
      provinceLayer.selectAll("path.province-path").attr("stroke-width", 1.1 / state.k);
    }
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

    provinceLayer.selectAll("path.province-path")
      .classed("dimmed", (d) => d.properties.code !== code)
      .classed("active-region", (d) => d.properties.code === code);

    applyZoomTransform(transform, immediate);
    updateDotsVisibility();
    renderMapHeading();
    renderStats();
    els.resetView.disabled = false;
  }

  function goNational() {
    if (!state.selectedProvinceCode) return;
    state.selectedProvinceCode = null;
    state.selectedRecordId = null;
    provinceLayer.selectAll("path.province-path").classed("dimmed", false).classed("active-region", false);
    applyZoomTransform(d3.zoomIdentity, false);
    updateDotsVisibility();
    renderMapHeading();
    renderStats();
    els.resetView.disabled = true;
  }

  function renderMapHeading() {
    if (state.selectedProvinceCode) {
      const feature = state.provinceByCode.get(state.selectedProvinceCode);
      els.mapTitle.textContent = provinceLabel(feature);
      els.mapSub.textContent = "Hover a dot to preview, click to see full details on the right. Press Esc or use National view to zoom back out.";
    } else {
      els.mapTitle.textContent = "South Korea — filming location density";
      els.mapSub.textContent = "Hover a province to preview, click to zoom in and see individual locations.";
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
    els.tooltip.style.left = `${event.clientX - wrapRect.left}px`;
    els.tooltip.style.top = `${event.clientY - wrapRect.top}px`;
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
      ? `${unlocatedFiltered.length} matching records have no recorded location and are not shown on the map.`
      : "";

    if (state.selectedProvinceCode) {
      renderRegionStats(all);
    } else {
      renderNationalStats(all);
    }
  }

  function typeCounts(records) {
    const map = new Map(TYPES.map((t) => [t.key, 0]));
    records.forEach((r) => map.set(r.type, (map.get(r.type) || 0) + 1));
    return map;
  }

  function renderTypeBreakdown(records) {
    const counts = typeCounts(records);
    const max = Math.max(1, ...counts.values());
    els.typeBreakdown.innerHTML = "";
    TYPES.forEach((t) => {
      const c = counts.get(t.key) || 0;
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <span class="bar-label"><span class="dot" style="background:${cssVar(t.varName)}"></span>${t.label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(c / max) * 100}%;background:${cssVar(t.varName)}"></span></span>
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
    els.statsTitle.textContent = "All of South Korea";
    const mapped = records.filter((r) => r.muniCode).length;
    const provincesRepresented = new Set(records.filter((r) => r.provinceCode).map((r) => r.provinceCode)).size;
    els.statsSub.textContent = `${records.length} matching record${records.length === 1 ? "" : "s"} · ${mapped} mapped`;

    els.statTiles.innerHTML = "";
    els.statTiles.appendChild(statTile(records.length, "Matching records"));
    els.statTiles.appendChild(statTile(mapped, "Mapped locations"));
    els.statTiles.appendChild(statTile(provincesRepresented, "Provinces"));
    els.statTiles.appendChild(statTile(new Set(records.map((r) => r.nameEn)).size, "Distinct titles"));

    renderTypeBreakdown(records);

    els.detailBlock.hidden = true;
    els.listHeading.textContent = "Provinces by count";

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
      li.addEventListener("click", () => zoomToProvince(feature.properties.code));
      els.recordList.appendChild(li);
    });
  }

  function renderRegionStats(allFiltered) {
    const code = state.selectedProvinceCode;
    const feature = state.provinceByCode.get(code);
    const records = allFiltered.filter((r) => r.provinceCode === code);

    els.statsTitle.textContent = provinceLabel(feature);
    const municipalities = new Set(records.map((r) => r.muniName).filter(Boolean)).size;
    els.statsSub.textContent = `${records.length} matching record${records.length === 1 ? "" : "s"} in this province`;

    els.statTiles.innerHTML = "";
    els.statTiles.appendChild(statTile(records.length, "Matching records"));
    els.statTiles.appendChild(statTile(records.filter((r) => r.muniCode).length, "Mapped locations"));
    els.statTiles.appendChild(statTile(municipalities, "Municipalities"));
    els.statTiles.appendChild(statTile(new Set(records.map((r) => r.nameEn)).size, "Distinct titles"));

    renderTypeBreakdown(records);

    els.listHeading.textContent = `Locations in ${provinceLabel(feature)}`;
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
          ["English title", record.nameEn || "—"],
          ["Korean title", record.nameKr || "—"],
          ["Type", record.type],
          ["Province", state.language === "kr" ? record.provinceKr || record.province || "—" : record.province || record.provinceKr || "—"],
          ["City/County", displayMuniName(record) || record.district || "—"],
          ["Neighborhood", displayNeighborhood(record) || "—"],
          ["Record ID", record.id],
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
