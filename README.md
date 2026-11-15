# Project Ysoriel — Space Mission Design & Orbital Operations Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Vanilla)-ff69b4?style=for-the-badge)](package.json)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](scripts/check.js)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Standalone-orange?style=for-the-badge)](dist/ysoriel-standalone.html)

**Design, manage, and simulate a complete space exploration mission — then protect Earth's orbits from space debris.**

[Quick Start](#-quick-start) • [Mission Design Studio](#-module-1-mission-design-studio) • [Orbital Guardian](#-module-2-orbital-guardian) • [Architecture](#-architecture--technology) • [REST API](#-rest-api-reference) • [Embedding Guide](#-embedding--deployment)

</div>

---

## 🛰️ Overview

**Project Ysoriel** is an interactive, full-stack aerospace simulation and mission design platform. It bridges fundamental aerospace engineering principles, orbital mechanics, and resource management into two interconnected modules:

1. **Mission Design Studio**: Conception, subsystem architecture, payload trade-offs, budget balancing, rocket equation $\Delta v$ optimization, and flight execution with real-time graded telemetry debriefs.
2. **Orbital Guardian**: Proximity operations, active debris removal (ADR), and orbital rendezvous in Low Earth Orbit (LEO) to mitigate the Kessler syndrome.
3. **Mission Operations Hub**: Unified command center with live system telemetry and a persistent global leaderboard.

Built with an uncompromising **zero-dependency philosophy**, Project Ysoriel runs entirely on standard Node.js built-ins and pure vanilla web standards (HTML5 Canvas, modern CSS, and ES6+ JavaScript).

---

## 🎮 Key Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PROJECT YSORIEL PLATFORM                        │
├──────────────────────────┬─────────────────────────┬───────────────────┤
│    MISSION DESIGN STUDIO │    ORBITAL GUARDIAN     │   OPERATIONS HUB  │
│  • Earth Climate Watch   │  • Active Debris Removal│ • Unified Nav     │
│  • Lunar Polar Prospector│  • 5 Hazard Targets     │ • Top Flights     │
│  • Mars Atmosphere Orbit │  • Canvas Proximity Ops │ • Health Telemetry│
│  • Tsiolkovsky Equations │  • Resource Management  │ • REST API Server │
└──────────────────────────┴─────────────────────────┴───────────────────┘
```

---

### 🚀 Module 1: Mission Design Studio

The **Mission Design Studio** challenges engineers to design a spacecraft from the ground up, satisfying strict real-world engineering constraints:

#### Available Mission Profiles
* **Earth Climate Watch**: Sun-synchronous low Earth orbit (SSO, 700 km altitude). Primary objective: monitoring polar ice, clouds, and atmospheric aerosols under steady solar flux.
* **Lunar Polar Prospector**: Lunar polar orbit (384,400 km transit, 1.3s light delay). Primary objective: mapping subsurface water ice and magnetic anomalies.
* **Mars Atmosphere Orbiter**: Interplanetary transfer ($\approx 225\text{M km}$ mean distance, 12.5-minute signal lag). Primary objective: atmospheric methane, dust storm characterization, and high-gain interplanetary communications.

#### Subsystem Architecture & Trade-Offs
* **Launch Vehicles**: Select from light (`Kestrel-L`), medium (`Aquila-M`), or heavy-lift (`Vanguard-H`) systems based on payload mass and destination injection capability.
* **Spacecraft Bus**: Structural bus scaling (`Micro`, `Standard`, `Robust`) dictates baseline thermal mass, structural reliability, and base electrical loads.
* **Propulsion Systems**:
  * *Chemical Monopropellant/Bipropellant*: High thrust, lower $I_{sp}$ (310 s), high propellant mass requirement.
  * *Next-Gen Ion Propulsion*: Ultra-high $I_{sp}$ (1,800 s), extreme fuel efficiency, high electrical power consumption ($450\text{ W}$), and spiral orbital insertion trajectory penalty ($+40\%\ \Delta v$).
* **Power & Solar Array Sizing**: Solar irradiance scaled automatically via the inverse-square law ($1.0\times$ at 1 AU down to $0.43\times$ at Mars orbit).
* **Telecommunications**: Antenna sizing (`UHF patch`, `X-band`, `Ka-band high-gain dish`) matched against ground station link budgets and payload data generation rates.
* **Scientific Payloads**: Multispectral Imagers, Synthetic Aperture Radar (SAR), Infrared Spectrometers, Fluxgate Magnetometers, Atmospheric Lidar, and Particle Analyzers.

#### Live Engineering Physics Engine
* **Tsiolkovsky Rocket Equation**:
  $$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_{\text{wet}}}{m_{\text{dry}}}\right)$$
* **Real-Time Constraint Validation**:
  * Mass margin ($\text{Wet Mass} \le \text{Launch Capacity}$)
  * Power balance ($\text{Solar Generation} \ge \text{Total System Electrical Load}$)
  * Velocity budget ($\Delta v_{\text{achieved}} \ge \Delta v_{\text{required}}$)
  * Data downlink saturation ($\text{Downlink Bandwidth} \ge \text{Instrument Data Production}$)
  * Fiscal feasibility ($\text{Hardware} + \text{Operations Cost} \le \text{Mission Budget}$)

---

### 🛡️ Module 2: Orbital Guardian

**Orbital Guardian** puts you in the pilot seat of an Active Debris Removal (ADR) space tug operating in a congested Low Earth Orbit.

* **Target Catalog**: Track 5 distinct orbital debris hazards:
  1. *Defunct Weather Satellite* (620 km, high collision risk)
  2. *Spent Upper-Stage Rocket Body* (810 km, massive explosive risk)
  3. *Fragment Cluster 7A* (430 km, hypervelocity kinetic risk)
  4. *Legacy Communications Satellite* (980 km, high orbit interference)
  5. *Payload Adapter Ring* (560 km, low-mass structural fragment)
* **Operational Phases**:
  * **Planning**: Target prioritization, delta-v assessment, and orbital trajectory analysis.
  * **Approach**: RCS thruster burns, phasing burns, and close-proximity navigation.
  * **Capture**: Timed robotic grapple arm interception within dynamic alignment windows.
  * **Disposal**: Controlled de-orbit into the atmosphere or boost to graveyard disposal orbit.
* **Fleet Management & Upgrades**:
  * Fuel % (Reaction Control System / propellant reserves)
  * Hull Integrity % (Micrometeorite & debris shield status)
  * Robotic Arm Mechanics % (Grapple readiness and capture latch success probability)
  * Autonomous Navigation System % (Target track precision and rendezvous drift error)
* **Multi-Layer Radar & Visualization**:
  * 2D Orbital Plane Top-Down Viewer
  * Kinetic Collision Risk Heatmap
  * Altitude & Inclination Radar Spectrum

---

### 🌐 Module 3: Flight Operations Hub

* **Unified Navigation**: Switch effortlessly between mission design, orbital defense, and flight analytics.
* **Top Flights Leaderboard**: Real-time persistent scoreboard tracking high scores, mission configurations, and flight success grades.

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: Version 18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **Zero npm packages needed**: No `npm install` required!

### 1. Clone the Repository
```bash
git clone https://github.com/SayanHalder607/Project-YSORIEL.git
cd Project-YSORIEL
```

### 2. Launch the Application
```bash
# Standard start
npm start

# Or directly with Node:
node server.js
```

### 3. Open in Browser
Navigate to **`http://localhost:8080`** in your browser.

---

## 🛠️ Developer Commands

| Command | Action |
| :--- | :--- |
| `npm start` | Starts the production HTTP server on port 8080 |
| `npm run dev` | Starts server with Node native `--watch` auto-reload on file edits |
| `npm test` | Runs static syntax and local reference integrity checks |
| `npm run check` | Alias for `npm test` |

### Antigravity & VS Code Integration
This repository includes a pre-configured `.vscode/launch.json`. Press <kbd>F5</kbd> in your IDE to start debugging and running Project Ysoriel in the integrated terminal with full source maps and breakpoints.

---

## 🏗️ Architecture & Technology

```
Project-YSORIEL/
├── .vscode/
│   └── launch.json          # IDE launch and debugger configuration
├── data/
│   └── .gitkeep             # Runtime storage for scores.json
├── dist/
│   └── ysoriel-standalone.html # Single-file, zero-backend distributable (77 KB)
├── public/
│   ├── css/
│   │   └── hub.css          # Core hub design system & responsive styling
│   ├── guardian/
│   │   ├── guardian.css     # Orbital Guardian UI & radar styling
│   │   ├── guardian.js      # Guardian game loop, Canvas 2D engine, & state
│   │   └── index.html       # Guardian view markup
│   ├── js/
│   │   └── hub.js           # Hub state machine, tab routing, leaderboard client
│   ├── studio/
│   │   ├── index.html       # Mission Design Studio view markup
│   │   ├── studio.css       # Studio telemetry & subsystem styling
│   │   └── studio.js        # Rocket physics engine & flight animator
│   ├── favicon.svg          # Vector mission insignia
│   └── index.html           # Main platform entry point
├── scripts/
│   └── check.js             # Static validator for JS syntax & DOM assets
├── .gitignore               # Standard ignore rules
├── LICENSE                  # MIT License
├── package.json             # Manifest, npm scripts & metadata
├── README.md                # Documentation & developer manual
└── server.js                # Zero-dependency HTTP static server + REST API
```

### 🔒 Enterprise Security Posture
The custom Node.js server (`server.js`) enforces strict HTTP security headers on all responses:
* **Content-Security-Policy (CSP)**: `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self';`
* **X-Content-Type-Options**: `nosniff` (prevents MIME confusion attacks)
* **Referrer-Policy**: `no-referrer`
* **Frame Ancestors Protection**: Restricted to `'self'` by default, configurable via `EMBED_ORIGINS`.
* **Payload Sanitation**: Request body limits enforced (max 2 KB), input validation, and safe atomic file persistence.

---

## 📡 REST API Reference

The backend provides a clean, zero-dependency REST API for telemetry and scores:

### 1. Health Telemetry
```http
GET /api/health
```
**Response (`200 OK`)**:
```json
{
  "status": "ok",
  "uptime": 142
}
```

### 2. Get Top Flights Leaderboard
```http
GET /api/scores
```
**Response (`200 OK`)**: Returns top 25 flights sorted by score descending:
```json
[
  {
    "game": "studio",
    "mission": "Mars Atmosphere Orbiter",
    "score": 96,
    "at": "2026-11-15T18:30:00.000Z"
  }
]
```

### 3. Submit Flight Score
```http
POST /api/scores
Content-Type: application/json
```
**Request Body**:
```json
{
  "game": "studio",
  "mission": "Earth Climate Watch",
  "score": 88
}
```
* Validation rules: `game` must be `"studio"`, `mission` must be one of the three recognized missions, `score` must be an integer between 0 and 100.

---

## ⚙️ Configuration & Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port for the HTTP server |
| `HOST` | `127.0.0.1` | Network interface to bind (`0.0.0.0` to expose on local network) |
| `EMBED_ORIGINS` | `""` | Space-separated list of origins permitted to iframe the platform |

*Example:*
```bash
PORT=3000 HOST=0.0.0.0 EMBED_ORIGINS="https://sites.google.com https://*.googleusercontent.com" npm start
```

---

## 📦 Embedding & Deployment

### Embedding into Google Sites / Notion / Canvas
1. **With Node Backend**: Deploy to any Node host (Railway, Render, AWS, Fly.io), set `EMBED_ORIGINS="https://sites.google.com"`, and use **Insert → Embed → By URL**.
2. **Offline / Standalone Single-File**: Open `dist/ysoriel-standalone.html` (which packs all HTML, CSS, and JS into a single 77 KB file) and paste into **Insert → Embed → Embed code**.

---

## 🧪 Testing & Verification

Run the built-in integrity suite to verify JavaScript syntax across all scripts and ensure every relative asset resolves properly:

```bash
npm test
```

Expected output:
```
Check passed: 8 files OK
```

---

## 📜 Educational Disclaimer

Project Ysoriel is an educational engineering simulation. The physical models (such as Tsiolkovsky delta-v, solar flux scaling, and orbital capture windows) use simplified equations designed for conceptual understanding, gameplay balance, and trade-off visualization. They should not be used as flight-critical orbital trajectory guidance.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for educational, personal, and commercial usage.

---

<div align="center">

Crafted with ❤️ by **[Sayan Halder](https://github.com/SayanHalder607)**

</div>
