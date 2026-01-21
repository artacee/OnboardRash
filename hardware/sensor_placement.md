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
    │   ║ Faces         ║     ║                    │ S │ │ S │ │ S │ │ S │              ║                         │
    │   ║ OUTWARD ───►  ║     ║                    └───┘ └───┘ └───┘ └───┘              ║                         │
    │   ╚═══════════════╝     ║                                                         ║                         │
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
| **GPS Module** | Dashboard (with Pi) | N/A | Location & speed tracking |
| **Front Camera** | Dashboard / Windshield | Facing Forward | Detects if **driver** is tailgating |
| **Ultrasonic (LEFT)** | Left side, mid-bus | Facing Outward | Detects close overtaking vehicles |

---

## 🔧 Mounting Details

### 1. Dashboard Unit (Pi + Camera + IMU + GPS)
```
Location: Center of dashboard or windshield mount
Camera: Facing ROAD AHEAD (Forward) to see vehicle in front
IMU: Mount flat and level
GPS: Antenna with clear view of sky

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

### 2. Left Ultrasonic Sensor
```
Location: Middle of left side, at vehicle height (~1m from ground)
Mount: Weatherproof housing, sensor face exposed
Angle: Perpendicular to bus body (facing outward)
Range: Detects vehicles 0-4 meters away
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
     3V3 (17) (18) GPIO24 ──── Ultrasonic ECHO*
  GPIO10 (19) (20) GND
                   
* Use voltage divider for ECHO: 1kΩ + 2kΩ

Camera: CSI Port (ribbon cable)
```

---

## 📋 Hardware Checklist

- [ ] Raspberry Pi mounted securely under dashboard
- [ ] MPU-6050 level and firmly attached
- [ ] GPS module with antenna visible to sky (window)
- [ ] Ultrasonic sensor on left side, weatherproofed
- [ ] Rear camera mounted, clear view of road behind
- [ ] All cables routed and secured
- [ ] Power supply stable (12V→5V converter)
- [ ] Tested all sensors before final installation
