# VAGUSSYNC

> **Cardiac-Safe, Movement-Paired Stroke Rehabilitation Platform**

VagusSync is a rehabilitation platform for post-stroke upper-limb motor recovery, combining computer vision hand tracking, ESP-12E Wi-Fi hardware telemetry (3× MPU6050 IMUs, push button grip trigger, MAX30102 PPG cardiac sensor), and cardiac safety pacing.

---

## 🚀 Key Features

### 1. Unified Multimodal Input (`RehabInputState`)
- **Camera Mode**: Real-time MediaPipe 21-landmark hand tracking running 100% locally in-browser.
- **Hardware Mode**: Wi-Fi WebSocket telemetry from ESP-12E / ESP8266 controller with 3× MPU6050 IMUs (Torso, Upper Arm, Forearm), MAX30102 PPG, and physical grip push button.
- **Hybrid Mode**: High-precision camera spatial targeting paired with physical hardware grip and biometric feedback.
- **Hardware Simulator**: Full 50Hz kinematic oscillation and cardiac simulator for testing before physical hardware connection.

### 2. 7 Rehabilitation Games
1. **Balloon Pop**: Reaching and grasping/popping balloons with trajectory and reaction time metrics.
2. **Target Touch**: Sequence reach arcs with instant touch/button confirmation.
3. **Fruit Catch**: Dynamic horizontal hand sweep catcher tracking movement smoothness and speed.
4. **Path Tracer**: Fine motor spline following with kinematic deviation scoring.
5. **Shape Match**: Functional pickup, drag, and socket placement (`PRESS = GRAB`, `RELEASE = DROP`).
6. **Bilateral Puzzle**: Bimanual symmetry exercises supporting dual-hand camera detection.
7. **Write & Trace**: Handwriting motor control across lines, curves, shapes, letters, and numbers (`PRESS = PEN DOWN`, `RELEASE = PEN UP`).

### 3. Cardiac Safety Engine & Session Engine
- Real-time HR monitoring with configurable safety thresholds.
- Automatic session pause during cardiac safety events with caregiver alerting.
- Structured session flow: Pre-session pain check → Neutral posture calibration → Exercise sets → Borg RPE check → Isometric grip task → Post-session pain check → Comprehensive summary score.

### 4. Device Center & IMU Calibration
- Live WebSocket connection management (`ws://192.168.4.1:81`).
- Guided neutral posture zeroing for Torso, Upper Arm, and Forearm IMUs with honest prototype movement angle calculations.
- Live latency (ms) and packet rate (Hz) monitoring.

---

## 🛠️ Hardware Specification

- **Microcontroller**: ESP-12E / ESP8266 (Wi-Fi WebSocket server on port 81)
- **IMU Sensors**: 3× MPU6050 (Torso #1, Upper Arm #2, Forearm #3)
- **Input Button**: Push button (Pressed = GRAB/POP/PEN DOWN, Released = RELEASE/DROP/PEN UP)
- **Biometrics**: MAX30102 Pulse Oximeter & Heart-Rate Sensor

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/benadictthomasoj-pixel/VAGUSYNC.git
cd VAGUSYNC
npm install
```

### Running Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production
```bash
npm run build
```

---

## 🔒 Privacy & Safety
- Camera hand tracking is processed entirely locally on-device. No video or frames are recorded or uploaded.
- Sensor telemetry and session analytics are stored locally in the browser.
