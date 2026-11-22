# Campus CleanTrack – Smart Waste Management System

A Design Thinking project website (AR113) showcasing an intelligent campus waste bin monitoring solution using Arduino Uno, HC-SR04 ultrasonic sensors, tri-color status LEDs, and an acoustic buzzer.

> **Important:** All readings on this website are simulated to demonstrate the core IoT concept. Sensors detect fill levels only, not waste categorization. Users must separate wet and dry waste manually into designated receptacles.

---

## 🌟 Key Features & Enhancements

- **Premium Matte Gradient Aesthetic:** Crafted with an obsidian & graphite dark mode and an ivory/parchment light mode, refined micro-borders, and subtle hardware highlights.
- **Hardware Telemetry Simulation:** Realistic visual representation of the HC-SR04 ultrasonic sensor with simulated distance calculation (`Echo Dist: ~XX cm`), graduated level scale, and an 80% threshold alert marker.
- **Tri-Color LED Status System:**
  - `Normal (< 50%)`: Green LED active
  - `Filling (50% – 79%)`: Yellow LED active
  - `Alert (≥ 80%)`: Red LED strobe + Buzzer activation + Warning banner
- **Tactile Interactive Controls:** Smooth sliders, quick-preset scenario buttons (`All Empty`, `Normal Day`, `Wet Almost Full`, `Dry Almost Full`, `Both Full`), and instant reset.
- **Optional Web Audio Feedback:** Discrete toggle for subtle slider clicks and authentic 2.8 kHz Arduino piezo buzzer alarm simulation.
- **Scroll-Triggered Reveals & Parallax:** Fluid entrance transitions, responsive hover effects with subtle spotlight tracking, and interactive FAQ accordions.
- **Responsive & Accessible:** Fully optimized across mobile, tablet, and widescreen displays with support for reduced motion preferences.

---

## 📁 Project Structure

```
campus-cleantrack/
├── index.html        # Semantic HTML5 markup, accessible landmarks, and meta tags
├── style.css         # Modern CSS custom properties, matte gradients, and fluid layout
├── script.js         # Interactive dashboard logic, simulation engine, and audio synthesis
└── README.md         # Documentation and deployment guide
```

---

## 🚀 How to Run Locally

No build tools, package managers, or local dependencies are required:

1. Clone or download and extract the repository.
2. Double-click `index.html` (or right-click → **Open with** → your favorite browser: Chrome, Edge, Safari, Firefox).
3. The dashboard and all interactive features run completely standalone client-side.

---

## 🌐 Deploying to GitHub Pages

1. Create a new public repository on GitHub (for example `campus-cleantrack`).
2. Upload the files (`index.html`, `style.css`, `script.js`, and `README.md`) to the repository root:
   ```bash
   git init
   git add .
   git commit -m "feat: enhance Campus CleanTrack design and interactive dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/campus-cleantrack.git
   git push -u origin main
   ```
3. On GitHub, navigate to **Settings** → **Pages**.
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` / Folder: `/(root)`
   - Click **Save**.
5. Wait 1–2 minutes. Your site will be live at:
   `https://<your-username>.github.io/campus-cleantrack/`

---

## 📚 References

1. Kaza, S., Yao, L., Bhada-Tata, P., Van Woerden, F. (2018). *What a Waste 2.0: A Global Snapshot of Solid Waste Management to 2050.* World Bank. [openknowledge.worldbank.org](https://openknowledge.worldbank.org/handle/10986/30317)
2. Ministry of Environment, Forest and Climate Change, Government of India. *Solid Waste Management Rules, 2016.* [cpcb.nic.in](https://cpcb.nic.in/)
3. Arduino. *Arduino Documentation.* [docs.arduino.cc](https://docs.arduino.cc/)
4. Elec Freaks. *HC-SR04 Ultrasonic Ranging Module datasheet.*

---

**Academic Project Attribution:**
- **Course:** Design Thinking Project (AR113)
- **Cohort:** B.Tech AIML, Section I · 2026-27
- **Created by:** Dhruv Lamba · Roll No. 27
