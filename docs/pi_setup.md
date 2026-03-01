# OnboardRash — Production Hardware & Setup Guide

This guide covers the complete setup for all four system components: **Raspberry Pi**, **Driver's Phone (Expo App)**, **Flask Backend**, and **React Dashboard**.

---

## 🗺️ System Architecture

```
  Phone (Expo App)  ──WiFi Hotspot──►  Raspberry Pi
    │  GPS @2Hz                          │  Detection Engine
    │  Internet for Pi                  │  Events → Backend
    ▼                                    ▼
  Flask Backend  ◄──────────────────────┘
    │  REST API + WebSocket
    ▼
  React Dashboard
```

The **phone is the Pi's GPS source AND internet gateway** via its WiFi hotspot.

---

## 🛒 Hardware Bill of Materials

| Component | Spec | Purpose |
|---|---|---|
| **Raspberry Pi 5 Model B** | **2GB RAM** | Core processor — runs OpenCV & sensor fusion |
| **MicroSD Card** | 64GB Class 10 A2 | Storage for OS + video clips |
| **Power Supply** | USB-C PD, **5A 27W** | Pi 5 needs 27W — use official Pi 5 PSU or 27W PD charger |
| **MPU-6050 (GY-521)** | Accelerometer/Gyro | Harsh brake, acceleration, turn detection |
| **HC-SR04** | Ultrasonic Sensor | Left-side overtaking detection |
| **USB Webcam** | 720p or 1080p, 30fps | Tailgating detection + evidence capture (plug into USB 3.0) |
| **Resistors** | **1kΩ + 2kΩ** | Voltage divider for HC-SR04 Echo pin |
| **Power Bank** | 20,000mAh, **30W+ PD** | Bus power — must support pass-through charging at 27W+ |

> **Not required:** Pi Camera Module (CSI ribbon) and NEO-6M GPS — replaced by USB webcam and Driver Companion App GPS respectively.

---

## 🛠️ Hardware Assembly

### Step 1: Prepare the Pi

1. Attach heatsinks to CPU and RAM chips.
2. If using a case with fan: Red → Pin 4 (5V), Black → Pin 6 (GND).

### Step 2: Wire MPU-6050 (I2C)

| MPU-6050 Pin | Raspberry Pi Pin |
|---|---|
| VCC | Pin 1 (3.3V) |
| GND | Pin 9 (GND) |
| SCL | Pin 5 (GPIO 3) |
| SDA | Pin 3 (GPIO 2) |

### Step 3: Wire HC-SR04 Ultrasonic (Left Side)

> ⚠️ **CRITICAL:** HC-SR04 Echo outputs 5V — must use voltage divider!

| HC-SR04 Pin | Connect To |
|---|---|
| VCC | Pin 2 (5V) |
| GND | Pin 39 (GND) |
| TRIG | Pin 16 (GPIO 23) |
| ECHO | → 1kΩ → Pin 18 (GPIO 24); also Pin 18 → 2kΩ → GND |

*Voltage divider reduces 5V Echo to ~3.3V, protecting the Pi.*

### Step 4: Connect USB Webcam

Plug the webcam into a **USB 3.0 port** (blue ports) on the Pi 5. No driver install needed.

```bash
# Verify detected
ls /dev/video*      # Should show /dev/video0
v4l2-ctl --list-devices
```

### Step 5: Mount on Bus

| Component | Placement |
|---|---|
| **Pi + IMU** | Flat mount, MPU-6050 X-axis pointing **FORWARD** |
| **USB Webcam** | Dashboard, facing **FORWARD** (road view), USB cable to Pi |
| **Ultrasonic** | Left side of bus, window height, facing **OUTWARD** |

> **NEO-6M GPS** — only needed if `GPS_SOURCE=hardware`. Omit when using the Driver Companion App.

---

## 💻 Part 1: Raspberry Pi Setup

### 1. OS & System Deps

Flash **Raspberry Pi OS Lite (64-bit)**, then SSH in:

```bash
sudo apt update
# V4L2 tools for USB webcam
sudo apt install -y python3-pip python3-venv git i2c-tools v4l-utils
# OpenCV runtime deps
sudo apt install -y libatlas-base-dev libhdf5-dev
```

### 2. Enable Interfaces

```bash
sudo raspi-config
# Interface Options → I2C → Yes
# Interface Options → Serial Port → Shell: No, Hardware: Yes
# (No camera enable step needed — USB webcam is plug-and-play)
sudo reboot
```

### 3. Clone & Install

```bash
git clone https://github.com/yourusername/OnboardRash.git
cd OnboardRash/hardware
python3 -m venv venv
source venv/bin/activate
pip install smbus2 pyserial requests python-dotenv opencv-python-headless flask
```

### 4. Configure .env

```bash
cp .env.example .env
nano .env
```

```ini
SERVER_URL=http://192.168.1.40:5000    # Your laptop's WiFi IP
API_KEY=default-secure-key-123
BUS_REGISTRATION=KL-01-AB-1234
SAMPLE_RATE=0.1
ENABLE_CAMERA=true

# GPS from Driver's Phone (recommended)
GPS_SOURCE=phone
PHONE_GPS_PORT=8081
```

> Set `GPS_SOURCE=hardware` only if using a physical NEO-6M GPS module.

### 5. Run

```bash
source venv/bin/activate
python main_pi.py
```

You should see:
```
📱 Phone GPS Receiver started on port 8081
   Waiting for phone app to connect...
🚌 Bus registered: KL-01-AB-1234
```

### 6. Auto-Start on Boot (Production)

```bash
sudo nano /etc/systemd/system/rash-detection.service
```

```ini
[Unit]
Description=Rash Driving Detection Service
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/OnboardRash/hardware
ExecStart=/home/pi/OnboardRash/hardware/venv/bin/python main_pi.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable rash-detection.service
sudo systemctl start rash-detection.service
```

---

## 📱 Part 2: Driver App Setup (Phone)

### Requirements
- Android phone with **Expo Go** installed (from Play Store)
- Same WiFi or can create mobile hotspot

### First Time Setup
1. Enable **Mobile Hotspot** on the phone (driver's hotspot).
2. Connect the Raspberry Pi to this hotspot via `wpa_supplicant.conf` (see below).
3. **Assign the Pi a static IP** on the hotspot network (see below — required!).
4. Open **Expo Go** → scan QR from `npx expo start`.
5. Register an account on the onboarding screen.
6. In **Profile → Connection Settings**, verify:
   - **Pi Address**: `http://192.168.43.100:8081` (Pi's static IP on hotspot)
   - **Backend Server**: `http://<LAPTOP_IP>:5000`

> ⚠️ **Important:** `192.168.43.1` is the **phone's own gateway address** — do NOT use that as the Pi URL. The Pi needs its own static IP on the hotspot subnet.

### Connect Pi to Phone Hotspot

On the Pi, add hotspot credentials:
```bash
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```
```
network={
    ssid="DRIVER_PHONE_HOTSPOT_NAME"
    psk="hotspot_password"
    key_mgmt=WPA-PSK
}
```

### Assign Pi a Static IP on the Hotspot

Without a static IP, the Pi gets a random DHCP address and the app won't know where to connect. Fix this by telling the Pi to always use `192.168.43.100` on the phone's hotspot (`192.168.43.x` subnet):

```bash
sudo nano /etc/dhcpcd.conf
```

Add at the **end** of the file:
```
# Static IP for OnboardRash phone hotspot
interface wlan0
static ip_address=192.168.43.100/24
static routers=192.168.43.1
static domain_name_servers=8.8.8.8
```

```bash
sudo systemctl restart dhcpcd
# Reconnect to hotspot and verify:
hostname -I   # Should show 192.168.43.100
```

After this, the phone app's default **Pi Address** (`http://192.168.43.100:8081`) will always work without manual configuration.

### Running the App

```bash
# On your laptop (development)
cd driver-app
npx expo start
# Scan QR code with Expo Go on the driver's phone
```

---

## ☁️ Part 3: Backend Setup (Laptop/Server)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend runs at `http://0.0.0.0:5000` (accessible from Pi and phone on same network).

---

## 🖥️ Part 4: Frontend Dashboard Setup

```bash
cd frontend
npm install
npm run dev
```

Dashboard at `http://localhost:5173`. Requires backend running at port 5000.

---

## 🔧 Troubleshooting

| Issue | Solution |
|---|---|
| **"Waiting for phone app to connect"** | Phone isn't sending GPS yet — ensure app is on Home tab with trip started |
| **Pi can't reach backend** | Check `SERVER_URL` in `.env` matches laptop's hotspot IP (not LAN IP if using hotspot) |
| **App can't reach backend** | In Profile → Backend Server, update to laptop's current WiFi IP |
| **App → Pi connection fails** | `192.168.43.1` is the **phone's gateway** — the Pi needs a static IP (`192.168.43.100`). Follow the "Assign Pi a Static IP" section above. In Profile settings use `http://192.168.43.100:8081` |
| **I2C Error (MPU-6050)** | Run `i2cdetect -y 1` — you should see `68`. Check SDA/SCL wiring |
| **Camera Error** | Run `ls /dev/video*` — should show `/dev/video0`. Try a different USB port (use blue USB 3.0). |
| **GPS showing `None`** | Trip must be **started** in app before GPS streams to Pi |
| **Overtake False Positives** | Angle ultrasonic sensor slightly upward or mount higher |
