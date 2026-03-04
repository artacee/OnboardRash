# OnboardRash — Hardware Report

This document describes the physical hardware implementation of the OnboardRash in-bus detection unit. It covers the components selected, how they are wired to the Raspberry Pi 5, the software libraries used and the rationale behind their selection, sensor placement on the vehicle, and the software environment deployed on the Pi.

---

## 1. Bill of Materials

| Component | Specification | Role |
|---|---|---|
| **Raspberry Pi 5 Model B** | 2 GB RAM, ARM Cortex-A76 | Core processing unit |
| **MicroSD Card** | 32+ GB, Class 10 A2 | OS + offline event queue storage |
| **Power Supply** | USB-C PD, 27W (5A) | Pi 5 requires 27W — use official Pi PSU or 27W PD charger |
| **MPU-6050 (GY-521 breakout)** | 3-axis accelerometer + gyroscope, I2C | Harsh brake / harsh acceleration / aggressive turn detection |
| **HC-SR04** | Ultrasonic distance sensor, 2 cm–400 cm | Close-overtaking detection on left side |
| **Resistors** | 1 kΩ and 2 kΩ (×1 each) | Voltage divider on HC-SR04 Echo line |
| **Half-size breadboard** | 400 tie points | Houses HC-SR04 wiring and voltage divider |
| **Jumper wires** | Male-to-Female (M2F) and Male-to-Male (M2M) | Breadboard ↔ Pi GPIO header |
| **USB Webcam** | 720p or 1080p, 30fps, USB plug-and-play | Forward-facing tailgating detection + video evidence capture |

---

## 2. System Architecture

```
  ┌──────────────────────┐   WiFi Hotspot (GPS @ 2 Hz)   ┌──────────────────────┐
  │  Driver's Phone      │ ─────────────────────────────► │  Raspberry Pi 5      │
  │  (Expo APK / Expo Go)│                                │  main_pi.py          │
  │                      │ ◄──── phone acts as gateway ── │  MPU-6050 + HC-SR04  │
  │                      │                                │  USB Webcam          │
  └──────────┬───────────┘                                └──────────┬───────────┘
             │ HTTP (REST + Socket.IO)                               │ HTTP POST /api/events
             ▼                                                       │ HTTP POST /api/buses/{id}/location
  ┌──────────────────────┐                                           │
  │  Flask Backend       │ ◄─────────────────────────────────────────┘
  │  (laptop)            │
  └──────────┬───────────┘
             │ Socket.IO (real-time broadcast)
             ▼
  ┌──────────────────────┐
  │  React Dashboard     │
  │  (browser)           │
  └──────────────────────┘
```

The phone creates a WiFi hotspot. The Pi connects to it, receives GPS from the phone app at port 8081, sends detected events to the Flask backend running on the connected laptop.

---

## 3. GPIO Pin Reference (Raspberry Pi 5)

```
Pi 5 40-pin GPIO Header (BCM numbering)

       3V3  [ 1] [ 2]  5V  ◄─── MPU-6050 VCC (Pin 4 used — see note)
  SDA / GPIO2  [ 3] [ 4]  5V  ◄─── MPU-6050 VCC (actual connection)
  SCL / GPIO3  [ 5] [ 6]  GND
       GPIO4  [ 7] [ 8]  GPIO14
         GND  [ 9] [10]  GPIO15 ◄─── MPU-6050 GND (Pin 9 used)
      GPIO17 [11] [12]  GPIO18
      GPIO27 [13] [14]  GND
      GPIO22 [15] [16]  GPIO23 ◄─── HC-SR04 TRIG (direct wire)
        3V3  [17] [18]  GPIO24 ◄─── HC-SR04 ECHO (via voltage divider)
      GPIO10 [19] [20]  GND
       GPIO9 [21] [22]  GPIO25
      GPIO11 [23] [24]  GPIO8
         GND [25] [26]  GPIO7
       GPIO0 [27] [28]  GPIO1
       GPIO5 [29] [30]  GND
       GPIO6 [31] [32]  GPIO12
      GPIO13 [33] [34]  GND
      GPIO19 [35] [36]  GPIO16
      GPIO26 [37] [38]  GPIO20
         GND [39] [40]  GPIO21
```

> **Note on MPU-6050 VCC:** Connected to **Pin 4 (5V)** rather than Pin 1 (3.3V). The GY-521 breakout board includes an onboard AMS1117 3.3V LDO regulator, so supplying 5V to the VCC pin on the breakout is safe and correct — the chip itself always receives 3.3V.

---

## 4. MPU-6050 (GY-521) Wiring

The MPU-6050 communicates via **I2C** on hardware bus 1 (pins 3 and 5).

### Physical Connections

| GY-521 Pin | Wire Colour (typical) | Raspberry Pi 5 Pin |
|---|---|---|
| **VCC** | Red | **Pin 4** (5V) |
| **GND** | Black | **Pin 9** (GND) |
| **SDA** | Blue / Green | **Pin 3** (GPIO 2 — I2C1 SDA) |
| **SCL** | Yellow | **Pin 5** (GPIO 3 — I2C1 SCL) |
| XDA | — | Not connected |
| XCL | — | Not connected |
| ADO | — | Not connected (leaves I2C address as 0x68) |
| INT | — | Not connected |

### Wiring Diagram

```
GY-521 Breakout          Raspberry Pi 5
  ┌─────────┐             40-pin header
  │ VCC  ───┼─────────────  Pin 4  (5V)
  │ GND  ───┼─────────────  Pin 9  (GND)
  │ SCL  ───┼─────────────  Pin 5  (GPIO 3 / I2C SCL)
  │ SDA  ───┼─────────────  Pin 3  (GPIO 2 / I2C SDA)
  │ XDA     │   [open]
  │ XCL     │   [open]
  │ ADO     │   [open]
  │ INT     │   [open]
  └─────────┘
```

### I2C Address

`0x68` (default — ADO pin is floating/low). Verified with `i2cdetect -y 1`.

---

## 5. HC-SR04 Ultrasonic Sensor Wiring

The HC-SR04 ECHO pin outputs **5V logic**, which would damage the Pi's 3.3V GPIO pins. A **voltage divider** (1 kΩ + 2 kΩ) is used on the ECHO line to step the voltage down to ~3.33V.

All connections are made via a **half-size breadboard** using M2F jumper wires to the Pi header.

### Power Rails (Breadboard)

| Source | Breadboard Rail |
|---|---|
| Pi **Pin 2** (5V) — M2F wire | **Positive (+) rail** |
| Pi **Pin 6** (GND) — M2F wire | **Negative (−) rail** |

### HC-SR04 to Breadboard

| HC-SR04 Pin | Breadboard Location |
|---|---|
| **VCC** | Positive (+) rail |
| **GND** | Negative (−) rail |
| **TRIG** | Blank column A (call it column 10) |
| **ECHO** | Blank column B (call it column 20) |

### Signal Wiring

```
TRIG path (direct):
  Breadboard column 10 ──── M2F jumper ──── Pi Pin 16 (GPIO 23)

ECHO path (voltage divider):
  HC-SR04 ECHO ──── column 20
  column 20    ──[1 kΩ resistor]──── column 25   (junction)
  column 25    ──── M2F jumper   ──── Pi Pin 18  (GPIO 24)   ← signal read here
  column 25    ──[2 kΩ resistor]──── Negative rail (GND)
```

### Voltage Divider Schematic

```
HC-SR04 ECHO (5V)
        │
     [1 kΩ]
        │
        ├──────────────── GPIO 24 (Pin 18) — reads ~3.33V
        │
     [2 kΩ]
        │
       GND

Output voltage = 5V × 2kΩ / (1kΩ + 2kΩ) = 3.33V  ✓  (within Pi 3.3V tolerance)
```

### Breadboard Layout (Top View)

```
       +  −   1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26
       │  │
 5V ──►+  │
GND ──►   −
       │  │
       │  │  [HC-SR04 sits off-board, wires come to breadboard]
       │  │
       +──┼────────────────────────────────────────────────── HC-SR04 VCC
          −────────────────────────────────────────────────── HC-SR04 GND
                                         TRIG ──────────────── col 10 ──── Pin 16 (GPIO23)
                                         ECHO ──────────────── col 20
                                                               col 20 ──[1kΩ]── col 25
                                                               col 25 ──────────────────── Pin 18 (GPIO24)
                                                               col 25 ──[2kΩ]── − rail (GND)
```

---

## 6. Complete Connection Summary

| What | From | To | Notes |
|---|---|---|---|
| MPU-6050 power | GY-521 VCC | Pi Pin 4 (5V) | On-board regulator steps to 3.3V |
| MPU-6050 ground | GY-521 GND | Pi Pin 9 (GND) | Direct |
| MPU-6050 data | GY-521 SDA | Pi Pin 3 (GPIO 2) | I2C bus 1 |
| MPU-6050 clock | GY-521 SCL | Pi Pin 5 (GPIO 3) | I2C bus 1 |
| HC-SR04 power | Pin 2 (5V) | Breadboard + rail | Shared with HC-SR04 VCC |
| HC-SR04 ground | Pin 6 (GND) | Breadboard − rail | Shared with HC-SR04 GND |
| HC-SR04 trigger | Pi Pin 16 (GPIO 23) | Breadboard col → HC-SR04 TRIG | Direct |
| HC-SR04 echo | HC-SR04 ECHO | Breadboard col → 1kΩ → junction | Junction tied to GPIO 24 and 2kΩ to GND |
| Echo signal read | Pi Pin 18 (GPIO 24) | Junction between 1kΩ and 2kΩ | Reads ~3.33V when ECHO high |
| Webcam data | USB Type-A plug | Pi USB 3.0 port (blue) | No GPIO — plug-and-play, appears as `/dev/video0` |

---

## 7. Python Libraries

### 7.1 Complete Dependency List

| Package | Version Constraint | Purpose | Used In |
|---|---|---|---|
| `smbus2` | `>=0.5.0` | I2C read/write for MPU-6050 | `sensors/mpu6050.py` |
| `rpi-lgpio` | `>=0.6` | GPIO control on **Pi 5** (drop-in `RPi.GPIO` replacement — see §7.2) | `sensors/ultrasonic.py` |
| `flask` | `>=3.0.0` | Local HTTP server that receives GPS from the phone app | `sensors/phone_gps.py` |
| `requests` | `>=2.31.0` | Send events and location updates to Flask backend | `main_pi.py`, `data_manager.py` |
| `python-dotenv` | `>=1.0.0` | Load `.env` configuration at startup | `main_pi.py` |
| `numpy` | `>=1.26.0` | Kalman filter matrix operations for sensor fusion | `sensors/sensor_fusion.py` |
| `opencv-python-headless` | `>=4.9.0` | Video frame capture + tailgating detection (contour / Haar cascade) | `sensors/camera.py`, `sensors/tailgating.py` |

### 7.2 Pi 5 GPIO Compatibility

The traditional `RPi.GPIO` library does not support the Raspberry Pi 5. The Pi 5 uses a new **RP1 I/O controller** with a different peripheral base address, causing `RPi.GPIO` to raise:

```
RuntimeError: Cannot determine SOC peripheral base address
```

`rpi-lgpio` was selected as a replacement. It is a thin wrapper around the `lgpio` C library that presents the **identical `RPi.GPIO` Python API**, meaning `sensors/ultrasonic.py` required no code changes — the import is intercepted transparently at runtime. The system packages `swig` (C↔Python binding generator) and `liblgpio-dev` (compiled shared library) are prerequisites for building the wheel.

### 7.3 `requirements.txt`

All Python dependencies are declared in `hardware/requirements.txt`:

```
smbus2>=0.5.0
rpi-lgpio>=0.6
flask>=3.0.0
requests>=2.31.0
python-dotenv>=1.0.0
numpy>=1.26.0
# Camera / tailgating detection — enable with ENABLE_CAMERA=true in .env
opencv-python-headless>=4.9.0
```

The following system-level packages are also required on Pi OS before installing the Python dependencies: `swig`, `liblgpio-dev`, `libatlas-base-dev`, `libhdf5-dev`, `libopencv-dev`, `v4l-utils`.

---

## 8. Key Sensor Modules

### 8.1 `sensors/mpu6050.py`

Reads raw 16-bit accelerometer registers over I2C and converts to g-force values.

| Parameter | Value |
|---|---|
| I2C bus | 1 (`/dev/i2c-1`) |
| I2C address | `0x68` |
| Accelerometer range | ±2g (register 0x1C, bits 3–4 = 00) |
| Raw-to-g conversion | `raw / 16384.0` |
| Sample rate | Controlled by `SAMPLE_RATE` in `.env` (default 0.1 s = 10 Hz) |

**v2.2 enhancements:**

- **Startup calibration** — Averages 50 samples at 50 Hz (~1 s) while stationary to determine per-axis zero-offset bias. X and Y offsets are subtracted from every subsequent reading; Z offset is compensated against expected +1 g gravity. If motion is detected during calibration (variance > 0.003), retries up to 5 times with a 1-second delay between attempts.
- **Placement validation** — After calibration, computes tilt angle from X/Y offsets. Warns the operator if the sensor is tilted >10°, upside-down (Z < 0.8 g), or rotated vs the forward axis. Prints clear fix instructions.
- **Burst I2C reads** — Reads all 6 accelerometer bytes (XH, XL, YH, YL, ZH, ZL) in a single `read_i2c_block_data()` call, preventing split-sample errors from sequential byte reads.
- **EMA filter** — Applies a single-pole Exponential Moving Average (α = 0.3) to each axis, filtering road vibration and pothole spikes while preserving real braking/turning events.

Detection thresholds in `main_pi.py` (calibrated for bus dynamics):

| Event | Axis | Threshold (MEDIUM) | Threshold (HIGH) |
|---|---|---|---|
| `HARSH_BRAKE` | X | `< −0.45g` | `< −0.6g` |
| `HARSH_ACCEL` | X | `> +0.35g` | — |
| `AGGRESSIVE_TURN` | Y | `abs > 0.4g` | `abs > 0.55g` |

### 8.2 `sensors/ultrasonic.py`

Triggers HC-SR04 with a 10 µs GPIO pulse and measures echo duration to calculate distance.

| Parameter | Value |
|---|---|
| TRIG pin | GPIO 23 |
| ECHO pin | GPIO 24 |
| Trigger pulse | 10 µs HIGH |
| Distance formula | `duration × 17150` cm (speed of sound / 2) |
| Timeout | 0.1 s (returns `None` if no echo) |
| Safety zone | Objects detected closer than **150 cm** trigger `CLOSE_OVERTAKING` |
| Speed gate | Only active when estimated speed > **15 km/h** (v2.2, was 10) |
| Cooldown | 5 s per event type |

**v2.2 enhancement — Approaching-object filter:**

The `OvertakingDetector` now maintains a 3-reading `deque` of distance history. An event only fires if the detected object is **getting closer** (net decrease ≥ 5 cm across 3 readings). This eliminates false positives from static obstacles like guardrails, parked cars, and walls at traffic lights where GPS noise could momentarily exceed the speed gate.

### 8.3 `sensors/phone_gps.py`

Runs a Flask HTTP server on port 8081 in a daemon thread. Acts as a drop-in replacement for a hardware GPS module.

| Endpoint | Method | Description |
|---|---|---|
| `/gps` | POST | Receives `{latitude, longitude, speed, heading, accuracy}` from Expo app at 2 Hz |
| `/health` | GET | Returns server status, last fix age, current position, trip state |
| `/trip/start` | POST | Signals the Pi that the driver has started a trip — enables event detection |
| `/trip/stop` | POST | Signals trip end — returns event detection to standby mode |

GPS data is considered **stale after 5 seconds** of no updates (`has_fix` returns `False`). The **trip start/stop** endpoints are called by the driver companion app when the driver taps Start Trip or End Trip, and main_pi.py gates all event detection on the `trip_active` flag.

### 8.4 `sensors/sensor_fusion.py`

Implements a 1D **Kalman Filter** that fuses phone GPS speed (~2 Hz) with IMU acceleration (10 Hz, X-axis) to produce a robust speed estimate.

| Parameter | Value |
|---|---|
| Process noise (Q) | 0.1 |
| Measurement noise (R) | **4.0** (v2.2, was 2.0 — increased for phone GPS inaccuracy) |

Used for the overtaking detection speed gate (> 15 km/h) and the `speed` field in event payloads.

**v2.2 enhancement — GPS stale freeze:** If no GPS update is received for >10 seconds (phone disconnected from WiFi), the Kalman `predict()` step is skipped entirely to prevent unbounded speed drift from accelerometer bias.

### 8.5 `sensors/camera.py`

Manages the USB webcam for evidence capture using OpenCV (`cv2`).

| Parameter | Value |
|---|---|
| Device | `/dev/video0` (first connected USB webcam) |
| Resolution | 1280×720 preferred, falls back to available |
| Buffer | **2-second** rolling `collections.deque` (v2.2, was 5 s — saves ~240 MB) |
| Snapshot | Single JPEG frame saved per event |
| Video clip | 2 s pre-event + 5 s post-event MP4 clip per event |
| Output dir | `recordings/YYYY-MM-DD/` (v2.2, date-organized subdirectories) |

**v2.2 enhancements:**

- **`deque(maxlen=N)` buffer** — Replaced `list` + `pop(0)` (O(n)) with `collections.deque` (O(1) auto-eviction). Reduces heap fragmentation over hours of continuous operation.
- **Write-under-lock** — During `save_clip()`, pre-event frames are written directly to `VideoWriter` while holding the frame lock (~30–60 ms), instead of copying all 60 frames (+158 MB). **Peak RAM reduced from ~550 MB to ~392 MB.**
- **`_save_lock` serialization** — Replaced the `_saving` boolean (which silently dropped concurrent clips) with a `threading.Lock()`. If two events fire simultaneously, the second clip waits and is captured sequentially — no evidence is lost.
- **Disk space protection** — Checks `shutil.disk_usage()` before saving. Video capture is skipped if free space < 500 MB; snapshots skipped if < 50 MB.
- **Date subdirectories** — Recordings are organized into `recordings/2026-03-05/` to prevent thousands of flat files degrading filesystem performance.

Enabled only when `ENABLE_CAMERA=true` in `.env`. If `opencv-python-headless` is not installed or no webcam is found, the system continues without camera features.

### 8.6 `sensors/tailgating.py`

Analyses each camera frame to detect a vehicle occupying too large a portion of the forward view.

| Parameter | Value |
|---|---|
| Primary detection | **MobileNet-SSD** via `cv2.dnn.readNetFromCaffe` (~15–20 fps on Pi 5) |
| Fallback detection | Contour-based (used only when model files are missing) |
| Vehicle classes | bus (6), car (7), motorbike (14) from VOC 20-class model |
| DNN confidence | > 0.5 |
| DNN input size | 300×300 |
| Trigger threshold | Vehicle occupies **>10% of frame area** (MEDIUM), **>15%** (HIGH) |
| Tracking | IoU-based same-object tracking (≥ 0.50 overlap across frames) |
| Confirmation | 5 consecutive frames with same tracked vehicle |
| Cooldown | 5 s per event type |

**v2.2 enhancements:**

- **MobileNet-SSD** replaces the previous Haar cascade / contour-only approach, dramatically reducing false positives by detecting actual vehicle classes instead of arbitrary rectangular shapes.
- **IoU tracking** rejects random one-frame detections — only a sustained same-object presence triggers an event.
- **Auto-download** — If model files (`MobileNetSSD_deploy.prototxt` and `.caffemodel`) are missing from `hardware/models/`, the detector attempts to download them automatically via `urllib`. If download fails, a visible warning is printed and the system falls back to contour detection.
- **Precomputed gamma LUT** — The night-vision gamma correction lookup table is built once in `__init__()` instead of being recreated per dark frame, eliminating 256 Python float allocations at 10–30 Hz.

### 8.7 `data_manager.py`

Store-and-forward queue with local SQLite database (`events_queue.db`). All events are written to the queue first, then a background thread syncs to the backend.

| Parameter | Value |
|---|---|
| Database | SQLite file `events_queue.db` |
| Max upload attempts | 10 per event (v2.2, prevents infinite retry) |
| Queue cap | **500 events** (v2.2, oldest dropped if exceeded) |
| Index | `idx_queue_created` on `created_at` column (v2.2, faster queries) |
| File cleanup | Video/snapshot files deleted after successful upload |
| Sync interval | ~2 s when queue empty, ~5 s on failure |

---

## 9. Sensor Placement on Bus

```
                    ╔═══════════════════════════════════════╗
                    ║           FRONT OF BUS                ║
                    ║                                       ║
                    ║  ┌─────────────────────────────────┐  ║
                    ║  │  Pi 5 + MPU-6050 (flat, level)  │  ║
                    ║  │  X-axis pointing FORWARD  ──►   │  ║
                    ║  │  Driver's Phone (GPS hotspot)   │  ║
                    ║  └─────────────────────────────────┘  ║
                    ║                                       ║
                    ║  ┌─────────────────────────────────┐  ║
                    ║  │  🎥 USB WEBCAM                  │  ║
                    ║  │  Windshield mount, FORWARD ──►  │  ║
                    ║  │  Tailgating + evidence capture  │  ║
                    ║  └─────────────────────────────────┘  ║
                    ║         DASHBOARD / WINDSHIELD        ║
                    ║                      DRIVER  SEAT     ║
                    ╠═══════════════════════════════════════╣
  LEFT SIDE  ◄──    ║                                       ║   ──►  RIGHT SIDE
                    ║                                       ║
  ┌─────────────────╬───────────────────────────────────────╬──────────────────┐
  │  ╔═══════════╗  ║         PASSENGER AREA                ║                  │
  │  ║ HC-SR04   ║  ║                                       ║                  │
  │  ║ Ultrasonic║  ║   ┌───┐ ┌───┐ ┌───┐ ┌───┐            ║                  │
  │  ║           ║  ║   │ S │ │ S │ │ S │ │ S │            ║                  │
  │  ║ OUTWARD ► ║  ║   │ E │ │ E │ │ E │ │ E │            ║                  │
  │  ╚═══════════╝  ║   │ A │ │ A │ │ A │ │ A │            ║                  │
  │  height ~1m     ║   │ T │ │ T │ │ T │ │ T │            ║                  │
  │  from ground    ║   └───┘ └───┘ └───┘ └───┘            ║                  │
  └─────────────────╬───────────────────────────────────────╬──────────────────┘
                    ║           REAR OF BUS                 ║
                    ╚═══════════════════════════════════════╝
```

| Sensor | Location | Orientation |
|---|---|---|
| **Pi 5 + MPU-6050** | Central dashboard | Flat and level; MPU-6050 X-axis facing forward |
| **USB Webcam** | Windshield / dashboard top | Facing **forward** (road ahead) for tailgating detection |
| **HC-SR04** | Mid-height left side panel, ~1 m from ground | Perpendicular to bus body, facing outward |
| **Driver's Phone** | Dashboard / driver area | Any — GPS and hotspot active |

---

## 10. Software Environment

### 10.1 Operating System and Interface Configuration

The Pi runs **Raspberry Pi OS Lite (64-bit)**. The I2C interface is enabled via `raspi-config` (`do_i2c 0`) to allow communication with the MPU-6050 on hardware I2C bus 1 (`/dev/i2c-1`). The MPU-6050 is confirmed present at address `0x68` using `i2cdetect -y 1`.

### 10.2 Python Environment

A Python 3 virtual environment is created at `~/OnboardRash/hardware/venv` to isolate dependencies from the system Python. All packages listed in `requirements.txt` are installed within this environment.

### 10.3 Runtime Configuration (`.env`)

Runtime parameters are stored in `hardware/.env`, loaded at startup by `python-dotenv`. The production configuration is:

```dotenv
# Backend URL: laptop's IP on the phone hotspot (typically 192.168.43.2)
SERVER_URL=http://192.168.43.2:5000
API_KEY=default-secure-key-123
BUS_REGISTRATION=KL-01-AB-1234
SAMPLE_RATE=0.1
# Camera enabled: USB webcam on /dev/video0
ENABLE_CAMERA=true
GPS_SOURCE=phone
PHONE_GPS_PORT=8081
# Sensor mount orientation: default, 90cw, 90ccw, 180 (v2.2)
MOUNT_ORIENTATION=default
```

### 10.4 Network Configuration

The Pi connects to the driver's phone WiFi hotspot as a client. To ensure the driver app can always reach the Pi at a predictable address, a static IP of `192.168.43.100/24` is assigned to the `wlan0` interface via `nmcli`. The phone's gateway address on this subnet is `192.168.43.1`; the laptop (running the backend) typically receives `192.168.43.2`. This static assignment matches the default Pi address hard-coded in the driver app's GPS streamer service.

### 10.5 Process Management

`main_pi.py` is registered as a `systemd` service (`onboardrash.service`) configured to start automatically after `network-online.target`. The service restarts automatically on failure with a 10-second delay. Logs are available via `journalctl -u onboardrash`.

```ini
[Unit]
Description=OnboardRash Rash Driving Detector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/OnboardRash/hardware
ExecStart=/home/pi/OnboardRash/hardware/venv/bin/python3 main_pi.py
Restart=on-failure
RestartSec=10
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

### 10.6 Startup Output

When the system initialises successfully, `main_pi.py` produces the following console output:

```
============================================================
🚌 RASH DRIVING DETECTION SYSTEM v2.2
   Full Hardware Mode + Sensor Fusion (Kalman Filter)
============================================================
Server: http://192.168.43.2:5000
Bus: KL-01-AB-1234

Initializing sensors...

=======================================================
📏  IMU SENSOR CALIBRATION
=======================================================
  Mount the sensor FLAT on the dashboard or under a seat.
  Align the X-axis arrow (or long edge of board) with the
  FORWARD direction of the bus.

  • Keep the bus COMPLETELY STILL
  • Engine may be running (vibration is filtered)
  • Calibrating in ~1 second...
-------------------------------------------------------
  ✅ Sensor placement looks correct (tilt: 1.2°)
  Offsets: X=+0.0023  Y=-0.0015  Z=+0.0041
=======================================================

✅ MPU-6050 initialized
📱 GPS Source: Driver Companion App (port 8081)
🧠 Sensor Fusion (Kalman Filter) initialized
🚌 Registering bus (attempt 1/5): KL-01-AB-1234
✅ Bus registered: KL-01-AB-1234 → backend ID 1

============================================================
✅ System ready! Sensors calibrated.

   ⏳ STANDBY — Waiting for driver to start trip in app...
   (Event detection begins when driver taps Start Trip)
============================================================

[14:30:05] ⏳STANDBY | Accel X:0.01g | Speed: 0.0 km/h | GPS:✗ Cam:✓ | Events:0
```

Once the driver taps **Start Trip** in the companion app:

```
🟢 TRIP STARTED (signal from driver app)
   Event detection is now ACTIVE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 TRIP ACTIVE — Event detection ENABLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[14:32:10] 🟢ACTIVE | Accel X:-0.02g | Speed: 32.4 km/h | GPS:✓ Cam:✓ | Events:0
```

If the sensor is misaligned, the calibration output includes specific warnings:

```
  ❌ SENSOR TILTED ~25° — readings will be inaccurate!
     Gravity is leaking into X/Y axes.
     Fix: Mount the board FLAT (parallel to ground).
```

---

## 11. Known Issues and Resolutions

| Symptom | Cause | Fix |
|---|---|---|
| `RuntimeError: Cannot determine SOC peripheral base address` | `RPi.GPIO` doesn't support Pi 5 | `sudo apt install -y swig liblgpio-dev && pip install rpi-lgpio` |
| `i2cdetect -y 1` shows no `68` | I2C not enabled, or SDA/SCL wires swapped | Run `sudo raspi-config nonint do_i2c 0`, reboot, check Pin 3=SDA and Pin 5=SCL |
| Ultrasonic always returns `None` | ECHO never goes HIGH — TRIG wiring issue | Verify TRIG on Pin 16 (GPIO 23) and ECHO junction on Pin 18 (GPIO 24) |
| Ultrasonic distance wildly inaccurate | No voltage divider, ECHO reading corrupted | Check 1 kΩ + 2 kΩ layout — junction must connect to GPIO 24 |
| `SERVER_URL is set to localhost` warning | `.env` not edited | Set `SERVER_URL=http://192.168.43.2:5000` in `hardware/.env` |
| Bus registration fails after 5 retries | Backend not reachable | Background thread keeps retrying every 30 s — start backend then it will recover |
| GPS showing `None` on dashboard | Trip not started in app, or phone GPS off | Start trip in driver app → GPS streams to Pi at port 8081 |
| App can't reach Pi (`192.168.43.100`) | Pi received a DHCP address instead of static | Reassign static IP via `nmcli` as described in §10.4 |
| `ls /dev/video*` shows nothing | Webcam not detected | Try a different USB port (use the blue USB 3.0 ports); check `dmesg \| tail -20` for USB errors |
| Camera module import error | `opencv-python-headless` not installed | Run `pip install opencv-python-headless` inside the venv |
| Tailgating never triggers | Camera angle too wide, vehicle too small in frame | Move webcam closer to windshield centre; ensure it faces straight ahead, not angled up |
| `SENSOR TILTED` warning at startup | MPU-6050 board not level, gravity leaking into X/Y | Mount the board flat on a horizontal surface (dashboard / under-seat shelf) |
| Calibration retries repeatedly | Bus is moving during startup calibration | Stop the bus completely and restart `main_pi.py` |
| MobileNet-SSD model not found | Model files not in `hardware/models/` | v2.2 auto-downloads; if no network, manually place `.prototxt` and `.caffemodel` in `hardware/models/` |
| Events not firing while driving | Trip not started — system in STANDBY mode | Driver must tap Start Trip in companion app to enable detection |
| `⚠️ Low disk space` warning | SD card filling with recordings | Clear old recordings; DataManager caps queue at 500 events |
| False brake events on speed bumps | Z-axis shock briefly registers on X-axis | v2.2 bump suppression: IMU events suppressed for 300 ms after Z-spike > 0.5 g |
| False overtaking at traffic lights | Static wall in range + GPS noise > speed gate | v2.2 approaching-object filter requires distance decreasing over 3 readings |
| `GPS:⚠(15s)` in status line | Phone GPS stream lost (WiFi disconnected) | Kalman speed frozen after 10 s; events tagged `gps_stale`; check phone hotspot |

---

## 12. Version 2.2 Changelog

All changes below were implemented in the v2.2 hardware software update.

**Files affected:** `main_pi.py`, `sensors/mpu6050.py`, `sensors/ultrasonic.py`, `sensors/camera.py`, `sensors/tailgating.py`, `sensors/phone_gps.py`, `sensors/sensor_fusion.py`, `data_manager.py`.
**Driver app files:** `services/gpsStreamer.ts`, `app/(tabs)/home.tsx`.

### 12.1 Accuracy & False Positive Reduction

| Change | File | Impact |
|---|---|---|
| Bus-realistic thresholds (brake −0.45g, accel +0.35g, turn ±0.4g) | `main_pi.py` | Previous sports-car values (1.5/1.0/0.8g) were impossible for buses to trigger |
| IMU startup calibration (50 samples, variance check, 5 retries) | `mpu6050.py` | Eliminates offset bias from sensor mounting position |
| EMA vibration filter (α = 0.3) | `mpu6050.py` | Rejects road surface noise while preserving real events |
| Burst I2C reads (6 bytes atomic) | `mpu6050.py` | Prevents split-sample X/Y/Z time skew |
| Z-axis bump suppression (300 ms window) | `main_pi.py` | Speed bumps and potholes no longer trigger false brake/turn events |
| Ultrasonic approaching-object filter (Δ ≥ 5 cm over 3 readings) | `ultrasonic.py` | Static walls/guardrails no longer trigger false overtaking events |
| Speed gate raised to 15 km/h | `main_pi.py` | Eliminates GPS noise at standstill triggering overtaking |
| MobileNet-SSD vehicle detection (replaces Haar cascade) | `tailgating.py` | Real vehicle-class detection (bus/car/motorbike) with far fewer false positives |
| IoU same-object tracking (5-frame streak) | `tailgating.py` | Random one-frame detections no longer trigger events |
| Kalman R increased to 4.0 (from 2.0) | `sensor_fusion.py` | Better tuned for noisy phone GPS vs hardware GPS |

### 12.2 Evidence Capture

| Change | File | Impact |
|---|---|---|
| Background thread captures evidence THEN queues event with paths | `main_pi.py` | Fixed critical bug: evidence was captured but never uploaded |
| `_save_lock` serialization replaces `_saving` boolean | `camera.py` | Simultaneous events now produce separate clips (no dropped evidence) |
| Disk space checks (500 MB video, 50 MB snapshot) | `camera.py` | System doesn't crash when SD card is nearly full |
| Date-organized recording subdirectories (`recordings/YYYY-MM-DD/`) | `camera.py` | Prevents filesystem degradation from thousands of flat files |

### 12.3 Memory & Performance (2 GB Pi 5)

| Change | File | Impact |
|---|---|---|
| `deque(maxlen=60)` buffer replaces `list` | `camera.py` | O(1) frame eviction, reduces heap fragmentation vs `list.pop(0)` |
| Write-under-lock (no frame copy during save) | `camera.py` | **Peak RAM: 550 MB → 392 MB** (−29%) |
| Rolling buffer reduced 5 s → 2 s | `camera.py` | Steady-state RAM savings of ~240 MB |
| Precomputed gamma LUT in `__init__` | `tailgating.py` | Eliminates per-dark-frame 256-element allocation at 10–30 Hz |
| SQLite index on `created_at` column | `data_manager.py` | Faster queue queries on long trips |
| Queue cap at 500 events (oldest dropped) | `data_manager.py` | Prevents unbounded queue growth when backend is offline |
| Max 10 upload attempts per event | `data_manager.py` | Drops permanently-failing events instead of infinite retry |
| File cleanup after successful upload | `data_manager.py` | Frees disk space after evidence is synced |

### 12.4 Operational UX

| Change | File | Impact |
|---|---|---|
| Sensor placement instructions at startup | `mpu6050.py` | Operator sees how to mount the sensor before calibration |
| Post-calibration tilt/orientation validation | `mpu6050.py` | Warns if sensor is tilted >10°, upside-down, or rotated |
| **Trip-gated event detection** | `main_pi.py`, `phone_gps.py` | Events only fire when driver has started a trip in the app |
| STANDBY / ACTIVE status in console | `main_pi.py` | Operator can see trip state at a glance |
| GPS stale indicator (`GPS:⚠(Ns)`) | `main_pi.py` | Shows seconds since last GPS update |
| Events tagged with `gps_stale: true` | `main_pi.py` | Dashboard can flag events captured without reliable GPS |
| Mount orientation remap (`MOUNT_ORIENTATION` env var) | `main_pi.py` | Supports sensor mounted at 90°/180° without rewiring |
| MobileNet-SSD model auto-download on first run | `tailgating.py` | No manual model file setup required |

### 12.5 Driver App Integration

| Change | File | Impact |
|---|---|---|
| `notifyPiTripStart()` function added | `gpsStreamer.ts` | Phone notifies Pi when trip starts |
| `notifyPiTripStop()` function added | `gpsStreamer.ts` | Phone notifies Pi when trip ends |
| Trip start flow calls `notifyPiTripStart()` | `home.tsx` | Pi enables event detection automatically |
| Trip stop flow calls `notifyPiTripStop()` before GPS stop | `home.tsx` | Pi returns to standby before GPS stream ends |

### 12.6 RAM Budget Summary (Raspberry Pi 5, 2 GB)

| Metric | v2.1 | v2.2 |
|---|---|---|
| Steady-state process RAM | ~470 MB | ~360 MB |
| Peak (during clip save) | ~550 MB | ~392 MB |
| System total (OS + process) peak | ~950 MB | ~792 MB |
| Free RAM at peak | ~1,100 MB | ~1,256 MB |
| Peak thread count | 6–7 | 6–7 |
