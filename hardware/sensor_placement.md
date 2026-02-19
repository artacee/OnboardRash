# Sensor Placement Guide for Bus

## 🚌 Vehicle Sensor Diagram

```
                              ╔═══════════════════════════════════════════════════════╗
                              ║                     FRONT OF BUS                       ║
                              ║                                                         ║
                              ║   ┌────────────────────────────────────────────────┐   ║
                              ║   │                                                │   ║
                              ║   │           RASPBERRY PI + SENSORS               │   ║
                              ║   │           mounted on dashboard                 │   ║
                              ║   │                                                │   ║
                              ║   │   📦 Pi + MPU-6050 + GPS                       │   ║
                              ║   │   📹 FRONT CAMERA (Tailgating Detection)       │   ║
                              ║   │      Faces FORWARD ───►                        │   ║
                              ║   │                                                │   ║
                              ║   └────────────────────────────────────────────────┘   ║
                              ║                                                         ║
                              ║                    ┌─────────────┐                      ║
                              ║                    │   DRIVER    │                      ║
                              ║                    │   SEAT      │                      ║
                              ║                    └─────────────┘                      ║
                              ╠═══════════════════════════════════════════════════════╣
       ◄─── LEFT SIDE ───     ║                                                         ║     ─── RIGHT SIDE ───►
                              ║                                                         ║
                              ║                                                         ║
    ┌─────────────────────────╬─────────────────────────────────────────────────────────╬─────────────────────────┐
    │                         ║                                                         ║                         │
    │   ╔═══════════════╗     ║                    PASSENGER AREA                       ║                         │
    │   ║ 📡 ULTRASONIC ║     ║                                                         ║                         │
    │   ║   HC-SR04     ║     ║                    ┌───┐ ┌───┐ ┌───┐ ┌───┐              ║                         │
    │   ║               ║     ║                    │   │ │   │ │   │ │   │              ║                         │
    │   ║ CLOSE         ║     ║                    │ S │ │ S │ │ S │ │ S │              ║                         │
    │   ║ OVERTAKING    ║     ║                    │ E │ │ E │ │ E │ │ E │              ║                         │
    │   ║ DETECTION     ║     ║                    │ A │ │ A │ │ A │ │ A │              ║                         │
    │   ║               ║     ║                    │ T │ │ T │ │ T │ │ T │              ║                         │
    │   ║               ║     ║                    │ T │ │ T │ │ T │ │ T │              ║                         │
    │   ║ Faces         ║     ║                    │ S │ │ S │ │ S │ │ S │              ║                         │
    │   ║ OUTWARD ───►  ║     ║                    └───┘ └───┘ └───┘ └───┘              ║                         │
    │   ╚═══════════════╝     ║                                                         ║                         │
    │                         ║                                                         ║                         │
    │                         ║                                                         ║                         │
    └─────────────────────────╬─────────────────────────────────────────────────────────╬─────────────────────────┘
                              ║                                                         ║
                              ║                     REAR OF BUS                        ║
                              ╚═══════════════════════════════════════════════════════╝
```

---

## 📍 Sensor Locations Summary

| Sensor | Location | Direction | Purpose |
|--------|----------|-----------|---------|
| **Raspberry Pi** | Dashboard | N/A | Main processing unit |
| **MPU-6050 (IMU)** | Dashboard (with Pi) | N/A | Detects harsh braking/turns |
| **GPS Module** | Dashboard (with Pi) | Sky View | Location & speed tracking |
| **Front Camera** | Dashboard / Windshield | Facing Forward | Detects if **driver** is tailgating vehicle ahead |
| **Ultrasonic (LEFT)** | Left side, mid-bus | Facing Outward | Detects close overtaking vehicles on the left |

---

## 🔧 Mounting Details

### 1. Dashboard Unit (Pi + Camera + IMU + GPS)
```
Location: Center of dashboard or windshield mount
Camera: Facing ROAD AHEAD (Forward) to see vehicle in front
IMU: Mount flat and level (X-axis points forward)
GPS: Antenna with clear view of sky (top of dashboard)

Tailgating View:
     ┌─────────────────────────────────────────┐
     │           FRONT CAMERA VIEW             │
     │                                         │
     │         Vehicle Ahead is CLOSE!         │
     │    ╔═════════════════════════════════╗  │
     │    ║       VEHICLE AHEAD             ║  │  ← Detected Vehicle
     │    ╚═════════════════════════════════╝  │
     │                                         │
     │                                         │
     └─────────────────────────────────────────┘
          If matches >15% of frame = TAILGATING
```

### 2. Left Ultrasonic Sensor (HC-SR04)
The specific purpose of this sensor is to detect **Close Overtaking** on the left side.

```
Location: Middle of left side body panel
Height:   ~1 meter from ground (bumper height or slightly above)
Mount:    Weatherproof housing, sensor "eyes" exposed
Angle:    Perpendicular (90°) to bus body, facing OUTWARD
Range:    Detects objects < 1.5m (Safety Zone)
```

---

## ⚡ Wiring Summary

```
Raspberry Pi GPIO Header
═══════════════════════
     3V3  (1) (2)  5V ──────┬── MPU VCC, GPS VCC
     SDA  (3) (4)  5V ──────┼── Ultrasonic VCC
     SCL  (5) (6)  GND ─────┴── All GND
   GPIO4  (7) (8)  TX ───────── GPS TX
     GND  (9) (10) RX ───────── GPS RX
  GPIO17 (11) (12) GPIO18
  GPIO27 (13) (14) GND
  GPIO22 (15) (16) GPIO23 ──── Ultrasonic TRIG
     3V3 (17) (18) GPIO24 ──── Ultrasonic ECHO (Via Divider)
  GPIO10 (19) (20) GND

IMPORTANT: Voltage Divider for ECHO
ECHO (5V) ────[1kΩ]────┬──── GPIO24 (3.3V)
                       │
                     [2kΩ]
                       │
                      GND
```

---

## 📋 Hardware Checklist

- [ ] **Raspberry Pi** mounted securely under dashboard (vibration dampened)
- [ ] **MPU-6050** is flat, level, and X-axis points to front of bus
- [ ] **GPS Antenna** has clear view of sky (not under metal)
- [ ] **Front Camera** is mounted on windshield facing FORWARD (for tailgating)
- [ ] **Ultrasonic Sensor** on Left Side, properly drilled/mounted
- [ ] **Voltage Divider** installed for Ultrasonic ECHO pin
- [ ] Power supply provides stable 5V 3A (no undervoltage warnings)
- [ ] All cables routed strictly to avoid driver interference
