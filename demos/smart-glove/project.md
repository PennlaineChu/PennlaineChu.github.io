# Smart Magnifying Glove

Wearable magnifier for presbyopia: fingertip camera, wrist ESP32 + OLED, gesture-first UX.

## Repository layout

| Path | Role |
|------|------|
| [`concept.html`](concept.html) | Static overview: problem, vision, system diagram, gestures, roadmap, future ideas |
| [`index.html`](index.html) | **Prototype 1 lab** — checklist, BOM, problems, budget, diary, gallery, links; data in `localStorage` |
| [`css/styles.css`](css/styles.css) | Shared styles |
| [`js/shell.js`](js/shell.js) | Sidebar: one section per view (`#overview`, `#timeline`, …) |
| [`js/app.js`](js/app.js) | Lab logic and persistence |
| **`project.md`** | Long-form reference (wire tables, markdown BOM, offline notes) |

Open `index.html` in a browser for the lab. Use **Export** there for JSON backup. High-level narrative duplicates **`concept.html`** in places below; treat the lab + concept pages as the primary UI.

---

## Reference map (this document)

| Section | Use |
|---------|-----|
| Quick overview | Phase table snapshot (lab timeline is authoritative for tasks) |
| The Big Idea | Vision + architecture ASCII |
| Wire map | Connector and bus detail |
| Timeline & phases | Expanded phase notes |
| Shopping list | Printable BOM-style tables |
| Technical challenges | Static risk list (editable table lives in the lab) |
| Gallery / notes / summary | Markdown placeholders |

---

## 📋 Quick Overview

| Status | Phase | Progress |
|--------|-------|----------|
| 🟡 Planning | Phase 0 | ████████░░ 80% |
| ⬜ Not Started | Phase 1: Proof of Concept | ░░░░░░░░░░ 0% |
| ⬜ Not Started | Phase 2: Sensor Integration | ░░░░░░░░░░ 0% |
| ⬜ Not Started | Phase 3: Wearable Integration | ░░░░░░░░░░ 0% |
| ⬜ Not Started | Phase 4: Software & Tuning | ░░░░░░░░░░ 0% |

---

## 🎯 The Big Idea

### Vision
Build a smart glove that helps people with presbyopia (age-related farsightedness) read small text by providing instant magnification through a wrist-mounted OLED display.

### Core Features
- **Pinch to Capture**: Thumb + index finger pinch captures and magnifies text
- **Digital Zoom**: 2x → 4x → 8x magnification levels
- **Gesture Controls**: Natural hand gestures for all operations
- **Portable**: Entire system fits on a glove, no external devices needed

### Technical Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        SMART GLOVE SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │ OV2640       │◄───────│ ESP32-S3     │                     │
│   │ Camera       │  CSI    │ Main MCU     │                     │
│   │ (Fingertip)  │         │ (Wrist)      │                     │
│   └──────────────┘         └──────┬───────┘                     │
│                                    │                            │
│   ┌──────────────┐                │     ┌──────────────┐       │
│   │ Flex ×5      │───────────────►│     │ 1.69" OLED   │       │
│   │ (ADC1, S3)   │    ADC1         │────►│ 240x280      │       │
│   └──────────────┘                │     │ (Wrist)      │       │
│                                   │     └──────────────┘       │
│   ┌──────────────┐                │                            │
│   │ MPU6050      │───────────────►│                            │
│   │ Gyroscope    │    I2C         │                            │
│   └──────────────┘                │                            │
│                                   │                            │
│   ┌──────────────┐         ┌─────┴──────┐                      │
│   │ 500mAh LiPo  │────────►│ TP4056     │                      │
│   │ Battery      │  Power   │ Charger    │                      │
│   └──────────────┘         └────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Wire map — what each link is (matches sketch above)

Think in **three layers**: (1) **power** (battery → charger → ESP32 & modules), (2) **digital buses** (SPI / I2C / CSI), (3) **analog** (flex → ADC). **Connectors** (JST, FPC) are only how you *physically* break out those signals along the glove.

#### Power (always first to get right)

| From | To | What the wires are | Typical connector |
|------|-----|-------------------|-------------------|
| **LiPo** +/− | **TP4056** `B+` / `B−` | Raw cell power; **red = +**, **black = −** | Often **solder** your leads, or **JST-PH 2.0 mm** pigtail on the pack |
| **TP4056** `OUT+` / `OUT−` (or `Vout`) | **ESP32 board** `5V` or `VIN`, **GND** | ~4.2 V down to ~3 V as battery discharges; board’s regulator makes **3.3 V** for chips | Wires or pads on your PCB |
| **3.3 V** & **GND** (from ESP32/PCB) | **OLED**, **MPU6050**, **camera module** (if it needs 3.3 V) | Same two rails power every small module | Short dupont or PCB traces |

*You do **not** use **JST SH 1.0 mm** for battery—that size is for **flex sensor** pigtails on a tight wrist board.*

#### Camera (OV2640) — “CSI” on the sketch

| Role | Meaning |
|------|--------|
| **CSI / DVP** | A **parallel camera bus**: many data lines + clock + sync + **I2C** for configuration + **power/ground**. |
| **Physical form** | Usually a **flat FPC cable** (ribbon) from the camera board to the ESP32-S3 dev kit or your PCB—not loose colored jumper wires for everything. |
| **I2C part** | Same idea as MPU6050: **SDA**, **SCL**, **3.3 V**, **GND** to talk to the sensor registers (often shared bus with MPU6050 if pins allow). |

#### OLED (ST7789) — “SPI” on the sketch

| Signal (names vary by module) | Purpose |
|------------------------------|--------|
| **VCC** / **3.3 V**, **GND** | Power |
| **SCK** (clock) | SPI clock from ESP32 |
| **MOSI** (data out) | Pixel / command data to the display |
| **CS** | Chip select (which device on the bus) |
| **DC** / **D/C** | Data vs command |
| **RST** | Reset (sometimes tied on module) |
| **BLK** / **LED** | Backlight (often PWM or tied high) |

All of these are **short wires or PCB traces** from ESP32 GPIOs to the display module.

#### MPU6050 — “I2C” on the sketch

| Signal | Purpose |
|--------|--------|
| **VCC** (3.3 V), **GND** | Power |
| **SDA**, **SCL** | I2C data and clock—**shared** with camera SCCB if addresses differ. On **ESP32-S3**, pick pins **outside GPIO26–32**; bench plan uses **GPIO8** (SDA) / **GPIO9** (SCL) for **MPU6050** (see table below). |

#### Flex sensors (5) — “ADC1” on the sketch

| Electrical | What you wire |
|------------|----------------|
| Each flex sensor is roughly a **variable resistor** (resistance changes when bent). | You form a **voltage divider** with a fixed resistor: one side to **3.3 V**, other to **GND**, **middle tap** → **ESP32-S3 ADC1** pin (see bench table—**not** GPIO32–35 on typical S3 modules). |
| **Mechanical** | Wires run **finger → wrist**. **JST SH 1.0 mm** harness at the wrist (pin count matches your PCB—often **5** channels + **GND** / returns). |

No SPI/I2C here—just **analog voltages** the firmware reads.

#### Optional fingertip LEDs

| From | To |
|------|-----|
| **GPIO** (through resistor) or **3.3 V** via FET | LED **+**; LED **−** to **GND** |

---

### Bench pin plan (your ESP32 wiring)

*Concrete hookup you’re using; sanity-check against the **ESP32-S3** pinout you actually soldered (ADC-capable pins differ from classic ESP32).*

#### Validation (ESP32-S3 — read this first)

This plan was **not** fully validated before it was written into the doc; below is a check against Espressif’s **ESP32-S3** GPIO summary ([GPIO & RTC GPIO — ESP32-S3](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/gpio.html)):

| Part of plan | Verdict on a typical S3 module (onboard flash) |
|--------------|--------------------------------------------------|
| **LiPo → TP4056 → board `5V`/`VIN` → 3.3 V rail** | **OK in principle** — still confirm your board accepts that input, polarity, and that total current (camera + radio + OLED + IMU) is within what the regulator and battery can supply. |
| **I2C on GPIO26 / GPIO27** | **Not recommended** — on S3, **GPIO26–GPIO32** are tied to **SPI flash / PSRAM**. Your bench choice **GPIO8 (SDA) / GPIO9 (SCL)** for **MPU6050** is **outside** that range and is a normal S3 pick—still **confirm** the **camera FPC** does not need those nets. |
| **Flex ADC on GPIO32–35 (and 39)** | **GPIO32–35 are in the same flash/PSRAM group — avoid.** Bench flex: **GPIO1, 2, 4, 5, 6** (all **ADC1** on S3). **Avoid GPIO0 and GPIO3** (strapping). **Do not** reuse **GPIO8/9** (I²C) or **GPIO11, 15–18** (OLED SPI) for analog. |
| **OLED SPI (GPIO11, 15–18)** | **Fine** as digital SPI/control. **GPIO11** is **ADC2_CH0** on S3—used here as **MOSI**, not ADC. **Confirm** your **camera FPC** does not conflict with **11, 15, 16, 17, 18**. |

**Rookie takeaway:** treat the tables below as **intent**, not as “safe to wire blindly” on ESP32-S3 until **GPIO26–32 are vacated** and **flex analog inputs move to ADC1 (GPIO1–10)** with a **single board-specific** pinout check.

**Power chain**

1. **LiPo** → **TP4056** `B+` / `B−`
2. **TP4056** `OUT+` / `OUT−` → **ESP32** `5V` (or `VIN`) + **GND**
3. **ESP32** regulated **3.3 V** + **GND** → **OLED**, **MPU6050**, **camera** (if the module needs 3.3 V), and the **high side** of each flex divider (below)

**Camera**

- **FPC / camera connector** → ESP32-S3 **camera port** (parallel CSI/DVP + I2C for the sensor, per your board—**not** the same as a single “plug” unless your dev kit exposes the full ribbon interface).

**I2C (MPU6050 + camera config, if shared)**

*On **ESP32-S3**, **do not** use GPIO26/GPIO27 for I2C on typical modules — those lines are for internal flash. **Bench assignment (your choice):***

| ESP32 | To |
|--------|-----|
| **GPIO8** | **MPU6050 SDA** (+ camera **SDA** if both share one I²C bus—different 7-bit addresses) |
| **GPIO9** | **MPU6050 SCL** (+ camera **SCL** if shared) |
| **3.3 V**, **GND** | MPU6050 power |

*Add **~4.7 kΩ pull-ups** from **SDA** and **SCL** to **3.3 V** if your module or bus does not already have them. **GPIO8/GPIO9** are also **ADC1** pads on S3—here they are used as **digital I²C**, so **do not** wire flex analog inputs to the same pins. **Verify** your **camera FPC / dev kit** does not reserve GPIO8 or GPIO9.*

*(Invensense part is **MPU-6050**; there is no common **MPU-6090**—if your board says 9250/6500, the same SDA/SCL wiring applies.)*

**OLED (ST7789 SPI)** — *Module pad **SDA** = **SPI MOSI** (here **GPIO11**); **RES** = reset (**GPIO15**).*

| ESP32 | To OLED (typical names) |
|--------|-------------------------|
| **3.3 V** | **VCC** |
| **GND** | **GND** |
| **GPIO18** | **SCL / SCK** (SPI clock) |
| **GPIO11** | **MOSI** / mislabeled **SDA** (SPI data → display) |
| **GPIO17** | **CS** |
| **GPIO16** | **DC** / **D/C** (data/command) |
| **GPIO15** | **RES** / **RST** (reset) |
| *optional* | **BLK** / **LED** → 3.3 V or a PWM GPIO via transistor, per module |

**Flex sensors — five dividers, five ADC pins**

For **each** of the five sensors, use a **voltage divider**: one side of the flex **toward 3.3 V**, the other **through a fixed resistor to GND**, **ADC on the middle node** (same idea as the table above—tune **R** so bent/straight spans a good part of 0–3.3 V without saturating).

*Use **ADC1** pins for flex; skip strapping (**GPIO0**, **GPIO3**), **I²C** (**GPIO8**, **GPIO9**), and **OLED SPI** (**GPIO11**, **GPIO15–18**). **Bench assignment:***

| Channel | ADC GPIO | Notes |
|---------|-----------|--------|
| 1 | **GPIO1** | ADC1_CH0 |
| 2 | **GPIO2** | ADC1_CH1 |
| 3 | **GPIO4** | ADC1_CH3 |
| 4 | **GPIO5** | ADC1_CH4 |
| 5 | **GPIO6** | ADC1_CH5 |

*If the camera or USB blocks any of these, swap to other free **ADC1** pins in **GPIO1–10** — do not use **GPIO26–35** for analog on a standard S3 module.*

All divider **low sides** return to **common GND** with the ESP32.

*Gesture docs elsewhere still describe **four** flex channels; if the fifth is thumb, spare, or redundant, align **firmware** with this hardware.*

---

#### One-line cheat sheet (same as blocks in the sketch)

```
LiPo ± ──► TP4056 ──► 5V/VIN ──► ESP32 regulator ──► 3.3V & GND ──► OLED, MPU6050, camera (as needed)

ESP32 ── SPI (18 SCK, 11 MOSI, 17 CS, 16 DC, 15 RES) ──► OLED  ← confirm vs camera pinout
ESP32 ── I2C (8 SDA, 9 SCL; not 26/27) ──► MPU6050 (+ camera SCCB if shared)
ESP32 ── CSI / DVP + FPC ──► OV2640
ESP32 ── ADC1 (1, 2, 4, 5, 6) ──► flex ×5 dividers (JST SH harness at wrist)
```

---

## 📅 Timeline & Phases

### Phase 0: Planning & Procurement (Current)
**Duration**: 1 week
- [x] Research components and feasibility
- [x] Create project tracker
- [ ] Order all components
- [ ] Set up development environment

**Notes**:
<!-- Add your notes here -->

---

### Phase 1: Proof of Concept (Weeks 1-2)
**Goal**: Verify camera-to-OLED pipeline works

**Tasks**:
- [ ] Set up ESP32-S3 development board
- [ ] Connect OV2640 camera module
- [ ] Initialize 1.69" OLED display
- [ ] Implement basic camera → display pipeline
- [ ] Test frame rates and latency

**Components Needed**:
| Component | Part | Quantity | Ordered | Received |
|-----------|------|----------|---------|----------|
| MCU | ESP32-S3-DevKitC-1 | 1 | ⬜ | ⬜ |
| Camera | OV2640 | 1 | ⬜ | ⬜ |
| OLED | 1.69" 240x280 ST7789 | 1 | ⬜ | ⬜ |

**Photos**:
<!-- Drag and drop images here -->

**Notes**:
<!-- Add your notes here -->

---

### Phase 2: Sensor Integration (Weeks 3-4)
**Goal**: Add flex sensors and gesture logic

**Tasks**:
- [ ] Connect flex sensors to ADC pins
- [ ] Implement ADC smoothing (moving average)
- [ ] Calibrate sensors (baseline detection)
- [ ] Build gesture state machine
- [ ] Map gestures to actions

**Gesture Mapping**:

| Finger State | Action |
|-------------|--------|
| All fingers curled | Sleep mode (OLED off, camera off) |
| Thumb + Index pinch | Capture frame & display magnified |
| Thumb + Middle pinch | Zoom in (2x → 4x → 8x) |
| Thumb + Ring pinch | Toggle LED illumination |
| Open palm | Live preview mode |

**Components Needed**:
| Component | Part | Quantity | Ordered | Received |
|-----------|------|----------|---------|----------|
| Flex Sensors | Spectra Symbol 2.2" | 4 | ⬜ | ⬜ |
| LEDs | 0603 SMD White | 4 | ⬜ | ⬜ |

**Photos**:
<!-- Drag and drop images here -->

**Notes**:
<!-- Add your notes here -->

---

### Phase 3: Wearable Integration (Weeks 5-8)
**Goal**: PCB design and glove integration

**Tasks**:
- [ ] Design main PCB (KiCad/EasyEDA)
- [ ] Design fingertip camera board
- [ ] Order PCBs from JLCPCB
- [ ] Source compression glove
- [ ] 3D print camera housing (TPU)
- [ ] Sew flex sensors into glove
- [ ] Assemble and test

**PCB Specifications**:

**Main Board (Wrist-mounted, 40mm x 35mm)**:
```
┌─────────────────────────┐
│  ESP32-S3-WROOM-1       │
│  ┌─────────────────┐    │
│  │                 │    │
│  └─────────────────┘    │
│      ┌───┐ ┌───┐        │
│      │CAM│ │OLED SPI    │
│      └───┘ └───┘        │
│  ┌─────────────────┐    │
│  │  Flex harness   │    │
│  │  connectors (5) │    │
│  └─────────────────┘    │
│  [LiPo charger]  [USB-C]│
└─────────────────────────┘
```

**Fingertip Board (10mm x 8mm)**:
- Camera connector + FPC cable pad
- 2x SMD LEDs for illumination

**Mechanical Parts**:
| Part | Approach |
|------|----------|
| Glove Base | Medical-grade compression glove or cycling glove |
| Camera Mount | 3D-printed TPU clip at index fingertip (removable) |
| OLED Mount | Velcro strap on back of hand, angled 15° toward user |
| Flex Sensors | Sewn into glove fingers, running to wrist PCB |
| Battery | 1S LiPo in wrist strap (bare leads or pigtailed—see shopping notes) |

**Components Needed**:
| Component | Part | Quantity | Ordered | Received |
|-----------|------|----------|---------|----------|
| Battery | 1S LiPo + PCM, bare red/black wires (≈503035 size—**verify real mAh**; inflated labels are common) | 1 in build (extras OK) | ⬜ | ⬜ |
| Charger | TP4056 + protection | 1 | ⬜ | ⬜ |
| Battery connector | **JST-PH 2.0 mm** pigtail pair (male+female) **or** board-mounted 2-pin JST-PH—solder **to cell leads** for unplug/replace | 1 set | ⬜ | ⬜ |
| Flex connectors | **4-pin JST SH 1.0 mm** (wrist PCB ↔ each finger flex harness—not for battery) | 5 | ⬜ | ⬜ |
| Glove | Copper Fit compression glove | 1 | ⬜ | ⬜ |

**Photos**:
<!-- Drag and drop images here -->

**Notes**:
<!-- Add your notes here -->

---

### Phase 4: Software & Tuning (Weeks 9-10)
**Goal**: Optimize performance and add advanced features

**Tasks**:
- [ ] Implement digital zoom (bicubic resize)
- [ ] Add focus peaking (edge highlight)
- [ ] Optimize for 15fps live preview
- [ ] Implement deep sleep for power saving
- [ ] Optional: Add OCR with ESP-WHO
- [ ] Final testing and calibration

**Software Features**:
1. Camera capture → resize (bicubic) → display to OLED
2. Flex sensor ADC smoothing (moving average)
3. Gesture state machine (debounced transitions)
4. Focus peaking (edge highlight for sharpness)
5. Optional: OCR with ESP-WHO library

**Performance Targets**:
- 15fps live preview
- <100ms latency for capture mode
- 2x/4x/8x digital zoom via windowed crop

**Photos**:
<!-- Drag and drop images here -->

**Notes**:
<!-- Add your notes here -->

---

## 🛒 Shopping List

**Currency:** Costs in the tables below are **approximate USD**. The **project tracker website** shows amounts with **≈** and can switch **NTD / USD** using a fixed **1 USD = 30 NTD** for estimates and for converting your logged spend.

### Electronics

| Item | Specific Part | Est. Cost | Source | Ordered | Received |
|------|--------------|-----------|--------|---------|----------|
| MCU Module | ESP32-S3-WROOM-1-N16R8 | $6 | AliExpress/DigiKey | ⬜ | ⬜ |
| Camera | OV2640 (with 24pin FPC) | $4 | AliExpress | ⬜ | ⬜ |
| OLED | 1.69" 240x280 ST7789 SPI | $8 | AliExpress | ⬜ | ⬜ |
| Flex Sensors | Spectra Symbol 2.2" (4x) | $20 | Adafruit/Amazon | ⬜ | ⬜ |
| Battery | 1S LiPo + protection, **bare wires** (cells on hand—treat **~500 mAh real** if same volume as 503035 until tested) | — | — | ⬜ | ⬜ |
| Charger | TP4056 + protection | $1 | AliExpress | ⬜ | ⬜ |
| LEDs | 0603 SMD White LEDs (4x) | $1 | Any | ⬜ | ⬜ |
| Battery pigtail | **JST-PH 2.0 mm** 2-pin silicone pigtails (male + female) to solder to red/black pack leads | ~$3 | Amazon/AliExpress | ⬜ | ⬜ |
| Flex harness | **4-pin JST SH 1.0 mm** housings + contacts ×5 (finger flex leads to wrist—not battery) | ~$2 | DigiKey/LCSC | ⬜ | ⬜ |

**Shopping notes (battery & connectors)**  
- Your packs are **red + black only** → add your own **connector + strain relief** (heat shrink, knot, or clip).  
- **Battery:** use **JST-PH 2.0 mm** (common for small LiPos) to match many TP4056 boards; **JST-SH 1.0 mm** is for **flex/sensor** wiring on a tight wrist PCB.  
- **mAh:** if a cell **looks** 503035-sized, assume **~400–600 mAh real** until you charge-test; ignore 2000+ mAh claims unless volume clearly matches.

**Electronics Subtotal**: ~$45 (+ pigtails if needed)

### Mechanical

| Item | Recommendation | Cost | Ordered | Received |
|------|---------------|------|---------|----------|
| Glove | Copper Fit compression glove (open fingers) | $15 | ⬜ | ⬜ |
| Camera Housing | Custom TPU print (soft, finger-conforming) | $5 | ⬜ | ⬜ |
| PCB | JLCPCB 4-layer (recommended for compact design) | $20 | ⬜ | ⬜ |
| Cabling | 0.5mm pitch FPC cable (camera to wrist) | $3 | ⬜ | ⬜ |

**Mechanical Subtotal**: ~$43

### Tools & Supplies

| Item | Purpose | Cost | Ordered | Received |
|------|---------|------|---------|----------|
| Soldering iron | PCB assembly | $ | ⬜ | ⬜ |
| Heat shrink tubing | Wire management | $ | ⬜ | ⬜ |
| Conductive thread | Sewing flex sensors | $ | ⬜ | ⬜ |
| Velcro strips | Mounting | $ | ⬜ | ⬜ |

---

## 📊 Technical Challenges Tracker

| Challenge | Status | Solution | Notes |
|-----------|--------|----------|-------|
| Camera lag | 🔴 Open | Use ESP32-S3's DMA for camera→PSRAM→display pipeline; limit to QVGA (320x240) capture, upscaled to OLED | |
| Power drain | 🔴 Open | Camera draws 100mA+. Use deep sleep between captures; **~500 mAh class** cell → ~2–3 h active (scale with measured mAh) | |
| Flex sensor drift | 🔴 Open | Calibrate on startup (glove flat = baseline); temperature compensate | |
| Vibration blur | 🔴 Open | Add gyroscope (MPU6050) for motion detection; only capture when stable | |
| Fingertip bulk | 🔴 Open | Use 6mm micro camera module; accept that index finger will be less dexterous | |

**Legend**:
- 🔴 Open
- 🟡 In Progress
- 🟢 Resolved

---

## 📷 Photo Gallery

### Phase 0: Planning
<!-- Add photos here -->

### Phase 1: Proof of Concept
<!-- Add photos here -->

### Phase 2: Sensor Integration
<!-- Add photos here -->

### Phase 3: Wearable Integration
<!-- Add photos here -->

### Phase 4: Software & Tuning
<!-- Add photos here -->

---

## 📝 General Notes & Ideas

<!-- Freeform notes section - add anything here -->

### Ideas for Future Improvements
- [ ] Add haptic feedback for gesture confirmation
- [ ] Bluetooth connectivity to smartphone for image saving
- [ ] Voice commands integration
- [ ] Multiple color modes (high contrast, night mode)
- [ ] Machine learning for text detection

### Resources & Links
<!-- Add useful links here -->
- [ESP32-S3 Datasheet]()
- [OV2640 Camera Module Info]()
- [ST7789 Display Driver]()

### Contacts
<!-- Add supplier contacts, helpful people, etc. -->

---

## 📈 Progress Summary

**Total Tasks**: 0/50 completed (0%)

**Budget Spent**: $0 / ~$90

**Time Elapsed**: 0 weeks / 10 weeks planned

**Next Milestone**: Order all Phase 1 components

---

*Last Updated*: <!-- Add date -->

*Project Status*: 🟡 Planning Phase
