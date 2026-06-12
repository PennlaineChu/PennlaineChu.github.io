/**
 * Prototype 1 lab (index.html): phases, BOM/shop, budget, problems, diary, gallery,
 * links. Persists to localStorage under STORAGE_KEY.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "smart-glove-tracker-v1";
  const DEADLINE = new Date(Date.UTC(2026, 5, 30, 23, 59, 59)); // June 30, 2026
  const TRACK_START = new Date(Date.UTC(2026, 3, 9)); // April 9, 2026 — align with kickoff
  const RING_LEN = 2 * Math.PI * 52;
  /** Fixed conversion for estimates & currency toggle (1 USD = 30 NTD). */
  const FX_USD_NTD = 30;

  const PHASES = [
    {
      id: "p0",
      title: "Phase 0: Planning & procurement",
      duration: "Week 0",
      plannedWeeks: 1,
      intro: "Research, order parts, bench setup & toolchain.",
      tasks: [
        { id: "p0-1", text: "Research components and feasibility" },
        { id: "p0-2", text: "Create project tracker (this site)" },
        { id: "p0-3", text: "Order all components" },
        { id: "p0-4", text: "Set up development environment" },
      ],
    },
    {
      id: "p1",
      title: "Phase 1: Proof of concept",
      duration: "Weeks 1–2",
      plannedWeeks: 2,
      intro: "Verify camera → OLED pipeline on the bench.",
      tasks: [
        { id: "p1-1", text: "Set up ESP32-S3 development board" },
        { id: "p1-2", text: "Connect OV2640 camera module" },
        { id: "p1-3", text: "Initialize 1.69\" OLED (ST7789)" },
        { id: "p1-4", text: "Implement basic camera → display pipeline" },
        { id: "p1-5", text: "Test frame rates and latency" },
      ],
    },
    {
      id: "p2",
      title: "Phase 2: Sensor integration",
      duration: "Weeks 3–4",
      plannedWeeks: 2,
      intro: "Flex sensors, ADC smoothing, gesture state machine.",
      tasks: [
        { id: "p2-1", text: "Connect flex sensors to ADC pins" },
        { id: "p2-2", text: "Implement ADC smoothing (moving average)" },
        { id: "p2-3", text: "Calibrate sensors (baseline detection)" },
        { id: "p2-4", text: "Build gesture state machine" },
        { id: "p2-5", text: "Map gestures to actions" },
      ],
    },
    {
      id: "p3",
      title: "Phase 3: Wearable integration",
      duration: "Weeks 5–8",
      plannedWeeks: 4,
      intro: "PCB, glove, mechanical fit.",
      tasks: [
        { id: "p3-1", text: "Design main PCB (KiCad / EasyEDA)" },
        { id: "p3-2", text: "Design fingertip camera board" },
        { id: "p3-3", text: "Order PCBs (e.g. JLCPCB)" },
        { id: "p3-4", text: "Source compression glove" },
        { id: "p3-5", text: "3D print camera housing (TPU)" },
        { id: "p3-6", text: "Sew flex sensors into glove" },
        { id: "p3-7", text: "Assemble and test on-body" },
      ],
    },
    {
      id: "p4",
      title: "Phase 4: Software & tuning",
      duration: "Weeks 9–10",
      plannedWeeks: 2,
      intro: "Zoom, focus peaking, power, polish.",
      tasks: [
        { id: "p4-1", text: "Implement digital zoom (bicubic resize)" },
        { id: "p4-2", text: "Add focus peaking (edge highlight)" },
        { id: "p4-3", text: "Optimize for ~15 fps live preview" },
        { id: "p4-4", text: "Implement deep sleep for power saving" },
        { id: "p4-5", text: "Optional: OCR with ESP-WHO" },
        { id: "p4-6", text: "Final testing and calibration" },
      ],
    },
  ];

  /** `estUsd` = rough USD estimate for the parts total (NTD/USD toggle in budget UI). */
  const SHOP = {
    electronics: [
      { id: "e-mcu", item: "MCU module", part: "ESP32-S3-WROOM-1-N16R8", estUsd: 6 },
      { id: "e-cam", item: "Camera", part: "OV2640 (24-pin FPC)", estUsd: 4 },
      { id: "e-oled", item: "OLED", part: '1.69" 240×280 ST7789 SPI', estUsd: 8 },
      { id: "e-flex", item: "Flex sensors", part: "Spectra Symbol 2.2\" ×4", estUsd: 20 },
      {
        id: "e-bat",
        item: "Battery",
        part: "1S LiPo + PCM, bare red/black (≈503035—charge-test real mAh)",
        estUsd: null,
      },
      { id: "e-chg", item: "Charger", part: "TP4056 + protection", estUsd: 1 },
      { id: "e-led", item: "LEDs", part: "0603 white ×4", estUsd: 1 },
      {
        id: "e-jstph",
        item: "Battery pigtail",
        part: "JST-PH 2.0 mm 2-pin pair—solder to pack; mates many charger boards",
        estUsd: 3,
      },
      {
        id: "e-jst",
        item: "Flex connectors",
        part: "4-pin JST SH 1.0 mm ×5—finger harnesses, not battery",
        estUsd: 2,
      },
    ],
    mechanical: [
      { id: "m-glove", item: "Glove", part: "Compression glove (open fingers)", estUsd: 15 },
      { id: "m-housing", item: "Camera housing", part: "Custom TPU print", estUsd: 5 },
      { id: "m-pcb", item: "PCB fab", part: "JLCPCB 4-layer", estUsd: 20 },
      { id: "m-fpc", item: "Cabling", part: "0.5 mm pitch FPC", estUsd: 3 },
    ],
    tools: [
      { id: "t-solder", item: "Soldering iron", part: "PCB assembly", estUsd: null },
      { id: "t-shrink", item: "Heat shrink", part: "Wire management", estUsd: null },
      { id: "t-thread", item: "Conductive thread", part: "Sewing flex sensors", estUsd: null },
      { id: "t-velcro", item: "Velcro", part: "Mounts", estUsd: null },
    ],
  };

  const CHALLENGES = [
    {
      id: "c-lag",
      name: "Camera lag",
      solution: "DMA camera→PSRAM→display; QVGA capture, upscale to OLED.",
    },
    {
      id: "c-pwr",
      name: "Power drain",
      solution: "Deep sleep; ~2–3 h active on ~500 mAh class cell (scale with measured mAh).",
    },
    {
      id: "c-drift",
      name: "Flex sensor drift",
      solution: "Calibrate on startup; temperature compensate if needed.",
    },
    {
      id: "c-blur",
      name: "Vibration blur",
      solution: "MPU6050 motion gating; capture when stable.",
    },
    {
      id: "c-bulk",
      name: "Fingertip bulk",
      solution: "Micro camera module; accept reduced dexterity on index finger.",
    },
  ];

  const DEFAULT_LINKS = [
    { id: "l-esp32", url: "https://www.espressif.com/en/products/socs/esp32-s3", title: "ESP32-S3 overview" },
    { id: "l-ov2640", url: "https://github.com/espressif/esp32-camera", title: "ESP32 camera driver" },
  ];

  function defaultState() {
    const tasks = {};
    PHASES.forEach((p) => p.tasks.forEach((t) => (tasks[t.id] = false)));
    tasks["p0-1"] = true;
    tasks["p0-2"] = true;

    const shop = {};
    [...SHOP.electronics, ...SHOP.mechanical, ...SHOP.tools].forEach((row) => {
      shop[row.id] = { ordered: false, received: false };
    });

    const challenges = CHALLENGES.map((c) => ({
      id: c.id,
      name: c.name,
      solution: c.solution,
      status: "open",
      note: "",
    }));

    return {
      tasks,
      shop,
      challenges,
      photos: [],
      diary: [],
      shopExtra: [],
      shopOverrides: {},
      shopRemovedIds: [],
      budgetSpent: 0,
      currency: "ntd",
      links: [...DEFAULT_LINKS],
      timelineStart: isoDateFromUtcDate(TRACK_START),
      phaseCompletedAt: {},
    };
  }

  function isoDateLocal(d) {
    const x = d instanceof Date ? d : new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function normalizePhaseCompletedAt(raw) {
    const o = {};
    const valid = new Set(PHASES.map((p) => p.id));
    if (!raw || typeof raw !== "object") return o;
    Object.keys(raw).forEach((k) => {
      if (!valid.has(k)) return;
      const v = raw[k];
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) o[k] = v;
    });
    return o;
  }

  /** Weeks from project start (local) to end date inclusive span; fractional. */
  function elapsedWeeksFromStartToDate(isoStart, isoEnd) {
    if (
      !isoStart ||
      !isoEnd ||
      !/^\d{4}-\d{2}-\d{2}$/.test(isoStart) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(isoEnd)
    )
      return null;
    const p0 = isoStart.split("-").map(Number);
    const p1 = isoEnd.split("-").map(Number);
    const a = new Date(p0[0], p0[1] - 1, p0[2]);
    const b = new Date(p1[0], p1[1] - 1, p1[2]);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    if (b < a) return 0;
    const days = Math.round((b - a) / 86400000);
    return days / 7;
  }

  /** Sets completion date when a phase becomes all-done; clears when any task unchecked. */
  function syncPhaseCompletionDates() {
    if (!state.phaseCompletedAt || typeof state.phaseCompletedAt !== "object") {
      state.phaseCompletedAt = {};
    }
    let changed = false;
    PHASES.forEach((p) => {
      const allDone = p.tasks.length > 0 && p.tasks.every((t) => state.tasks[t.id]);
      if (allDone) {
        if (!state.phaseCompletedAt[p.id]) {
          state.phaseCompletedAt[p.id] = isoDateLocal();
          changed = true;
        }
      } else if (state.phaseCompletedAt[p.id]) {
        delete state.phaseCompletedAt[p.id];
        changed = true;
      }
    });
    return changed;
  }

  function normalizeShopRemovedIds(raw) {
    if (!Array.isArray(raw)) return [];
    return [...new Set(raw.filter((x) => typeof x === "string" && x.length > 0))];
  }

  function normalizeDiaryEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const text = typeof raw.text === "string" ? raw.text : "";
    const when = typeof raw.when === "string" ? raw.when : new Date().toISOString();
    const kind = raw.kind === "idea" ? "idea" : "note";
    const id = typeof raw.id === "string" ? raw.id : uid();
    return { id, when, text, kind };
  }

  /** Migrate legacy flat `notes` string into a single dated entry. */
  function normalizeDiary(diaryRaw, legacyNotes) {
    if (Array.isArray(diaryRaw) && diaryRaw.length > 0) {
      return diaryRaw.map(normalizeDiaryEntry).filter(Boolean);
    }
    if (typeof legacyNotes === "string" && legacyNotes.trim()) {
      return [
        {
          id: uid(),
          when: new Date().toISOString(),
          text: legacyNotes.trim(),
          kind: "note",
        },
      ];
    }
    return [];
  }

  function normalizeChallengeRow(raw) {
    if (!raw || typeof raw !== "object") return null;
    const status =
      raw.status === "progress" || raw.status === "resolved" ? raw.status : "open";
    return {
      id: typeof raw.id === "string" ? raw.id : uid(),
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Untitled",
      solution: typeof raw.solution === "string" ? raw.solution : "",
      status,
      note: typeof raw.note === "string" ? raw.note : "",
    };
  }

  /** New format: array of rows. Legacy: object map `{ id: { status, note } }` with static `CHALLENGES` names. */
  function normalizeChallenges(raw) {
    if (Array.isArray(raw)) {
      const rows = raw.map(normalizeChallengeRow).filter(Boolean);
      return rows;
    }
    if (raw && typeof raw === "object") {
      return CHALLENGES.map((c) => ({
        id: c.id,
        name: c.name,
        solution: c.solution,
        status:
          raw[c.id]?.status === "progress" || raw[c.id]?.status === "resolved"
            ? raw[c.id].status
            : "open",
        note: typeof raw[c.id]?.note === "string" ? raw[c.id].note : "",
      }));
    }
    return CHALLENGES.map((c) => ({
      id: c.id,
      name: c.name,
      solution: c.solution,
      status: "open",
      note: "",
    }));
  }

  function isoDateFromUtcDate(d) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function computeProjectWeek(isoDateStr) {
    if (!isoDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(isoDateStr)) return null;
    const parts = isoDateStr.split("-").map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (now < start) return 1;
    const days = Math.round((now - start) / 86400000);
    return Math.floor(days / 7) + 1;
  }

  function getPhaseWeekBoundsList() {
    let cursor = 1;
    return PHASES.map((p) => {
      const startWeek = cursor;
      const w = p.plannedWeeks;
      const endWeek = startWeek + w - 1;
      cursor = endWeek + 1;
      return { id: p.id, startWeek, endWeek, plannedWeeks: w };
    });
  }

  function actualWeeksElapsedInPhase(phaseId, projectWeek) {
    if (projectWeek == null) return null;
    const b = getPhaseWeekBoundsList().find((x) => x.id === phaseId);
    if (!b) return null;
    if (projectWeek < b.startWeek) return 0;
    if (projectWeek > b.endWeek) return b.plannedWeeks;
    return projectWeek - b.startWeek + 1;
  }

  function sumPriorPlannedWeeks(phaseIndex) {
    let s = 0;
    for (let j = 0; j < phaseIndex; j++) s += PHASES[j].plannedWeeks;
    return s;
  }

  function displayedActualWeeksForPhase(phase, phaseIndex, projectWeek) {
    const allDone =
      phase.tasks.length > 0 && phase.tasks.every((t) => state.tasks[t.id]);
    if (allDone) {
      const t = state.timelineStart;
      if (!t) return null;
      const end = state.phaseCompletedAt?.[phase.id];
      if (!end) return null;
      const elapsed = elapsedWeeksFromStartToDate(t, end);
      if (elapsed === null) return null;
      const prior = sumPriorPlannedWeeks(phaseIndex);
      return Math.round(Math.max(0, elapsed - prior) * 100) / 100;
    }
    return actualWeeksElapsedInPhase(phase.id, projectWeek);
  }

  function formatActualWeeksLabel(n) {
    if (n == null || Number.isNaN(n)) return "—";
    const r = Math.round(n * 100) / 100;
    let s = r.toFixed(2);
    if (s.includes(".")) s = s.replace(/\.?0+$/, "");
    return `${s} wk`;
  }

  function normalizeShopOverrides(raw) {
    const o = {};
    if (!raw || typeof raw !== "object") return o;
    Object.keys(raw).forEach((id) => {
      if (typeof id !== "string" || !id) return;
      const v = raw[id];
      if (!v || typeof v !== "object") return;
      const entry = {};
      if (typeof v.item === "string") entry.item = v.item;
      if (typeof v.part === "string") entry.part = v.part;
      if ("estUsd" in v) {
        const n = Number(v.estUsd);
        entry.estUsd =
          v.estUsd == null || v.estUsd === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n);
      }
      if (Object.keys(entry).length) o[id] = entry;
    });
    return o;
  }

  function normalizeShopExtraRow(raw) {
    if (!raw || typeof raw !== "object") return null;
    const cat =
      raw.cat === "mechanical" || raw.cat === "tools" || raw.cat === "electronics"
        ? raw.cat
        : "electronics";
    const estRaw = raw.estUsd;
    const hasEst = typeof estRaw === "number" && Number.isFinite(estRaw) && estRaw >= 0;
    return {
      id: typeof raw.id === "string" ? raw.id : uid(),
      cat,
      item: typeof raw.item === "string" && raw.item.trim() ? raw.item.trim() : "Custom item",
      part: typeof raw.part === "string" ? raw.part : "",
      estUsd: hasEst ? estRaw : null,
      userAdded: true,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      const shopExtra = Array.isArray(parsed.shopExtra)
        ? parsed.shopExtra.map(normalizeShopExtraRow).filter(Boolean)
        : [];
      const shop = { ...base.shop, ...parsed.shop };
      [...SHOP.electronics, ...SHOP.mechanical, ...SHOP.tools, ...shopExtra].forEach((row) => {
        if (!shop[row.id]) shop[row.id] = { ordered: false, received: false };
      });
      return {
        tasks: { ...base.tasks, ...parsed.tasks },
        shop,
        shopExtra,
        challenges: normalizeChallenges(parsed.challenges),
        photos: Array.isArray(parsed.photos) ? parsed.photos : [],
        diary: normalizeDiary(parsed.diary, parsed.notes),
        budgetSpent: typeof parsed.budgetSpent === "number" ? parsed.budgetSpent : 0,
        currency: parsed.currency === "usd" || parsed.currency === "ntd" ? parsed.currency : "usd",
        links: Array.isArray(parsed.links) && parsed.links.length ? parsed.links : base.links,
        timelineStart:
          typeof parsed.timelineStart === "string" ? parsed.timelineStart : base.timelineStart,
        shopRemovedIds: normalizeShopRemovedIds(parsed.shopRemovedIds ?? base.shopRemovedIds),
        shopOverrides: normalizeShopOverrides(parsed.shopOverrides ?? base.shopOverrides),
        phaseCompletedAt: normalizePhaseCompletedAt(
          parsed.phaseCompletedAt ?? base.phaseCompletedAt
        ),
      };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();
  if (syncPhaseCompletionDates()) saveState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid() {
    return "x-" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }

  /* --- Countdown --- */
  function updateDeadlineUI() {
    const now = new Date();
    const msLeft = DEADLINE - now;
    const daysLeft = Math.ceil(msLeft / (86400 * 1000));
    const elDays = document.getElementById("countdown-days");
    const ring = document.getElementById("deadline-ring");
    const msg = document.getElementById("deadline-message");

    if (msLeft <= 0) {
      elDays.textContent = "0";
      if (ring) ring.style.strokeDashoffset = RING_LEN;
      msg.textContent = "Deadline passed—ship and iterate.";
      return;
    }

    elDays.textContent = String(Math.max(0, daysLeft));

    const total = DEADLINE - TRACK_START;
    const left = DEADLINE - now;
    const frac = Math.min(1, Math.max(0, left / total));
    if (ring) ring.style.strokeDashoffset = RING_LEN * (1 - frac);

    if (daysLeft <= 7) msg.textContent = "Final week—document & test.";
    else if (daysLeft <= 30) msg.textContent = "Sprint: close riskiest gaps first.";
    else msg.textContent = "Steady progress.";
  }

  /* --- Stats --- */
  function countTasks() {
    let done = 0;
    let total = 0;
    PHASES.forEach((p) => {
      p.tasks.forEach((t) => {
        total++;
        if (state.tasks[t.id]) done++;
      });
    });
    return { done, total };
  }

  function countPhasesTouched() {
    let n = 0;
    PHASES.forEach((p) => {
      const any = p.tasks.some((t) => state.tasks[t.id]);
      if (any) n++;
    });
    return n;
  }

  function formatBudgetDisplay(amount) {
    const n = Math.round(Number(amount) || 0);
    return state.currency === "usd" ? `≈$${n}` : `≈NT$${n}`;
  }

  function getCanonicalShopRow(id) {
    for (const cat of ["electronics", "mechanical", "tools"]) {
      const r = SHOP[cat].find((x) => x.id === id);
      if (r) return r;
    }
    return null;
  }

  function mergedShopRow(row) {
    if (row.userAdded) return row;
    const o = state.shopOverrides?.[row.id];
    if (!o) return { ...row };
    return {
      ...row,
      item: typeof o.item === "string" ? o.item : row.item,
      part: typeof o.part === "string" ? o.part : row.part,
      estUsd: "estUsd" in o ? o.estUsd : row.estUsd,
    };
  }

  function reconcileShopKeys(s) {
    if (!s.shop) s.shop = {};
    if (!Array.isArray(s.shopRemovedIds)) s.shopRemovedIds = [];
    const removed = new Set(s.shopRemovedIds);
    [...SHOP.electronics, ...SHOP.mechanical, ...SHOP.tools, ...(s.shopExtra || [])].forEach((row) => {
      if (removed.has(row.id)) return;
      if (!s.shop[row.id]) s.shop[row.id] = { ordered: false, received: false };
    });
  }

  function getShopRows(cat) {
    const removed = new Set(state.shopRemovedIds || []);
    const base = SHOP[cat].filter((r) => !removed.has(r.id));
    const extra = (state.shopExtra || []).filter((r) => r.cat === cat);
    return [...base, ...extra];
  }

  function sumShopUsdEstimate() {
    let s = 0;
    const removed = new Set(state.shopRemovedIds || []);
    [...SHOP.electronics, ...SHOP.mechanical].forEach((row) => {
      if (removed.has(row.id)) return;
      const m = mergedShopRow(row);
      if (m.estUsd != null && Number.isFinite(Number(m.estUsd))) s += Number(m.estUsd);
    });
    (state.shopExtra || []).forEach((row) => {
      if (row.estUsd != null && Number.isFinite(Number(row.estUsd))) s += Number(row.estUsd);
    });
    return s;
  }

  function updateBudgetHintOnly() {
    const hint = document.getElementById("budget-hint");
    if (!hint) return;
    const t = sumShopUsdEstimate();
    hint.textContent =
      state.currency === "usd"
        ? `≈$${t} estimated parts (electronics + mechanical)`
        : `≈NT$${Math.round(t * FX_USD_NTD)} estimated parts (electronics + mechanical)`;
  }

  let shopBomPersistTimer;
  function debouncedShopBomPersist() {
    clearTimeout(shopBomPersistTimer);
    shopBomPersistTimer = setTimeout(() => {
      saveState();
      updateBudgetHintOnly();
    }, 350);
  }

  function syncShopRowFromInputs(tr) {
    const id = tr.dataset.shopId;
    const isExtra = tr.dataset.shopExtra === "1";
    const itemIn = tr.querySelector('.shop-bom-field[data-field="item"]');
    const partIn = tr.querySelector('.shop-bom-field[data-field="part"]');
    const usdIn = tr.querySelector('.shop-bom-field[data-field="estUsd"]');
    const item = (itemIn?.value ?? "").trim();
    const part = partIn?.value ?? "";
    const usdRaw = String(usdIn?.value ?? "").trim();
    const n = parseFloat(usdRaw);
    const estUsd =
      usdRaw === "" || !Number.isFinite(n) || n < 0 ? null : Math.round(n);

    if (isExtra) {
      const r = state.shopExtra.find((x) => x.id === id);
      if (r) {
        r.item = item || "Custom item";
        r.part = part;
        r.estUsd = estUsd;
        delete r.estLabel;
      }
      return;
    }
    const canon = getCanonicalShopRow(id);
    if (!canon) return;
    const cUsd =
      canon.estUsd != null && Number.isFinite(Number(canon.estUsd))
        ? Math.round(Number(canon.estUsd))
        : null;
    if (item === canon.item && part === (canon.part ?? "") && estUsd === cUsd) {
      if (state.shopOverrides[id]) delete state.shopOverrides[id];
      return;
    }
    if (!state.shopOverrides) state.shopOverrides = {};
    state.shopOverrides[id] = { item, part, estUsd };
  }

  function refreshMoneyUI() {
    const sym = document.getElementById("budget-currency-symbol");
    if (sym) sym.textContent = state.currency === "usd" ? "≈$" : "≈NT$";
    const sel = document.getElementById("currency-select");
    if (sel) sel.value = state.currency;
    const budgetIn = document.getElementById("budget-spent");
    if (budgetIn) budgetIn.value = state.budgetSpent === 0 ? "" : String(state.budgetSpent);
    updateBudgetHintOnly();
    renderShopTable("table-electronics", getShopRows("electronics"));
    renderShopTable("table-mechanical", getShopRows("mechanical"));
    renderShopTable("table-tools", getShopRows("tools"));
    updateShopBadges();
    updateHeroStats();
  }

  function updateHeroStats() {
    const { done, total } = countTasks();
    document.getElementById("stat-tasks").textContent = `${done}/${total}`;
    document.getElementById("stat-budget").textContent = formatBudgetDisplay(state.budgetSpent || 0);
    document.getElementById("stat-phases").textContent = `${countPhasesTouched()}/${PHASES.length}`;
  }

  /* --- Timeline --- */
  function renderTimeline() {
    const root = document.getElementById("timeline-root");
    const tools = document.getElementById("timeline-week-tools");
    const openPhaseIds = new Set();
    root.querySelectorAll("details.phase-card[open]").forEach((el) => {
      const id = el.dataset.phaseId;
      if (id) openPhaseIds.add(id);
    });
    root.innerHTML = "";

    const weekN = computeProjectWeek(state.timelineStart);

    if (tools) {
      tools.hidden = false;
      tools.innerHTML = `<div class="timeline-week-tools-grid">
        <div class="timeline-week-field">
          <label for="timeline-start-date">Project start</label>
          <input type="date" id="timeline-start-date" value="${escapeAttr(state.timelineStart || "")}" />
        </div>
        <div class="timeline-week-readout" aria-live="polite">
          ${weekN != null ? `Current project week: <strong>${weekN}</strong>` : "—"}
        </div>
      </div>`;

      const dateIn = tools.querySelector("#timeline-start-date");
      dateIn.addEventListener("change", () => {
        state.timelineStart = dateIn.value || "";
        saveState();
        renderTimeline();
      });
    }

    PHASES.forEach((phase, idx) => {
      const done = phase.tasks.filter((t) => state.tasks[t.id]).length;
      const pct = phase.tasks.length ? Math.round((done / phase.tasks.length) * 100) : 0;
      const aw = displayedActualWeeksForPhase(phase, idx, weekN);
      const awLabel = formatActualWeeksLabel(aw);
      const details = document.createElement("details");
      details.className = "phase-card";
      details.dataset.phaseId = phase.id;
      details.open =
        openPhaseIds.size > 0 ? openPhaseIds.has(phase.id) : idx === 0;

      const head = document.createElement("summary");
      head.className = "phase-head";
      head.innerHTML = `<span class="phase-chevron" aria-hidden="true">▶</span>
        <span class="phase-title">${escapeHtml(phase.title)}</span>
        <span class="phase-meta">${escapeHtml(phase.duration)} · actual ${escapeHtml(awLabel)} · ${done}/${phase.tasks.length} tasks</span>`;

      const bar = document.createElement("div");
      bar.className = "phase-bar";
      bar.innerHTML = `<div class="phase-bar-fill" style="width:${pct}%"></div>`;

      const body = document.createElement("div");
      body.className = "phase-body";
      const intro = document.createElement("p");
      intro.textContent = phase.intro;
      body.appendChild(intro);

      const fin = state.phaseCompletedAt?.[phase.id];
      if (done === phase.tasks.length && phase.tasks.length > 0 && fin) {
        const doneLine = document.createElement("p");
        doneLine.className = "phase-finished-on";
        doneLine.textContent = `Finished ${fin}`;
        body.appendChild(doneLine);
      }

      const ul = document.createElement("ul");
      ul.className = "task-list";
      phase.tasks.forEach((t) => {
        const li = document.createElement("li");
        const id = `task-${t.id}`;
        const checked = state.tasks[t.id] ? " checked" : "";
        li.innerHTML = `<input type="checkbox" id="${id}" data-task="${t.id}"${checked} />
          <label for="${id}">${escapeHtml(t.text)}</label>`;
        ul.appendChild(li);
      });
      body.appendChild(ul);

      details.appendChild(head);
      details.appendChild(bar);
      details.appendChild(body);
      root.appendChild(details);
    });

    root.querySelectorAll('input[type="checkbox"][data-task]').forEach((cb) => {
      cb.addEventListener("change", () => {
        state.tasks[cb.dataset.task] = cb.checked;
        syncPhaseCompletionDates();
        saveState();
        renderTimeline();
        updateHeroStats();
      });
    });
  }

  /* --- Shopping --- */
  function shopProgress(rows) {
    let o = 0,
      r = 0,
      t = rows.length;
    rows.forEach((row) => {
      const s = state.shop[row.id] || { ordered: false, received: false };
      if (s.ordered) o++;
      if (s.received) r++;
    });
    return { o, r, t };
  }

  function renderShopTable(tableId, rows) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const estHead = state.currency === "usd" ? "Est. (≈USD)" : "Est. (≈NTD)";
    table.innerHTML = `<thead><tr>
      <th>Item</th><th>Part</th><th>${estHead}</th>
      <th class="chk">Ord</th><th class="chk">Recv</th>
      <th class="shop-actions-col" aria-label="Remove"></th>
    </tr></thead><tbody></tbody>`;
    const body = table.querySelector("tbody");
    rows.forEach((row) => {
      const display = mergedShopRow(row);
      const isExtra = row.userAdded === true;
      const s = state.shop[row.id] || { ordered: false, received: false };
      const tr = document.createElement("tr");
      tr.dataset.shopId = row.id;
      tr.dataset.shopExtra = isExtra ? "1" : "0";

      const tdItem = document.createElement("td");
      const inItem = document.createElement("input");
      inItem.type = "text";
      inItem.className = "shop-bom-field shop-bom-item";
      inItem.dataset.field = "item";
      inItem.setAttribute("aria-label", "Item");
      inItem.value = display.item || "";
      tdItem.appendChild(inItem);

      const tdPart = document.createElement("td");
      const inPart = document.createElement("input");
      inPart.type = "text";
      inPart.className = "shop-bom-field shop-bom-part";
      inPart.dataset.field = "part";
      inPart.setAttribute("aria-label", "Part or source");
      inPart.value = display.part || "";
      tdPart.appendChild(inPart);

      const tdEst = document.createElement("td");
      tdEst.className = "shop-bom-est-cell";
      const inUsd = document.createElement("input");
      inUsd.type = "number";
      inUsd.min = "0";
      inUsd.step = "1";
      inUsd.className = "shop-bom-field shop-bom-est-usd";
      inUsd.dataset.field = "estUsd";
      inUsd.setAttribute("aria-label", "Estimated USD");
      inUsd.placeholder = "USD";
      if (display.estUsd != null && Number.isFinite(Number(display.estUsd))) {
        inUsd.value = String(Math.round(Number(display.estUsd)));
      }
      tdEst.appendChild(inUsd);

      const tdOrd = document.createElement("td");
      tdOrd.className = "chk";
      const cbO = document.createElement("input");
      cbO.type = "checkbox";
      cbO.dataset.shop = row.id;
      cbO.dataset.field = "ordered";
      cbO.checked = !!s.ordered;
      tdOrd.appendChild(cbO);

      const tdRec = document.createElement("td");
      tdRec.className = "chk";
      const cbR = document.createElement("input");
      cbR.type = "checkbox";
      cbR.dataset.shop = row.id;
      cbR.dataset.field = "received";
      cbR.checked = !!s.received;
      tdRec.appendChild(cbR);

      const tdRm = document.createElement("td");
      tdRm.className = "shop-actions-col";
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "shop-row-remove";
      rm.dataset.shopRemoveId = row.id;
      rm.dataset.shopRemoveKind = isExtra ? "extra" : "default";
      rm.setAttribute("aria-label", "Remove line");
      rm.textContent = "×";
      tdRm.appendChild(rm);

      tr.appendChild(tdItem);
      tr.appendChild(tdPart);
      tr.appendChild(tdEst);
      tr.appendChild(tdOrd);
      tr.appendChild(tdRec);
      tr.appendChild(tdRm);
      body.appendChild(tr);
    });

    table.querySelectorAll("input[data-shop]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const id = cb.dataset.shop;
        const field = cb.dataset.field;
        if (!state.shop[id]) state.shop[id] = { ordered: false, received: false };
        state.shop[id][field] = cb.checked;
        saveState();
        updateShopBadges();
      });
    });

    table.querySelectorAll(".shop-row-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.shopRemoveId;
        const rmKind = btn.dataset.shopRemoveKind;
        if (rmKind === "extra") {
          state.shopExtra = (state.shopExtra || []).filter((r) => r.id !== id);
        } else {
          if (!state.shopRemovedIds) state.shopRemovedIds = [];
          if (!state.shopRemovedIds.includes(id)) state.shopRemovedIds.push(id);
        }
        delete state.shop[id];
        if (state.shopOverrides && state.shopOverrides[id]) delete state.shopOverrides[id];
        saveState();
        refreshMoneyUI();
      });
    });
  }

  function wireBomTableDelegation() {
    const root = document.getElementById("shopping");
    if (!root || root.dataset.bomInputWired === "1") return;
    root.dataset.bomInputWired = "1";
    const onFieldChange = (e) => {
      const t = e.target;
      if (!t.classList.contains("shop-bom-field")) return;
      const tr = t.closest("tr");
      if (!tr || !tr.dataset.shopId) return;
      syncShopRowFromInputs(tr);
      debouncedShopBomPersist();
    };
    root.addEventListener("input", onFieldChange);
    root.addEventListener("change", onFieldChange);
  }

  function updateShopBadges() {
    const e = shopProgress(getShopRows("electronics"));
    const m = shopProgress(getShopRows("mechanical"));
    const t = shopProgress(getShopRows("tools"));
    const el = document.getElementById("shop-elec-progress");
    const ml = document.getElementById("shop-mech-progress");
    const tl = document.getElementById("shop-tools-progress");
    if (el) el.textContent = `${e.r}/${e.t} received`;
    if (ml) ml.textContent = `${m.r}/${m.t} received`;
    if (tl) tl.textContent = `${t.r}/${t.t} received`;
  }

  function wireBudget() {
    const input = document.getElementById("budget-spent");
    if (!input) return;
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      state.budgetSpent = Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
      saveState();
      updateHeroStats();
    });
  }

  function wireCurrency() {
    const sel = document.getElementById("currency-select");
    if (!sel) return;
    sel.addEventListener("change", () => {
      const next = sel.value === "usd" ? "usd" : "ntd";
      const prev = state.currency;
      if (prev !== next) {
        const amt = Number(state.budgetSpent) || 0;
        if (prev === "usd" && next === "ntd") state.budgetSpent = Math.round(amt * FX_USD_NTD);
        else if (prev === "ntd" && next === "usd") state.budgetSpent = Math.round(amt / FX_USD_NTD);
        state.currency = next;
        saveState();
      }
      refreshMoneyUI();
    });
    refreshMoneyUI();
  }

  function wireShopAdd() {
    const btn = document.getElementById("shop-add-btn");
    if (!btn || btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    const add = () => {
      const catEl = document.getElementById("shop-add-category");
      const itemEl = document.getElementById("shop-add-item");
      const partEl = document.getElementById("shop-add-part");
      const estEl = document.getElementById("shop-add-est");
      const cat = catEl?.value === "mechanical" || catEl?.value === "tools" ? catEl.value : "electronics";
      const item = String(itemEl?.value || "").trim();
      const part = String(partEl?.value || "").trim();
      if (!item) return;
      const estV = parseFloat(estEl?.value);
      const estUsd = Number.isFinite(estV) && estV >= 0 ? Math.round(estV) : null;
      const row = normalizeShopExtraRow({
        cat,
        item,
        part,
        estUsd,
      });
      if (!state.shopExtra) state.shopExtra = [];
      state.shopExtra.push(row);
      state.shop[row.id] = { ordered: false, received: false };
      itemEl.value = "";
      partEl.value = "";
      if (estEl) estEl.value = "";
      saveState();
      refreshMoneyUI();
    };
    btn.addEventListener("click", add);
    document.getElementById("shop-add-item")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        add();
      }
    });
  }

  /* --- Challenges (editable list) --- */
  function renderChallenges() {
    const body = document.getElementById("challenge-body");
    if (!body) return;
    body.innerHTML = "";
    if (!state.challenges.length) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td colspan="5" class="challenge-empty">No rows — add below.</td>';
      body.appendChild(tr);
      return;
    }

    state.challenges.forEach((row) => {
      const tr = document.createElement("tr");
      tr.dataset.rowId = row.id;
      tr.innerHTML = `<td><input type="text" class="challenge-field challenge-field-name" value="${escapeAttr(row.name)}" aria-label="Challenge name" /></td>
        <td><select class="challenge-field-status" aria-label="Status">
          <option value="open"${row.status === "open" ? " selected" : ""}>Open</option>
          <option value="progress"${row.status === "progress" ? " selected" : ""}>In progress</option>
          <option value="resolved"${row.status === "resolved" ? " selected" : ""}>Resolved</option>
        </select></td>
        <td><textarea class="challenge-field challenge-field-solution" rows="2" aria-label="Solution direction">${escapeHtml(row.solution)}</textarea></td>
        <td><input type="text" class="challenge-field challenge-field-note" value="${escapeAttr(row.note)}" placeholder="Note…" aria-label="Note" /></td>
        <td class="challenge-actions-col"><button type="button" class="challenge-delete btn btn-ghost" aria-label="Delete row">Remove</button></td>`;
      body.appendChild(tr);
    });

    body.querySelectorAll("tr[data-row-id]").forEach((tr) => {
      const id = tr.dataset.rowId;
      const row = state.challenges.find((r) => r.id === id);
      if (!row) return;

      tr.querySelector(".challenge-field-name")?.addEventListener("input", (e) => {
        row.name = e.target.value.trim() ? e.target.value : "Untitled";
        debouncedSave();
      });
      tr.querySelector(".challenge-field-solution")?.addEventListener("input", (e) => {
        row.solution = e.target.value;
        debouncedSave();
      });
      tr.querySelector(".challenge-field-note")?.addEventListener("input", (e) => {
        row.note = e.target.value;
        debouncedSave();
      });
      tr.querySelector(".challenge-field-status")?.addEventListener("change", (e) => {
        row.status = e.target.value;
        saveState();
      });
      tr.querySelector(".challenge-delete")?.addEventListener("click", () => {
        state.challenges = state.challenges.filter((r) => r.id !== id);
        saveState();
        renderChallenges();
      });
    });
  }

  function wireChallenges() {
    const btn = document.getElementById("challenge-add-btn");
    if (!btn || btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    const add = () => {
      const nameEl = document.getElementById("challenge-new-name");
      const solEl = document.getElementById("challenge-new-solution");
      const name = String(nameEl.value || "").trim();
      const solution = String(solEl.value || "").trim();
      if (!name) return;
      state.challenges.push({
        id: uid(),
        name,
        solution,
        status: "open",
        note: "",
      });
      nameEl.value = "";
      solEl.value = "";
      saveState();
      renderChallenges();
    };
    btn.addEventListener("click", add);
    document.getElementById("challenge-new-name")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        add();
      }
    });
  }

  /* --- Gallery --- */
  const MAX_PHOTO_DIM = 900;
  const JPEG_Q = 0.82;

  function resizeImage(file, cb) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PHOTO_DIM || height > MAX_PHOTO_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_PHOTO_DIM) / width);
          width = MAX_PHOTO_DIM;
        } else {
          width = Math.round((width * MAX_PHOTO_DIM) / height);
          height = MAX_PHOTO_DIM;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_Q);
        cb(null, dataUrl);
      } catch (e) {
        cb(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      cb(new Error("load"));
    };
    img.src = url;
  }

  function approxBytesFromDataUrl(dataUrl) {
    const i = dataUrl.indexOf(",");
    if (i < 0) return 0;
    const b64 = dataUrl.slice(i + 1);
    return Math.round((b64.length * 3) / 4);
  }

  function renderGallery() {
    const grid = document.getElementById("gallery-grid");
    const hint = document.getElementById("storage-hint");
    grid.innerHTML = "";
    let total = 0;
    state.photos.forEach((ph) => {
      total += approxBytesFromDataUrl(ph.dataUrl || "");
      const fig = document.createElement("figure");
      fig.className = "gallery-item";
      fig.dataset.id = ph.id;
      fig.innerHTML = `<button type="button" class="remove-photo" aria-label="Remove photo">×</button>
        <button type="button" class="gallery-thumb" aria-label="View larger">
          <img src="${ph.dataUrl}" alt="" loading="lazy" />
        </button>
        <textarea class="caption" data-photo="${ph.id}" placeholder="Caption…">${escapeHtml(ph.caption || "")}</textarea>`;
      grid.appendChild(fig);
    });

    grid.querySelectorAll(".remove-photo").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".gallery-item").dataset.id;
        state.photos = state.photos.filter((p) => p.id !== id);
        saveState();
        renderGallery();
        updateStorageHint();
      });
    });
    grid.querySelectorAll("textarea[data-photo]").forEach((ta) => {
      ta.addEventListener("input", () => {
        const id = ta.dataset.photo;
        const ph = state.photos.find((p) => p.id === id);
        if (ph) ph.caption = ta.value;
        debouncedSave();
      });
    });

    updateStorageHint(total, hint);
  }

  function openLightbox(dataUrl, caption) {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    const cap = document.getElementById("lightbox-caption");
    if (!lb || !img || !cap) return;
    img.src = dataUrl;
    img.alt = caption ? String(caption).slice(0, 200) : "Gallery photo";
    const t = caption && String(caption).trim();
    if (t) {
      cap.textContent = t;
      cap.hidden = false;
    } else {
      cap.textContent = "";
      cap.hidden = true;
    }
    lb.hidden = false;
    document.body.classList.add("lightbox-open");
    lb.querySelector(".lightbox-close")?.focus();
  }

  function closeLightbox() {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    if (!lb) return;
    lb.hidden = true;
    if (img) img.src = "";
    document.body.classList.remove("lightbox-open");
  }

  function wireLightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb || lb.dataset.wired === "1") return;
    lb.dataset.wired = "1";

    lb.querySelector(".lightbox-backdrop")?.addEventListener("click", closeLightbox);
    lb.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lb.hidden) {
        e.preventDefault();
        closeLightbox();
      }
    });

    const grid = document.getElementById("gallery-grid");
    grid?.addEventListener("click", (e) => {
      const thumb = e.target.closest(".gallery-thumb");
      if (!thumb || e.target.closest(".remove-photo")) return;
      const fig = thumb.closest(".gallery-item");
      const id = fig?.dataset.id;
      const ph = state.photos.find((p) => p.id === id);
      if (ph?.dataUrl) openLightbox(ph.dataUrl, ph.caption);
    });
  }

  let saveTimer;
  function debouncedSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveState(), 400);
  }

  function updateStorageHint(computedTotal, hintEl) {
    const hint = hintEl || document.getElementById("storage-hint");
    let total = computedTotal;
    if (total === undefined) {
      total = 0;
      state.photos.forEach((ph) => {
        total += approxBytesFromDataUrl(ph.dataUrl || "");
      });
    }
    const mb = (total / (1024 * 1024)).toFixed(2);
    hint.textContent =
      state.photos.length === 0
        ? "No photos yet. Local-only storage."
        : `~${mb} MB local · export for backup.`;
  }

  function addPhotos(files) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    let pending = list.length;
    if (!pending) return;
    const countBefore = state.photos.length;
    list.forEach((file) => {
      resizeImage(file, (err, dataUrl) => {
        pending--;
        if (!err && dataUrl) {
          state.photos.push({ id: uid(), dataUrl, caption: "" });
        }
        if (pending === 0) {
          try {
            saveState();
          } catch {
            state.photos.length = countBefore;
            alert("Storage full—delete photos or export backup, then clear gallery.");
          }
          renderGallery();
          updateHeroStats();
        }
      });
    });
  }

  /* --- Diary (dated notes & ideas) --- */
  function formatDiaryDayHeading(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Unknown date";
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatDiaryTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function localDayKey(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "unknown";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  let diaryPersistTimer;
  function debouncedDiaryPersist() {
    clearTimeout(diaryPersistTimer);
    diaryPersistTimer = setTimeout(() => {
      saveState();
    }, 400);
  }

  /** Notes first (newest first), then ideas (newest first). */
  function diaryDisplayOrder(entries) {
    const byNewest = (a, b) => new Date(b.when) - new Date(a.when);
    const notes = entries.filter((e) => e.kind !== "idea").sort(byNewest);
    const ideas = entries.filter((e) => e.kind === "idea").sort(byNewest);
    return [...notes, ...ideas];
  }

  function renderDiary() {
    const stream = document.getElementById("diary-stream");
    if (!stream) return;

    const sorted = diaryDisplayOrder(state.diary);

    stream.innerHTML = "";
    if (sorted.length === 0) {
      stream.innerHTML =
        '<p class="diary-empty">No entries yet. Use the form above—timestamp on Add.</p>';
    } else {
      let lastKey = "";
      sorted.forEach((entry) => {
        const key = localDayKey(entry.when);
        if (key !== lastKey) {
          lastKey = key;
          const h = document.createElement("h4");
          h.className = "diary-day-heading";
          h.textContent = formatDiaryDayHeading(entry.when);
          stream.appendChild(h);
        }
        const row = document.createElement("article");
        row.className = "diary-entry";
        row.dataset.id = entry.id;
        const isIdea = entry.kind === "idea";
        row.innerHTML = `<div class="diary-entry-meta">
            <time datetime="${escapeAttr(entry.when)}" title="Original timestamp (edits don’t change this)">${escapeHtml(formatDiaryTime(entry.when))}</time>
            <label class="diary-kind-label"><span class="sr-only">Type</span>
              <select class="diary-entry-kind-select" aria-label="Note or idea">
                <option value="note"${isIdea ? "" : " selected"}>Note</option>
                <option value="idea"${isIdea ? " selected" : ""}>Idea</option>
              </select>
            </label>
            <button type="button" class="diary-entry-remove" aria-label="Remove entry">×</button>
          </div>
          <textarea class="diary-entry-edit" rows="4" aria-label="Entry text" placeholder="Edit text…">${escapeHtml(entry.text)}</textarea>`;
        stream.appendChild(row);
      });

      stream.querySelectorAll(".diary-entry-remove").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.closest(".diary-entry").dataset.id;
          state.diary = state.diary.filter((e) => e.id !== id);
          saveState();
          renderDiary();
        });
      });

      stream.querySelectorAll("textarea.diary-entry-edit").forEach((ta) => {
        ta.addEventListener("input", () => {
          const id = ta.closest(".diary-entry").dataset.id;
          const e = state.diary.find((x) => x.id === id);
          if (e) e.text = ta.value;
          debouncedDiaryPersist();
        });
      });

      stream.querySelectorAll("select.diary-entry-kind-select").forEach((sel) => {
        sel.addEventListener("change", () => {
          const id = sel.closest(".diary-entry").dataset.id;
          const e = state.diary.find((x) => x.id === id);
          if (e) e.kind = sel.value === "idea" ? "idea" : "note";
          saveState();
          renderDiary();
        });
      });
    }
  }

  function wireNotes() {
    const compose = document.getElementById("diary-compose");
    const addBtn = document.getElementById("diary-add");
    const ind = document.getElementById("diary-saved");

    addBtn.addEventListener("click", () => {
      const text = String(compose.value || "").trim();
      if (!text) return;
      const kind =
        document.querySelector('input[name="diary-kind"]:checked')?.value === "idea" ? "idea" : "note";
      state.diary.push({
        id: uid(),
        when: new Date().toISOString(),
        text,
        kind,
      });
      compose.value = "";
      saveState();
      renderDiary();
      ind.textContent = "Saved";
      ind.classList.add("visible");
      clearTimeout(wireNotes._t);
      wireNotes._t = setTimeout(() => ind.classList.remove("visible"), 1500);
    });

    compose.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        addBtn.click();
      }
    });

    renderDiary();
  }

  /* --- Links --- */
  function renderLinks() {
    const list = document.getElementById("links-list");
    list.innerHTML = "";
    state.links.forEach((link) => {
      const li = document.createElement("li");
      const title = link.title || link.url;
      li.innerHTML = `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>
        <button type="button" class="remove-link" data-link="${link.id}" aria-label="Remove">×</button>`;
      list.appendChild(li);
    });
    list.querySelectorAll(".remove-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.links = state.links.filter((l) => l.id !== btn.dataset.link);
        saveState();
        renderLinks();
      });
    });
  }

  document.getElementById("link-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let url = String(fd.get("url") || "").trim();
    const title = String(fd.get("title") || "").trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    state.links.push({ id: uid(), url, title });
    saveState();
    e.target.reset();
    renderLinks();
  });

  /* --- Export / Import --- */
  document.getElementById("btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "smart-glove-tracker-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("import-file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed && typeof parsed === "object") {
          const base = defaultState();
          state = {
            ...base,
            ...parsed,
            tasks: { ...base.tasks, ...parsed.tasks },
            shop: { ...base.shop, ...parsed.shop },
            shopExtra: Array.isArray(parsed.shopExtra)
              ? parsed.shopExtra.map(normalizeShopExtraRow).filter(Boolean)
              : base.shopExtra,
            challenges: normalizeChallenges(parsed.challenges),
            photos: Array.isArray(parsed.photos) ? parsed.photos : base.photos,
            diary: normalizeDiary(parsed.diary, parsed.notes),
            budgetSpent: typeof parsed.budgetSpent === "number" ? parsed.budgetSpent : base.budgetSpent,
            currency:
              parsed.currency === "usd" || parsed.currency === "ntd" ? parsed.currency : "usd",
            links: Array.isArray(parsed.links) ? parsed.links : base.links,
            timelineStart:
              typeof parsed.timelineStart === "string"
                ? parsed.timelineStart
                : base.timelineStart,
            shopRemovedIds: normalizeShopRemovedIds(parsed.shopRemovedIds ?? base.shopRemovedIds),
            shopOverrides: normalizeShopOverrides(parsed.shopOverrides ?? base.shopOverrides),
            phaseCompletedAt: normalizePhaseCompletedAt(
              parsed.phaseCompletedAt ?? base.phaseCompletedAt
            ),
          };
          delete state.fxUsdToNtd;
          delete state.prototypeEmbedUrl;
          reconcileShopKeys(state);
          syncPhaseCompletionDates();
          saveState();
          init();
        }
      } catch {
        alert("Invalid JSON backup.");
      }
      e.target.value = "";
    };
    reader.readAsText(f);
  });

  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  /* --- Drop zone --- */
  function wireDropZone() {
    const dz = document.getElementById("drop-zone");
    ["dragenter", "dragover"].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        dz.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      dz.addEventListener(ev, (e) => {
        e.preventDefault();
        dz.classList.remove("dragover");
      });
    });
    dz.addEventListener("drop", (e) => {
      addPhotos(e.dataTransfer.files);
    });
  }

  document.getElementById("photo-input").addEventListener("change", (e) => {
    addPhotos(e.target.files);
    e.target.value = "";
  });

  function init() {
    updateDeadlineUI();
    renderTimeline();
    wireBudget();
    wireShopAdd();
    wireBomTableDelegation();
    wireCurrency();
    renderChallenges();
    wireChallenges();
    wireLightbox();
    renderGallery();
    wireNotes();
    renderLinks();
    wireDropZone();
  }

  init();
  setInterval(updateDeadlineUI, 60000);
  setInterval(renderTimeline, 3600000);
})();
