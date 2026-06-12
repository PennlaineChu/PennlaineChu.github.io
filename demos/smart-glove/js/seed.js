/* Auto-seed: pre-loads Pennlaine's real tracker data on first visit. */
(function () {
  var KEY = "smart-glove-tracker-v1";
  try {
    if (localStorage.getItem(KEY)) return;
  } catch (e) { return; }
  var SEED = {
  "tasks": {
    "p0-1": true,
    "p0-2": true,
    "p0-3": false,
    "p0-4": false,
    "p1-1": false,
    "p1-2": false,
    "p1-3": false,
    "p1-4": false,
    "p1-5": false,
    "p2-1": false,
    "p2-2": false,
    "p2-3": false,
    "p2-4": false,
    "p2-5": false,
    "p3-1": false,
    "p3-2": false,
    "p3-3": false,
    "p3-4": false,
    "p3-5": false,
    "p3-6": false,
    "p3-7": false,
    "p4-1": false,
    "p4-2": false,
    "p4-3": false,
    "p4-4": false,
    "p4-5": false,
    "p4-6": false
  },
  "shop": {
    "e-mcu": {
      "ordered": true,
      "received": true
    },
    "e-cam": {
      "ordered": true,
      "received": false
    },
    "e-oled": {
      "ordered": true,
      "received": false
    },
    "e-flex": {
      "ordered": true,
      "received": false
    },
    "e-bat": {
      "ordered": true,
      "received": true
    },
    "e-chg": {
      "ordered": true,
      "received": true
    },
    "e-led": {
      "ordered": false,
      "received": false
    },
    "e-jstph": {
      "ordered": false,
      "received": false
    },
    "e-jst": {
      "ordered": false,
      "received": false
    },
    "m-glove": {
      "ordered": true,
      "received": false
    },
    "m-housing": {
      "ordered": false,
      "received": false
    },
    "m-pcb": {
      "ordered": false,
      "received": false
    },
    "m-fpc": {
      "ordered": true,
      "received": false
    },
    "t-solder": {
      "ordered": false,
      "received": false
    },
    "t-shrink": {
      "ordered": true,
      "received": false
    },
    "t-thread": {
      "ordered": false,
      "received": false
    },
    "t-velcro": {
      "ordered": false,
      "received": false
    },
    "x-318j32x99mntum7lr": {
      "ordered": true,
      "received": false
    },
    "x-x7xujswwfmntuoe3m": {
      "ordered": true,
      "received": false
    },
    "x-ublif046dmntupa32": {
      "ordered": true,
      "received": false
    },
    "x-prvarb47tmntuy9nq": {
      "ordered": true,
      "received": false
    }
  },
  "shopExtra": [
    {
      "id": "x-318j32x99mntum7lr",
      "cat": "electronics",
      "item": "Resistor",
      "part": "10k Ohm Resistor",
      "estUsd": 50,
      "userAdded": true
    },
    {
      "id": "x-x7xujswwfmntuoe3m",
      "cat": "tools",
      "item": "Wire stripper",
      "part": "20-30AWG Wire Stripper",
      "estUsd": 114,
      "userAdded": true
    },
    {
      "id": "x-ublif046dmntupa32",
      "cat": "electronics",
      "item": "Flex sensor",
      "part": "Spectra Symblo 4.5\"",
      "estUsd": 390,
      "userAdded": true
    },
    {
      "id": "x-prvarb47tmntuy9nq",
      "cat": "electronics",
      "item": "Breadboard",
      "part": "MB-102",
      "estUsd": 30,
      "userAdded": true
    }
  ],
  "challenges": [],
  "photos": [],
  "diary": [
    {
      "id": "x-yqorsriatmnr70p4t",
      "when": "2026-04-09T08:06:20.477Z",
      "text": "My idea went from a portable device on phone to a glove. I already bought ESP32-S3, 3 Lipo batteries (883759 is 3000mAh, 104050 2500mAh, and 103450 2000mAh, 2 breadboards, TP4056, and Jump wires.",
      "kind": "note"
    },
    {
      "id": "x-v6f7nol07mnt7m90q",
      "when": "2026-04-10T17:58:38.378Z",
      "text": "Drew the circuit graph in \"sketch & wires,\" learned the differences in pins, I2C, SPI. Buy materials tomorrow.",
      "kind": "note"
    }
  ],
  "budgetSpent": 860,
  "currency": "ntd",
  "links": [
    {
      "id": "l-esp32",
      "url": "https://www.espressif.com/en/products/socs/esp32-s3",
      "title": "ESP32-S3 overview"
    },
    {
      "id": "l-ov2640",
      "url": "https://github.com/espressif/esp32-camera",
      "title": "ESP32 camera driver"
    }
  ],
  "timelineStart": "2026-04-08",
  "shopRemovedIds": [],
  "shopOverrides": {
    "e-bat": {
      "item": "Battery",
      "part": "1S LiPo + PCM, bare red/black (≈503035—charge-test real mAh)",
      "estUsd": 100
    },
    "e-flex": {
      "item": "Flex sensors",
      "part": "Spectra Symbol 2.2\" ×4",
      "estUsd": 2240
    },
    "m-fpc": {
      "item": "Cabling",
      "part": "24AWG Wires ×50",
      "estUsd": 50
    },
    "t-shrink": {
      "item": "Heat shrink",
      "part": "Wire management",
      "estUsd": 82
    },
    "e-cam": {
      "item": "Camera",
      "part": "OV2640 (24-pin FPC)",
      "estUsd": 300
    },
    "e-mcu": {
      "item": "MCU module",
      "part": "ESP32-S3-WROOM-1-N16R8",
      "estUsd": null
    },
    "e-oled": {
      "item": "OLED",
      "part": "1.69\" 240×280 ST7789 SPI",
      "estUsd": 160
    },
    "m-glove": {
      "item": "Glove",
      "part": "Leather glove (open fingers)",
      "estUsd": 150
    }
  },
  "phaseCompletedAt": {}
};
  try { localStorage.setItem(KEY, JSON.stringify(SEED)); } catch (e) {}
})();
