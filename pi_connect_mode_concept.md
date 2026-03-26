# Pi Connect Mode — Refined Concept

## What You Described (My Understanding)

You want to add a **second mode** to the Demo Control page in the driver app. Right now, the demo page **bypasses the Pi entirely** — it streams GPS from the phone and injects fake sensor events with one tap. You want a new toggle: **"Pi Connect Mode"**, where the demo page actually talks to the real Raspberry Pi — but with a twist:

> Events detected by the Pi **stay silently on the Pi** and are **NOT sent to the dashboard automatically**.  
> Only when you **manually press an event button** on the demo page does the event appear on the dashboard — and at that moment, the Pi also **captures a photo/video** as evidence and attaches it.

This gives you **controlled, on-demand demo events with real hardware evidence**.

---

## Refined Architecture

Here's how I'd structure this to work cleanly:

### Current Flow (Normal Pi Operation)
```
Pi detects event → captures evidence → sends to backend → dashboard shows it
```

### New "Pi Connect Mode" Flow
```
Pi detects event → holds it locally (buffer) → phone sees it in a list
                                                         ↓
                              User taps "Confirm" on phone → Pi captures evidence
                                                         ↓
                              Event + evidence sent to backend → dashboard shows it
```

### Key Design Decisions

#### 1. The Pi Needs a New "Demo Hold" Mode

When Pi Connect Mode is active, the Pi would still run its normal sensor loop (IMU, ultrasonic, camera, GPS) — detecting events as usual. But instead of immediately queuing events to the backend, it would:

- **Buffer detected events locally** in a list (type, severity, timestamp, GPS coordinates)
- **Expose these via a small HTTP API** on the Pi so the phone can read them
- **Wait for a "confirm" command** from the phone before capturing evidence and sending to the backend

#### 2. The Phone App Becomes the "Gate"

On the Demo Control page, when Pi Connect Mode is toggled ON:

- The phone **connects to the Pi's local API** (you'd enter the Pi's IP)
- A new section shows **"Pending Events"** — events the Pi detected but hasn't sent
- Each pending event has a **"Confirm & Send"** button
- Tapping it tells the Pi: *"Capture evidence for this event NOW and send it to the backend"*
- The event button you currently have could also trigger: *"Tell the Pi to simulate this specific event, capture evidence, and send it"*

#### 3. Manual Event Injection Still Works

The existing event buttons (Harsh Brake, Aggressive Turn, etc.) would work differently in Pi Connect Mode:

- Instead of directly calling `POST /api/events` on the backend (like now)
- They would call the **Pi's local API** saying: *"Inject a HARSH_BRAKE event, capture photo/video, and send the whole package to the backend"*
- This means the dashboard gets the event **with real camera evidence**

---

## What This Enables for Your Demo

| Scenario | What Happens |
|---|---|
| **Drive around normally** | Pi detects events silently. Nothing shows on dashboard. You have total control. |
| **Want to show a "Harsh Brake" on dashboard** | Tap the button → Pi captures a 5-second clip + snapshot → event appears on dashboard with real evidence |
| **Pi detects something interesting** | You see it in the "Pending Events" list → tap Confirm → it goes to dashboard with evidence |
| **Want a clean demo** | Reset Events + only send events you choose = perfect controlled demo |

---

## Components That Need Changes

| Component | Changes |
|---|---|
| **Pi ([main_pi.py](file:///d:/Downloads/COLLAGE%20PROJECT/OnboardRash/hardware/main_pi.py))** | Add a lightweight Flask/HTTP server. Add "demo hold" mode. New endpoints: `GET /pending-events`, `POST /confirm-event`, `POST /inject-event`, `POST /capture-evidence` |
| **Driver App ([admin.tsx](file:///d:/Downloads/COLLAGE%20PROJECT/OnboardRash/driver-app/app/admin.tsx))** | Add "Pi Connect Mode" toggle + Pi IP field. Add Pending Events section. Change event buttons to route through Pi when in this mode |
| **Driver App ([api.ts](file:///d:/Downloads/COLLAGE%20PROJECT/OnboardRash/driver-app/services/api.ts))** | Add functions to talk to the Pi's local API |
| **Backend** | No changes needed — events still arrive via the same `POST /api/events` endpoint, just routed through the Pi instead of directly from the phone |

---

## Questions For You

1. **Do you want the Pi to auto-detect events in the background** while in this mode, showing them as a list you can cherry-pick from? Or do you **only** want manual button presses to trigger events?

2. **Pi IP discovery**: Should you manually enter the Pi's IP on the demo page, or should we try auto-discovery (e.g., the Pi and phone are on the same hotspot)?

3. **Is this the right level of complexity?** The core idea is simple — *Pi does the detection and evidence capture, phone controls what reaches the dashboard* — but I want to make sure I'm not over- or under-building this.
