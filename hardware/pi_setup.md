# Raspberry Pi Hardware Setup Guide

## Rash Driving Detection System - IoT Hardware Integration

This guide covers setting up the Raspberry Pi with sensors for real-world deployment.

---

## 📋 Hardware Requirements

### Minimum Setup with Camera (~₹10,000)
| Component | Purpose | Estimated Cost |
|-----------|---------|----------------|
| Raspberry Pi 4 (4GB) | Main processor | ₹5,500 |
| MPU-6050 GY-521 | IMU (acceleration) | ₹100 |
| NEO-6M GPS Module | Location tracking | ₹400 |
| **Pi Camera Module 3** | **Video evidence** | ₹2,000 |
| MicroSD Card (32GB) | Storage | ₹300 |
| Power Bank (10000mAh) | Power supply | ₹800 |
| Jumper Wires (M-F) | Connections | ₹100 |
| Breadboard | Prototyping | ₹80 |

### Full Setup (~₹26,000)
Add to minimum:
- Raspberry Pi 5 (8GB) instead of Pi 4
- Raspberry Pi AI Kit (Hailo-8L) for ML acceleration
- HC-SR04 Ultrasonic sensors (x3) for distance
- SIM7600G-H 4G HAT for cellular connectivity

---

## 🔌 Wiring Diagram

```
                    Raspberry Pi GPIO Header
                    ═══════════════════════
                         3V3  (1) (2)  5V
               MPU SDA ─ GPIO2 (3) (4)  5V ─── MPU VCC, GPS VCC
               MPU SCL ─ GPIO3 (5) (6)  GND ── MPU GND, GPS GND
                        GPIO4 (7) (8)  GPIO14 ─ GPS TX
                          GND (9) (10) GPIO15 ─ GPS RX
                       GPIO17 (11)(12) GPIO18
                       GPIO27 (13)(14) GND
                       GPIO22 (15)(16) GPIO23
                          3V3 (17)(18) GPIO24
                       GPIO10 (19)(20) GND
                        GPIO9 (21)(22) GPIO25
                       GPIO11 (23)(24) GPIO8
                          GND (25)(26) GPIO7
                        GPIO0 (27)(28) GPIO1
                        GPIO5 (29)(30) GND
                        GPIO6 (31)(32) GPIO12
                       GPIO13 (33)(34) GND
                       GPIO19 (35)(36) GPIO16
                       GPIO26 (37)(38) GPIO20
                          GND (39)(40) GPIO21


MPU-6050 Connections:
├── VCC  → Pin 4 (5V)
├── GND  → Pin 6 (GND)
├── SDA  → Pin 3 (GPIO2)
└── SCL  → Pin 5 (GPIO3)

NEO-6M GPS Connections:
├── VCC  → Pin 4 (5V)
├── GND  → Pin 6 (GND)
├── TX   → Pin 10 (GPIO15/RX)
└── RX   → Pin 8 (GPIO14/TX)
```

---

## ⚙️ Raspberry Pi OS Setup

### 1. Flash Raspberry Pi OS
```bash
# Use Raspberry Pi Imager to flash "Raspberry Pi OS Lite (64-bit)"
# Enable SSH and set username/password during imaging
```

### 2. Enable I2C and Serial
```bash
sudo raspi-config
# Interface Options → I2C → Enable
# Interface Options → Serial Port → 
#   Login shell: No
#   Serial hardware: Yes
sudo reboot
```

### 3. Install Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git i2c-tools

# Create project directory
mkdir -p ~/rash-detection
cd ~/rash-detection

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python packages
pip install smbus2 pyserial requests python-dotenv

# For camera support (optional but recommended)
pip install opencv-python picamera2
```

### 4. Camera Setup (Pi Camera Module 3)
```bash
# Enable camera in raspi-config
sudo raspi-config
# Interface Options → Camera → Enable (for legacy)
# OR for Pi Camera Module 3, it's auto-detected

# Test camera
libcamera-hello  # Should show camera preview

# Install picamera2 (modern camera API)
sudo apt install -y python3-picamera2

# For USB webcam, just plug in and it auto-detects
```

### 5. Verify I2C Connection
```bash
# Should show "68" for MPU-6050
sudo i2cdetect -y 1
```

---

## 📁 Hardware Scripts

Copy the `hardware/` folder from the project to your Raspberry Pi:
```bash
scp -r hardware/ pi@raspberrypi:~/rash-detection/
```

---

## 🧪 Testing Sensors

### Test MPU-6050
```bash
cd ~/rash-detection
source venv/bin/activate
python hardware/sensors/mpu6050.py
```

Expected output:
```
MPU-6050 Initialized
Accel: X=-0.02g, Y=0.01g, Z=1.00g
Gyro: X=0.5°/s, Y=-0.3°/s, Z=0.1°/s
```

### Test GPS
```bash
python hardware/sensors/gps.py
```

Expected output:
```
GPS Module Connected
Lat: 8.8932, Lng: 76.6141
Speed: 0.0 km/h
```

### Test Camera
```bash
python hardware/sensors/camera.py
```

Expected output:
```
Testing Camera Module...
Pi Camera initialized (or USB Camera initialized)
📹 Buffer recording started
[Press Enter to capture test clip]
✅ Test successful! Video saved to: recordings/TEST_EVENT_20260121_160000.mp4
```

---

## 🚀 Running on Raspberry Pi

### 1. Configure Server URL
```bash
cd ~/rash-detection/hardware
cp .env.example .env
nano .env
# Set SERVER_URL to your backend server IP
```

### 2. Start the Main Script
```bash
source ~/rash-detection/venv/bin/activate
python hardware/main_pi.py
```

### 3. Auto-start on Boot
```bash
sudo nano /etc/systemd/system/rash-detection.service
```

Add:
```ini
[Unit]
Description=Rash Driving Detection
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/rash-detection/hardware
ExecStart=/home/pi/rash-detection/venv/bin/python main_pi.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable rash-detection
sudo systemctl start rash-detection
```

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| I2C not detecting MPU-6050 | Check wiring, ensure I2C enabled |
| GPS not getting fix | Move outdoors, check antenna |
| Connection refused to server | Check SERVER_URL, firewall |
| Permission denied on serial | Add user to dialout group: `sudo usermod -a -G dialout pi` |
