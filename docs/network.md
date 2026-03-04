# OnboardRash — Network Configuration

This document describes the network topology of the OnboardRash system, the addressing decisions made during development, issues encountered, and the current configuration for both home development and evaluation-day deployment.

---

## 1. System Components and Their Network Roles

| Component | Role | Communicates With |
|---|---|---|
| **Driver's Phone** | GPS source + hotspot gateway (evaluation) | Pi (port 8081), Backend (port 5000) |
| **Raspberry Pi 5** | Detection unit | Backend (port 5000), Phone app (port 8081) |
| **Laptop** | Runs Flask backend + React dashboard | Pi, Phone app |

---

## 2. Communication Paths

```
Phone App (Expo)
  │
  ├── POST http://<PI_IP>:8081/gps       → GPS stream to Pi at 2 Hz
  │
  └── http://<BACKEND_IP>:5000           → All API calls (auth, trips, events)
                                            Socket.IO real-time alerts
Pi (main_pi.py)
  │
  └── POST http://<BACKEND_IP>:5000      → Detected events + location updates

Dashboard (browser on laptop)
  │
  └── http://localhost:5000              → API + Socket.IO (same machine as backend)
```

---

## 3. Development Network (Home WiFi)

All four components (phone, Pi, laptop, browser) are on the same home WiFi LAN (`192.168.1.x` subnet).

### Assigned Addresses

| Device | Address | Type |
|---|---|---|
| Laptop (backend) | `192.168.1.35` | Static (set in Windows WiFi adapter settings) |
| Raspberry Pi 5 | `192.168.1.43` | Static (set via `nmcli` on Pi) |
| Driver's Phone | DHCP (any) | Does not need a fixed IP — only initiates connections |

### Active Configuration

**Driver App (Profile → Connection Settings):**
```
Backend Server:  http://192.168.1.35:5000
Pi Address:      http://192.168.1.43:8081
```

**Pi `hardware/.env`:**
```dotenv
SERVER_URL=http://192.168.1.35:5000
```

### Pi Static IP Command Used

```bash
sudo nmcli connection modify "$(nmcli -t -f NAME connection show --active | head -1)" \
  ipv4.method manual \
  ipv4.addresses 192.168.1.43/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns 8.8.8.8
sudo nmcli connection up "$(nmcli -t -f NAME connection show --active | head -1)"
```

### Laptop Static IP

Set via Windows → Settings → Network & Internet → WiFi → current network → Properties → IPv4 → Manual:
```
IP:      192.168.1.35
Subnet:  255.255.255.0
Gateway: 192.168.1.1
DNS:     8.8.8.8
```

---

## 4. Issues Encountered During Setup

### 4.1 mDNS Hostname (`ARTACE.local`) Does Not Work on Android

**Attempt:** Configure the backend URL as `http://ARTACE.local:5000` to avoid IP management. This works on Windows and iOS (via Bonjour / mDNS), and from the Pi terminal.

**Problem:** Android does **not** support mDNS (`.local` hostname resolution) natively. The app silently timed out every API call, making the login screen unreachable.

**Resolution:** Replaced `ARTACE.local` with the static IP `192.168.1.35` everywhere in the app. The default `DEFAULT_API_URL` in `driver-app/services/api.ts` was updated accordingly.

### 4.2 Pi `.local` Hostname (`ajmal.local`) Same Limitation

**Attempt:** Use `ajmal.local:8081` (Pi's mDNS hostname) as the Pi Address in the app.

**Problem:** Same Android mDNS limitation — the GPS stream would silently fail to connect.

**Resolution:** Use the Pi's static IP `192.168.1.43` directly.

### 4.3 Default `piUrl` Was the Phone's Own Gateway

The original default in `gpsStreamer.ts` was `http://192.168.43.1:8081`. On Android hotspot networks, `192.168.43.1` is the **phone itself** (the hotspot gateway), not the Pi. This would cause the app to POST GPS data to itself.

**Resolution:** Default changed to `http://192.168.43.100:8081`, which matches the static IP assigned to the Pi on the hotspot subnet.

### 4.4 Android Hotspot Uses a Different Subnet

Android hotspot does **not** use the same subnet as home WiFi. Home WiFi assigns `192.168.1.x`; Android hotspot assigns `192.168.43.x`. Running on the phone hotspot at uni would cause the Pi and laptop to receive different IPs than their home static assignments.

**Resolution:** A separate static hotspot IP profile was configured on the Pi (see §5 below), and the evaluation-day addresses are documented separately.

---

## 5. Evaluation-Day Network (Phone Hotspot)

At university, the phone creates a WiFi hotspot. The Pi and laptop both connect to it.

### Subnet

> ⚠️ **Samsung Galaxy S22 Ultra uses `10.36.125.x`** — NOT the commonly documented
> `192.168.43.x`. This was confirmed by checking `ip -4 addr show wlan0` on the Pi
> after connecting to the hotspot.

The gateway (phone itself) is `10.36.125.1` (verify with `ip route show default` on Pi).

### Target Address Assignments

| Device | Address |
|---|---|
| Phone (hotspot gateway) | `10.36.125.1` (automatic) |
| Raspberry Pi 5 | `10.36.125.214` (DHCP — verify with `ip -4 addr show wlan0`) |
| Laptop | `10.36.125.x` (DHCP — verify with `ipconfig` on Windows) |

### Pi Hotspot Profile Configuration

> The Samsung S22 Ultra uses DHCP on `10.36.125.x` — we let DHCP assign the Pi's
> address rather than using a static IP (Samsung's DHCP range may vary).

Profile already configured on Pi:

```bash
sudo nmcli connection add type wifi con-name "phone-hotspot" \
  wifi.ssid "Galaxy" \
  wifi-sec.key-mgmt wpa-psk \
  wifi-sec.psk "00000000" \
  connection.autoconnect yes \
  connection.autoconnect-priority 100
```

After connecting, check the Pi's assigned IP with `ip -4 addr show wlan0`.

### Pi `.env` for Evaluation Day

```dotenv
SERVER_URL=http://10.36.125.<LAPTOP_OCTET>:5000
```

> Find the laptop's IP by connecting it to the "Galaxy" hotspot and running `ipconfig`
> on Windows. Look for the IPv4 address on the `10.36.125.x` subnet.
> Replace `<LAPTOP_OCTET>` with that last number.
> You can also fix this at runtime using the interactive prompt (`s <url>`) — no need
> to edit `.env` files at college.

### Driver App Settings for Evaluation Day

In **Profile → Connection Settings:**
```
Backend Server:  http://10.36.125.<LAPTOP_OCTET>:5000
Pi Address:      http://10.36.125.<PI_OCTET>:8081
```

> Check both IPs after connecting: laptop via `ipconfig`, Pi via `ip -4 addr show wlan0`.

---

## 6. Summary of All Addresses

| Scenario | Subnet | Backend URL | Pi GPS URL |
|---|---|---|---|
| Home WiFi (development) | `192.168.1.x` | `http://192.168.1.35:5000` | `http://192.168.1.43:8081` |
| Phone Hotspot — S22 Ultra | `10.36.125.x` | `http://10.36.125.<laptop>:5000` | `http://10.36.125.<pi>:8081` |
| Phone Hotspot — other Android | `192.168.43.x` | `http://192.168.43.<laptop>:5000` | `http://192.168.43.<pi>:8081` |

> **You never need to know these in advance.** The interactive startup prompt shows
> your current Pi IP and gateway, and lets you set `SERVER_URL` on the fly before
> sensors start. After checking `ipconfig` on the laptop, type `s http://<ip>:5000`
> at the prompt.

> **Pi `.env`** should always hold the last-used working config (home WiFi by default).
> It is the fallback — the prompt overrides it at runtime without touching the file.

---

## 7. Ports Reference

| Port | Service | Direction |
|---|---|---|
| `5000` | Flask backend (REST API + Socket.IO) | Phone app → backend; Pi → backend; browser → backend |
| `8081` | Pi GPS receiver (`phone_gps.py` Flask server) | Phone app → Pi |
| `5173` | React dashboard (Vite dev server) | Browser only (localhost) |

---

## 8. Auto-Network Setup (NEW)

Instead of manually editing `.env` files at each location, `main_pi.py` now supports **automatic network discovery** and an **interactive startup prompt**.

### 8.1 Overview

```
Pi boots / you SSH in via Pi Connect
  │
  ├─ --auto-network flag
  │    └── network_setup.py runs:
  │         1. Check USB tethering (usb0)
  │         2. Check existing WiFi
  │         3. Try preferred_ssid from network_config.json
  │         4. Scan for fallback pattern (e.g. "Galaxy")
  │
  └─ Interactive prompt shows:
       - Current SSID, Pi IP, gateway
       - SERVER_URL, GPS port, bus reg
       - Lets you edit any value before starting
```

### 8.2 Configuration File: `hardware/network_config.json`

```json
{
    "preferred_ssid": "OnboardRash",
    "preferred_password": "demo1234",
    "fallback_ssid_pattern": "Galaxy",
    "fallback_password": "",
    "server_port": 5000,
    "gps_receiver_port": 8081
}
```

Edit this **once at home** with your phone's hotspot name and password.

### 8.3 CLI Flags

```bash
python3 main_pi.py                                    # interactive prompt
python3 main_pi.py --auto-network                     # connect WiFi + prompt
python3 main_pi.py --server http://192.168.43.2:5000  # override server URL
python3 main_pi.py --no-prompt                        # unattended (use .env)
python3 main_pi.py --auto-network --no-prompt          # auto-connect, no prompt
```

### 8.4 Quick Start Script: `hardware/start.sh`

One command to run at college via Pi Connect:

```bash
cd ~/OnboardRash/hardware
chmod +x start.sh   # first time only
./start.sh
```

This runs `python3 main_pi.py --auto-network` and passes through any extra flags.

---

## 9. Emergency: USB Tethering (Plan B)

Use this if the Pi won't connect to the phone hotspot (wrong password, Android update, etc.).

### When to Use

- Pi Connect shows Pi as offline (no WiFi connection)
- You're at college with no time to debug WiFi
- Phone hotspot subnet changed unexpectedly

### How It Works

USB tethering creates a **direct wired network link** between phone and Pi over USB-C. The Pi gets internet through the phone's mobile data. Pi Connect works because it only needs internet access (via Raspberry Pi's cloud relay).

> **Important:** USB tethering does NOT share the phone's WiFi hotspot credentials. It's a separate network interface (`usb0`) with its own subnet (typically `192.168.42.x` on Samsung).

### Steps

1. **Plug** phone into Pi via USB-C cable
2. **Phone:** Settings → Connections → Mobile Hotspot and Tethering → **USB Tethering ON**
3. **Wait ~5 seconds** — Pi auto-gets an IP on the `usb0` interface
4. **Pi Connect** should show Pi as online within ~15 seconds
5. **Open Pi Connect terminal** and run:
   ```bash
   cd ~/OnboardRash/hardware
   ./start.sh
   ```
6. The interactive prompt will show `🔌 USB` as the connection method
7. **Set SERVER_URL** to the laptop's hotspot IP (the laptop still connects to phone WiFi hotspot)

### Typical USB Tethering Addresses (Samsung)

| Device | Interface | Typical IP |
|---|---|---|
| Phone (USB host) | — | `192.168.42.129` |
| Pi (USB client) | `usb0` | `192.168.42.x` (DHCP) |

### After Fixing WiFi

Once in Pi Connect, fix the nmcli profile:
```bash
# Update hotspot password
sudo nmcli connection modify "phone-hotspot" wifi-sec.psk "new_password"
# Or create a fresh profile
sudo nmcli connection add type wifi con-name "phone-hotspot" \
  wifi.ssid "YourHotspotName" wifi-sec.key-mgmt wpa-psk \
  wifi-sec.psk "YourPassword" connection.autoconnect yes \
  connection.autoconnect-priority 100
```
Then unplug USB → Pi switches to WiFi hotspot automatically.

---

## 10. Pi Hotspot Profile Setup (One-Time, At Home)

### Step 1: Set Phone Hotspot Name + Password

On your Samsung S22 Ultra:
- Settings → Connections → Mobile Hotspot and Tethering → Mobile Hotspot
- Set **Network name** to `OnboardRash` (or your preferred name)
- Set **Password** to `demo1234` (or your preferred password)
- Keep these fixed — don't change them before evaluation

### Step 2: Create nmcli Profile on Pi

Via Pi Connect terminal:

```bash
sudo nmcli connection add type wifi con-name "phone-hotspot" \
  wifi.ssid "OnboardRash" \
  wifi-sec.key-mgmt wpa-psk \
  wifi-sec.psk "demo1234" \
  connection.autoconnect yes \
  connection.autoconnect-priority 100
```

> **`autoconnect-priority 100`** means this profile takes precedence over home WiFi (default priority 0). When the hotspot is in range, the Pi will connect to it automatically. At home (hotspot off), it silently falls back to home WiFi.

### Step 3: Update `network_config.json`

```bash
nano ~/OnboardRash/hardware/network_config.json
```

Set `preferred_ssid` and `preferred_password` to match the hotspot.

### Step 4: Test at Home

1. Turn on phone hotspot
2. Wait ~15 seconds
3. Check Pi Connect — Pi should show as online
4. Pi Connect terminal: `nmcli connection show --active` → should show `phone-hotspot`
5. Turn off hotspot → Pi returns to home WiFi within ~30 seconds

---

## 11. Network Scenarios Checklist

```
BEFORE LEAVING HOME (one-time setup)
──────────────────────────────────────
☐ Pi has "phone-hotspot" nmcli profile (SSID: Galaxy, pass: 00000000)
☐ hardware/network_config.json has correct SSID + password
☐ hardware/.env holds home WiFi SERVER_URL (safe fallback)
☐ Pi tested: hotspot ON → Pi auto-connects → Pi Connect works

AT COLLEGE (Galaxy hotspot)
─────────────────────────────
☐ Phone: Turn on "Galaxy" hotspot
☐ Wait ~15s — Pi auto-connects (priority 100 nmcli profile)
☐ Open Pi Connect → verify Pi is online
☐ Laptop: Connect to "Galaxy" hotspot
☐ Laptop: Run `ipconfig` → note your 10.36.125.x address
☐ Laptop: Start backend  → cd backend && python app.py
☐ Laptop: Start dashboard → cd frontend && npm run dev
☐ Pi Connect terminal:
     cd ~/OnboardRash/hardware
     ./start.sh
☐ In the interactive prompt:
     - Pi IP and gateway are shown automatically
     - If SERVER_URL is wrong, type: s http://<laptop_ip>:5000
     - Press ENTER to start
☐ Phone: Open driver app
     → Profile → Connection Settings
     → Backend Server: http://<laptop_ip>:5000
     → Pi Address:     http://<pi_ip>:8081
☐ Phone: Log in → Start Trip
☐ Laptop: Check dashboard for live events

AT HOME (home WiFi)
─────────────────────
☐ Pi auto-connects to home WiFi (lower priority, automatic fallback)
☐ Run: python3 main_pi.py (or ./start.sh)
☐ Prompt shows home WiFi config — press ENTER if SERVER_URL correct
☐ Or skip prompt: python3 main_pi.py --no-prompt

IF PI WON'T CONNECT (Plan B — USB Tethering)
──────────────────────────────────────────────
☐ Plug phone USB-C into Pi
☐ Phone: Settings → USB Tethering ON
☐ Wait ~10s → Pi Connect shows Pi online
☐ Debug WiFi via Pi Connect terminal (see §9)
```
---

## 12. Running `main_pi.py` — Step by Step

### Every Time (Standard Run)

**Step 1 — Open Pi Connect and go to the Pi terminal**

**Step 2 — Activate the venv**
```bash
cd ~/OnboardRash/hardware
source venv/bin/activate
```
Your prompt changes to `(venv) ajmal@RASPBERRY:...` — all `python`/`pip` commands
now use the project's virtual environment (OpenCV, smbus2, RPi.GPIO, etc.).

**Step 3 — Run the script**
```bash
python main_pi.py
```

**Step 4 — At the interactive prompt**

A config box appears showing the current network state and settings:
```
╔══ OnboardRash Pi Config ══════════════════════╗
║  Network:    📶 Galaxy  (wlan0)               ║
║  Pi IP:      10.36.125.214                    ║
║  Gateway:    10.36.125.1                      ║
║                                               ║
║  SERVER_URL: http://10.36.125.3:5000          ║
║  GPS_PORT:   8081                             ║
║  BUS_REG:    KL-01-TEST-001                   ║
╚═══════════════════════════════════════════════╝
Commands:
  ENTER       → start with current config
  s <url>     → change SERVER_URL
  p <port>    → change GPS receiver port
  b <reg>     → change bus registration
  q           → quit
```

- If `SERVER_URL` is correct → press **Enter**
- If wrong → type `s http://<laptop_ip>:5000` → press **Enter**

> **Finding your laptop IP:** on the laptop run `ipconfig` in PowerShell.
> Look for the IPv4 address on the same network the Pi is on.

---

### Shortcut — `start.sh` (skips manual venv activation)

Run once to configure `start.sh` to use the venv Python:
```bash
sed -i 's/python3 main_pi.py/venv\/bin\/python main_pi.py/' ~/OnboardRash/hardware/start.sh
chmod +x ~/OnboardRash/hardware/start.sh
```

Then every run becomes:
```bash
cd ~/OnboardRash/hardware
./start.sh
```

No `source venv/bin/activate` needed — `start.sh` handles it internally.

---

### CLI Flags Reference

| Flag | Effect |
|---|---|
| *(none)* | interactive prompt (default) |
| `--no-prompt` | skip prompt, use `.env` values as-is |
| `--auto-network` | run WiFi auto-connect before starting |
| `--server http://x.x.x.x:5000` | override `SERVER_URL` without prompt |
| `--gps-port 8081` | override GPS receiver port |
| `--bus KL-01-XX-001` | override bus registration |

Examples:
```bash
# Headless / automated (no user input needed)
python main_pi.py --no-prompt

# Override server URL inline, skip prompt
python main_pi.py --server http://10.36.125.3:5000 --no-prompt

# Auto-connect WiFi + interactive prompt (college day)
./start.sh
```