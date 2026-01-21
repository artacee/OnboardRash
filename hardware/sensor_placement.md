# Sensor Placement Guide for Bus

## 🚌 Vehicle Sensor Diagram

```
                              ╔═══════════════════════════════════════════════════════╗
                              ║                     FRONT OF BUS                       ║
                              ║                                                         ║
                              ║                    ┌─────────────┐                      ║
                              ║                    │   DRIVER    │                      ║
                              ║                    │   SEAT      │                      ║
                              ║                    └─────────────┘                      ║
                              ║                                                         ║
                              ║   ┌────────────────────────────────────────────────┐   ║
                              ║   │                                                │   ║
                              ║   │           RASPBERRY PI + SENSORS               │   ║
                              ║   │           mounted under dashboard               │   ║
                              ║   │                                                │   ║
                              ║   │   📦 Pi + MPU-6050 + GPS Module                │   ║
                              ║   │                                                │   ║
                              ║   └────────────────────────────────────────────────┘   ║
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
                              ║                                                         ║
                              ╠═══════════════════════════════════════════════════════╣
                              ║                                                         ║
                              ║                  ┌─────────────────────────┐            ║
                              ║                  │    📹 REAR CAMERA       │            ║
                              ║                  │    Pi Camera Module     │            ║
                              ║                  │                         │            ║
                              ║                  │    TAILGATING           │            ║
                              ║                  │    DETECTION            │            ║
                              ║                  │                         │            ║
                              ║                  │    Faces BACKWARD ◄──   │            ║
                              ║                  └─────────────────────────┘            ║
                              ║                                                         ║
                              ║                     REAR OF BUS                        ║
                              ╚═══════════════════════════════════════════════════════╝
```

---

## 📍 Sensor Locations Summary

| Sensor | Location | Direction | Purpose |
|--------|----------|-----------|---------|
| **Raspberry Pi** | Under dashboard | N/A | Main processing unit |
| **MPU-6050 (IMU)** | Dashboard area (with Pi) | N/A | Detects harsh braking, acceleration, turns |
| **GPS Module** | Dashboard area (with Pi) | N/A | Location & speed tracking |
| **Ultrasonic (LEFT)** | Left side, mid-bus | Facing outward (left) | Detects close overtaking vehicles |
| **Rear Camera** | Rear of bus | Facing backward | Detects tailgating vehicles |

---

## 🔧 Mounting Details

### 1. Raspberry Pi + IMU + GPS (Dashboard Area)
```
Location: Under dashboard, accessible but protected
Mount: Inside enclosure box with ventilation
Power: Connected to 12V→5V converter from bus power
Notes: Keep IMU level and firmly mounted for accurate readings
```

### 2. Left Ultrasonic Sensor
```
Location: Middle of left side, at vehicle height (~1m from ground)
Mount: Weatherproof housing, sensor face exposed
Angle: Perpendicular to bus body (facing outward)
Range: Detects vehicles 0-4 meters away
Cable: 4-wire connection to Pi (VCC, GND, TRIG, ECHO)

Detection Zone:
                    ←── 1.5m (warning) ──→
     ←────────────── 4m (max range) ────────────────→
     ┌─────────────────────────────────────────────┐
     │                 DETECTION ZONE              │
     │    ╔═══════╗                                │
     │    ║SENSOR ║▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
     │    ╚═══════╝                                │
     │      BUS                                    │
     └─────────────────────────────────────────────┘
```

### 3. Rear Camera
```
Location: Center of rear, high position for better view
Mount: Inside rear window or weatherproof external housing
Angle: Slightly downward (15°) to capture following vehicles
Field of View: Wide angle preferred (120°+)
Cable: CSI ribbon cable (up to 2m) or USB extension

Camera View:
     ┌─────────────────────────────────────────┐
     │               CAMERA VIEW               │
     │                                         │
     │    ╔═════════════════════════════════╗  │
     │    ║   TAILGATING VEHICLE HERE       ║  │  ← Danger Zone
     │    ╚═════════════════════════════════╝  │
     │                                         │
     │    ┌─────────────────────────────────┐  │
     │    │   Warning Zone - Vehicle Close  │  │  ← Warning
     │    └─────────────────────────────────┘  │
     │                                         │
     │         Normal Following Distance       │  ← Safe
     └─────────────────────────────────────────┘
         ROAD BEHIND BUS
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
