// Stair Platform Designer (v1)
// Business logic and rendering are separated into helpers to simplify future extension.

const stairTypes = [
  { id: "straight", label: "Straight staircase" },
  { id: "l", label: "L-shaped staircase" },
  { id: "l_landing", label: "L-shaped with landing" },
  { id: "u", label: "U-shaped staircase" },
  { id: "return_landing", label: "Stair with landing / return" },
  { id: "custom", label: "Custom / irregular" },
];

const state = {
  mode: "quick",
  stair: {
    type: "straight",
    stepRise: 190,
    treadDepth: 250,
    stairWidth: 950,
    stepCount: 12,
    stairwellWidth: 1200,
    landingDepth: 1000,
    landingWidth: 1000,
    wallOffsetLeft: 20,
    wallOffsetRight: 20,
    narrowWidth: 0,
    handrailClearance: 60,
    turnDirection: "left",
  },
  modules: [createDefaultModule(1)],
  legStrategy: "auto-step",
  manualHeights: "",
  typicalLegsInUse: 4,
};

function createDefaultModule(id) {
  return {
    id,
    name: `M${id}`,
    width: 600,
    length: 900,
    thickness: 18,
    frameW: 48,
    frameH: 73,
    legW: 48,
    legH: 73,
    pocketPattern: "3x3",
    pocketStrategy: "frame-integrated",
    qty: 1,
    placement: { x: 80 * id, y: 60, rotation: 0, shown: true },
  };
}

function init() {
  renderStairCards();
  bindStaticInputs();
  renderModules();
  updateAll();
}

function renderStairCards() {
  const root = document.getElementById("stairTypeCards");
  root.innerHTML = "";
  stairTypes.forEach((type) => {
    const label = document.createElement("label");
    label.className = "option-card";
    label.innerHTML = `<input type="radio" name="stairType" value="${type.id}" ${state.stair.type === type.id ? "checked" : ""}/><span><strong>${type.label}</strong></span>`;
    root.appendChild(label);
  });
  root.addEventListener("change", (e) => {
    if (e.target.name === "stairType") {
      state.stair.type = e.target.value;
      updateAll();
    }
  });
}

function bindStaticInputs() {
  bindNum("stepRise", "stepRise");
  bindNum("treadDepth", "treadDepth");
  bindNum("stairWidth", "stairWidth");
  bindNum("stepCount", "stepCount");
  bindNum("stairwellWidth", "stairwellWidth");
  bindNum("landingDepth", "landingDepth");
  bindNum("landingWidth", "landingWidth");
  bindNum("wallOffsetLeft", "wallOffsetLeft");
  bindNum("wallOffsetRight", "wallOffsetRight");
  bindNum("narrowWidth", "narrowWidth");
  bindNum("handrailClearance", "handrailClearance");

  document.querySelectorAll("input[name=mode]").forEach((el) => {
    el.addEventListener("change", () => {
      state.mode = el.value;
      updateAll();
    });
  });
  bindSelect("turnDirection", "turnDirection");

  bindSelect("legStrategy", null, (v) => {
    state.legStrategy = v;
    updateAll();
  });
  bindNum("typicalLegsInUse", null, (v) => {
    state.typicalLegsInUse = Math.max(3, Math.min(8, v));
    updateAll();
  });
  const manual = document.getElementById("manualHeights");
  manual.value = state.manualHeights;
  manual.addEventListener("input", () => {
    state.manualHeights = manual.value;
    updateAll();
  });

  document.getElementById("addModuleBtn").addEventListener("click", () => {
    state.modules.push(createDefaultModule(state.modules.length + 1));
    renderModules();
    updateAll();
  });

  Object.entries(state.stair).forEach(([k, v]) => {
    const el = document.getElementById(k);
    if (el) el.value = v;
  });
  document.getElementById("typicalLegsInUse").value = state.typicalLegsInUse;
}

function bindNum(id, key, callback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const v = Number(el.value || 0);
    if (callback) callback(v);
    else state.stair[key] = v;
    updateAll();
  });
}

function bindSelect(id, key, callback) {
  const el = document.getElementById(id);
  el.addEventListener("change", () => {
    if (callback) callback(el.value);
    else state.stair[key] = el.value;
    updateAll();
  });
}

function renderModules() {
  const root = document.getElementById("modulesContainer");
  root.innerHTML = "";
  state.modules.forEach((m) => {
    const div = document.createElement("div");
    div.className = "module-card";
    div.innerHTML = `
      <h4>${m.name}</h4>
      <div class="inline-grid three">
        <label>Width (mm)<input type="number" data-key="width" data-id="${m.id}" value="${m.width}" /></label>
        <label>Length (mm)<input type="number" data-key="length" data-id="${m.id}" value="${m.length}" /></label>
        <label>Qty<input type="number" data-key="qty" data-id="${m.id}" value="${m.qty}" min="1" /></label>
        <label>Top thickness (mm)<input type="number" data-key="thickness" data-id="${m.id}" value="${m.thickness}" /></label>
        <label>Pocket pattern
          <select data-key="pocketPattern" data-id="${m.id}">
            ${["3x3", "3x4", "4x4", "custom"].map((p) => `<option ${m.pocketPattern === p ? "selected" : ""} value="${p}">${p}</option>`).join("")}
          </select>
        </label>
        <label>Pocket strategy
          <select data-key="pocketStrategy" data-id="${m.id}">
            ${["regular-grid", "flexible-local", "frame-integrated"].map((p) => `<option ${m.pocketStrategy === p ? "selected" : ""} value="${p}">${p}</option>`).join("")}
          </select>
        </label>
        <label>Place X<input type="number" data-key="x" data-id="${m.id}" value="${m.placement.x}" /></label>
        <label>Place Y<input type="number" data-key="y" data-id="${m.id}" value="${m.placement.y}" /></label>
        <label>Rotation (deg)<input type="number" data-key="rotation" data-id="${m.id}" value="${m.placement.rotation}" /></label>
      </div>
      <label><input type="checkbox" data-key="shown" data-id="${m.id}" ${m.placement.shown ? "checked" : ""}/> Show in stair plan</label>
    `;
    root.appendChild(div);
  });

  root.querySelectorAll("input,select").forEach((el) => {
    el.addEventListener("input", moduleInputHandler);
    el.addEventListener("change", moduleInputHandler);
  });
}

function moduleInputHandler(e) {
  const id = Number(e.target.dataset.id);
  const key = e.target.dataset.key;
  const m = state.modules.find((x) => x.id === id);
  if (!m) return;
  if (["x", "y", "rotation", "shown"].includes(key)) {
    if (key === "shown") m.placement.shown = e.target.checked;
    else m.placement[key] = Number(e.target.value || 0);
  } else if (["pocketPattern", "pocketStrategy"].includes(key)) {
    m[key] = e.target.value;
  } else {
    m[key] = Number(e.target.value || 0);
  }
  updateAll();
}

function updateAll() {
  const confidence = evaluateConfidence();
  renderConfidence(confidence);
  const design = calculateDesign();
  renderLegSummary(design);
  renderPlatformSummary(design);
  renderBOM(design);
  renderCutList(design);
  renderNotes(design, confidence);
  renderStairPlan(design);
  renderModuleTop(design.modules[0]);
  renderModuleUnder(design.modules[0]);
  renderLegSide(design.legHeights);
}

function evaluateConfidence() {
  let score = 0;
  const s = state.stair;
  if (s.type) score += 1;
  if (s.stepRise > 0) score += 1;
  if (s.treadDepth > 0) score += 1;
  if (s.stairWidth > 0) score += 1;
  if (s.stepCount > 0) score += 1;
  if (s.landingDepth > 0 || s.landingWidth > 0) score += 1;
  if (state.modules.some((m) => m.placement.shown)) score += 1;
  if (state.legStrategy !== "auto-step" || state.manualHeights.trim()) score += 1;
  if (state.modules.length > 1) score += 1;

  const level = score <= 4 ? "Works" : score <= 7 ? "Good enough" : "Very well designed";
  const missing = [];
  if (!s.treadDepth) missing.push("Add tread depth for better fit checks");
  if (!s.stairwellWidth) missing.push("Add stairwell width for turning constraints");
  if (!s.landingDepth) missing.push("Add landing depth where applicable");
  if (!state.manualHeights && state.legStrategy === "auto-step") missing.push("Review and tune leg heights");
  if (!state.modules.some((m) => m.placement.rotation !== 0)) missing.push("Review module placement/rotation in stair plan");

  return { level, score, missing };
}

function calculateDesign() {
  const stair = { ...state.stair };
  const modules = state.modules.map((m) => {
    const pockets = pocketGridCount(m.pocketPattern);
    const recommendedLegs = Math.min(Math.max(state.typicalLegsInUse, 4), Math.max(4, pockets - 2));
    const area = (m.width * m.length) / 1_000_000;
    const topWeight = area * m.thickness * 0.65;
    const frameLen = 2 * (m.width + m.length) + Math.floor(m.length / 300) * m.width;
    const frameWeight = (frameLen / 1000) * 1.7;
    const weight = Math.round(topWeight + frameWeight);
    return {
      ...m,
      pockets,
      recommendedLegs,
      weight,
      pocketCells: buildPocketCells(m),
    };
  });

  const legHeights = suggestLegHeights(stair.stepRise, state.legStrategy, state.manualHeights);
  const legCounts = legHeights.map((h, i) => ({ height: h, qty: i < 3 ? 2 : 1 }));

  return {
    stair,
    modules,
    legHeights,
    legCounts,
    bom: makeBOM(modules, legCounts),
    cutList: makeCutList(modules, legCounts),
  };
}

function pocketGridCount(pattern) {
  if (pattern === "3x3") return 9;
  if (pattern === "3x4") return 12;
  if (pattern === "4x4") return 16;
  return 10;
}

function buildPocketCells(module) {
  const [r, c] = module.pocketPattern === "3x3" ? [3, 3] : module.pocketPattern === "3x4" ? [3, 4] : module.pocketPattern === "4x4" ? [4, 4] : [2, 5];
  const cells = [];
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const edge = y === 0 || y === r - 1 || x === 0 || x === c - 1;
      const corner = (y === 0 || y === r - 1) && (x === 0 || x === c - 1);
      let frameSides = corner ? 2 : edge ? 1 : 0;
      if (module.pocketStrategy === "frame-integrated" && !edge && x === Math.floor(c / 2)) frameSides = 1;
      cells.push({ x, y, frameSides, blockSides: 4 - frameSides });
    }
  }
  return { rows: r, cols: c, cells };
}

function suggestLegHeights(rise, strategy, manualText) {
  if (strategy === "manual") {
    return manualText
      .split(",")
      .map((n) => Number(n.trim()))
      .filter((n) => n > 0)
      .sort((a, b) => b - a);
  }
  const base = [1, 2, 3, 4].map((m) => Math.round(m * rise));
  if (strategy === "auto-grouped") return [...new Set(base.map((n) => Math.round(n / 50) * 50))].sort((a, b) => b - a);
  return base.sort((a, b) => b - a);
}

function makeBOM(modules, legCounts) {
  const totalArea = modules.reduce((s, m) => s + (m.width * m.length * m.qty) / 1_000_000, 0);
  const timberMm = modules.reduce((s, m) => s + (2 * (m.width + m.length) + Math.floor(m.length / 300) * m.width) * m.qty, 0);
  const inserts = legCounts.reduce((s, l) => s + l.qty, 0);
  const bolts = inserts;
  const washers = inserts * 2;
  const pocketBlocks = modules.reduce((s, m) => s + m.pocketCells.cells.reduce((a, c) => a + c.blockSides, 0), 0);

  return [
    ["18mm plywood sheets (2440x1220)", Math.max(1, Math.ceil(totalArea / 2.97)), "sheet"],
    ["48x73 frame timber", (timberMm / 1000).toFixed(1), "m"],
    ["48x73 leg timber", (legCounts.reduce((s, l) => s + (l.height * l.qty) / 1000, 0)).toFixed(1), "m"],
    ["Pocket guide blocks (48x73 offcuts)", pocketBlocks, "pcs"],
    ["M8 threaded inserts", inserts, "pcs"],
    ["M8 bolts (countersunk head)", bolts, "pcs"],
    ["M8 washers", washers, "pcs"],
    ["Wood screws", 120, "pcs"],
    ["Glue (optional)", 1, "bottle"],
    ["Anti-slip pads (optional)", Math.max(8, inserts), "pcs"],
  ];
}

function makeCutList(modules, legCounts) {
  const list = [];
  modules.forEach((m) => {
    list.push(["Top plate", m.qty, m.width, m.thickness, m.length, "Plywood", m.name]);
    list.push(["Outer frame long", 2 * m.qty, m.frameW, m.frameH, m.length, "Timber", m.name]);
    list.push(["Outer frame short", 2 * m.qty, m.frameW, m.frameH, m.width, "Timber", m.name]);
    const cross = Math.floor(m.length / 300);
    list.push(["Cross-member", cross * m.qty, m.frameW, m.frameH, m.width - 2 * m.frameW, "Timber", m.name]);
    list.push(["Pocket guide block", m.pocketCells.cells.reduce((a, c) => a + c.blockSides, 0), 30, 73, 120, "Timber", m.name]);
  });

  legCounts.forEach((l) => list.push(["Leg", l.qty, 48, 73, l.height, "Timber", "All modules"]));
  list.push(["Optional diagonal brace", 4, 30, 48, 400, "Timber", "Optional"]);
  return list;
}

function renderConfidence(c) {
  document.querySelector(".confidence-level").textContent = c.level;
  document.getElementById("confidenceDetail").textContent = `Score ${c.score}/9 — add details to improve design quality.`;
  document.getElementById("confidenceTips").innerHTML = c.missing.map((m) => `<li>${m}</li>`).join("");
}

function renderLegSummary(design) {
  const html = `<table><thead><tr><th>Leg length (mm)</th><th>Qty</th></tr></thead><tbody>${design.legCounts
    .map((l) => `<tr><td>${l.height}</td><td>${l.qty}</td></tr>`)
    .join("")}</tbody></table>`;
  document.getElementById("legsSummary").innerHTML = html;
}

function renderPlatformSummary(design) {
  const rows = design.modules
    .map(
      (m) =>
        `<tr><td>${m.name}</td><td>${m.width}x${m.length}</td><td>${m.pocketPattern} (${m.pockets})</td><td>${m.recommendedLegs}</td><td>~${m.weight}kg</td></tr>`
    )
    .join("");
  document.getElementById("platformSummary").innerHTML = `<table><thead><tr><th>Module</th><th>Size</th><th>Pockets</th><th>Legs in use</th><th>Approx weight</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderBOM(design) {
  document.getElementById("bom").innerHTML = `<table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead><tbody>${design.bom
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join("")}</tbody></table>`;
}

function renderCutList(design) {
  document.getElementById("cutList").innerHTML = `<table><thead><tr><th>Part</th><th>Qty</th><th>W</th><th>T/Sec</th><th>L</th><th>Material</th><th>Module</th></tr></thead><tbody>${design.cutList
    .map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6]}</td></tr>`)
    .join("")}</tbody></table>`;
}

function renderNotes(design, confidence) {
  const notes = [
    "Planning tool only: verify stability and safe assembly before use.",
    "Not a substitute for certified scaffolding or engineering approval.",
    "Always confirm leg seating, platform stability, and safe footing before use.",
  ];
  design.modules.forEach((m) => {
    if (m.width > state.stair.stairWidth) notes.push(`${m.name}: module width exceeds stair width; reduce width or rotate during handling.`);
    if (m.length > 1200) notes.push(`${m.name}: long module may be difficult to turn in stairwell.`);
    if (m.pockets > 12) notes.push(`${m.name}: high pocket density; consider reducing pattern or widening module.`);
    notes.push(`${m.name}: many pocket positions exist, but typically ${m.recommendedLegs} legs are used at one time.`);
    notes.push(`${m.name}: pocket logic reuses frame sides where possible to reduce guide block count.`);
  });
  if (confidence.level === "Works") notes.push("Enter stairwell/landing details and review placements to reach Good enough or Very well designed.");
  document.getElementById("notes").innerHTML = notes.map((n) => `<li>${n}</li>`).join("");
}

function renderStairPlan(design) {
  const svg = document.getElementById("stairPlan");
  clearSvg(svg);
  const s = design.stair;
  drawRect(svg, 40, 40, 680, 220, "#eef4ff", "#668");
  if (s.type === "straight") drawRect(svg, 60, 110, 640, 90, "#dce8f7", "#779");
  if (s.type === "l" || s.type === "l_landing") {
    drawRect(svg, 60, 140, 300, 70, "#dce8f7", "#779");
    drawRect(svg, 300, 70, 70, 140, "#dce8f7", "#779");
    drawRect(svg, 360, 70, 280, 70, "#dce8f7", "#779");
  }
  if (s.type === "u" || s.type === "return_landing") {
    drawRect(svg, 60, 70, 250, 70, "#dce8f7", "#779");
    drawRect(svg, 250, 70, 70, 160, "#dce8f7", "#779");
    drawRect(svg, 320, 160, 300, 70, "#dce8f7", "#779");
  }

  design.modules.forEach((m) => {
    if (!m.placement.shown) return;
    const x = 70 + m.placement.x;
    const y = 70 + m.placement.y;
    const w = m.width / 5;
    const h = m.length / 8;
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x} ${y}) rotate(${m.placement.rotation})`);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 0);
    rect.setAttribute("y", 0);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
    rect.setAttribute("fill", "rgba(47,107,93,0.25)");
    rect.setAttribute("stroke", "#2f6b5d");
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", 4);
    txt.setAttribute("y", 14);
    txt.textContent = m.name;
    txt.setAttribute("font-size", "12");
    g.appendChild(rect);
    g.appendChild(txt);
    svg.appendChild(g);
  });
}

function renderModuleTop(module) {
  const svg = document.getElementById("moduleTop");
  clearSvg(svg);
  if (!module) return;
  drawRect(svg, 60, 30, 360, 220, "#f2ebcf", "#8f7d3f");
  drawText(svg, 70, 50, `${module.name} top plate ${module.width}x${module.length}mm`);
}

function renderModuleUnder(module) {
  const svg = document.getElementById("moduleUnder");
  clearSvg(svg);
  if (!module) return;
  drawRect(svg, 60, 30, 360, 220, "#fdfdfd", "#555");
  drawRect(svg, 60, 30, 360, 18, "#d8d8d8", "#666");
  drawRect(svg, 60, 232, 360, 18, "#d8d8d8", "#666");
  drawRect(svg, 60, 30, 18, 220, "#d8d8d8", "#666");
  drawRect(svg, 402, 30, 18, 220, "#d8d8d8", "#666");

  const c = module.pocketCells;
  const gx = 300 / c.cols;
  const gy = 170 / c.rows;
  c.cells.forEach((cell) => {
    const x = 90 + cell.x * gx;
    const y = 55 + cell.y * gy;
    drawRect(svg, x, y, 30, 30, "#eaf6f2", "#5d8");
    drawText(svg, x + 2, y + 18, `F${cell.frameSides}/B${cell.blockSides}`, 9);
  });
  drawText(svg, 70, 270, "F = pocket sides formed by frame; B = added guide block sides");
}

function renderLegSide(heights) {
  const svg = document.getElementById("legSide");
  clearSvg(svg);
  if (!heights.length) return;
  drawRect(svg, 40, 230, 420, 4, "#555", "#555");
  const maxH = Math.max(...heights);
  const step = 400 / heights.length;
  heights.forEach((h, i) => {
    const scaled = (h / maxH) * 180;
    const x = 50 + i * step;
    drawRect(svg, x, 230 - scaled, 28, scaled, "#b1cfbf", "#2f6b5d");
    drawText(svg, x - 2, 245, `${h}mm`, 10);
  });
  drawText(svg, 50, 20, "Left = longest leg, right = shortest leg");
}

function clearSvg(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}
function drawRect(svg, x, y, w, h, fill, stroke) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", w);
  rect.setAttribute("height", h);
  rect.setAttribute("fill", fill);
  rect.setAttribute("stroke", stroke);
  svg.appendChild(rect);
}
function drawText(svg, x, y, text, size = 12) {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("font-size", size);
  t.textContent = text;
  svg.appendChild(t);
}

init();
