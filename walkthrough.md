# Walkthrough - Final Redesign: Space Shooter, Upgrades Shop & Rivoxa Agency (Ayush Shukla)

We have fully redesigned the portfolio website under `C:/Users/ayush/.gemini/antigravity/scratch/gaming-portfolio/`. All previous gaming systems have been replaced with a high-fidelity cyber-developer theme featuring interactive elements, an embedded arcade canvas game, and a direct recruitment portal.

## Git & GitHub Integration

### 1. Repository Initialized & Synchronized
- **GitHub Repository**: [https://github.com/XORNOTFOUND02/XORNOTFOUND02](https://github.com/XORNOTFOUND02/XORNOTFOUND02)
- **Status**: Git initialized and synchronized. Every new feature modification is committed and pushed directly to the remote repository.

### 2. Workspace Agent Rules (`.agents/AGENTS.md`)
- Placed a workspace-scoped rules configuration file under `.agents/AGENTS.md` instructing any future AI coding agents working in this directory to stage, commit, and push any workspace edits to your GitHub remote repository automatically.

---

## Game Engine & Hardware Upgrades Shop

### 1. Retro Space Shooter (Fighter Jet Shooter)
- **Concept**: Control a cyber fighter jet at the bottom of the canvas, navigating left/right automatically firing laser beams at incoming insect-like code bugs.
- **Controls**: Drag or move your mouse over the canvas coordinates, or use touch swipe on mobile viewports. Or press **Left / Right Arrow Keys** to dodge and shoot.
- **Difficulty settings**: easy (slow bugs), medium, hard (fast bugs spawning rapidly).
- **Skin integration**: customize your jet to represent a Cyber Visor (cyan shape), Matrix Glitch (neon letter), Crimson Alien (skull), or Pixel Cruiser (orange box).
- **Audio Synths**: fires laser beams and triggers explosions dynamically using native oscillators.

### 2. Interactive Upgrades Hardware Shop Tab
- **Currency System**: Destroying insect bugs inside the Shooter game rewards you with **Bytes/Credits** (e.g. 1 bug = 1 Byte). Your balances persist across page loads using `localStorage`.
- **Purchase upgrades in the Shop**:
  - **Double Lasers (10 Bytes)**: Upgrades your offensive stream to fire parallel laser bolts, doubling damage area.
  - **Force Shield (15 Bytes)**: Grants a cyan glowing ring shield around the ship. Absorbs one fatal collision crash before systems fail, allowing you to survive error collisions.
  - **EMP Bomb (25 Bytes)**: Grants shockwave charges. Press **`B`** on your keyboard during a mission to trigger a screen-wide EMP flash that instantly vaporizes all active bugs and awards Byte points for each bug destroyed.

---

## Beast-Mode UX Additions

### 1. Dynamic Text Scramble Matrix Glitch
- **Hover Scramble**: Hovering over the main display header **"AYUSH SHUKLA"** plays a custom sci-fi glitch sound effect and scrambles the text characters dynamically before easing back.
- **CLI Scramble**: Typing `glitch` in the floating terminal drawer triggers a full-page compile corruption animation, scrambling all layout headers and navbar links simultaneously.

### 2. Matrix Code Decryption Takeover (Secret Easter Egg)
- **Trigger**: Click on the **`XORNOTFOUND`** brand logo in the top-left of the navbar.
- **Visuals**: Instantly plays a sci-fi server crash beep and triggers a full-screen, highly responsive **Matrix Digital Rain Canvas animation** with flowing code glyphs.
- **Console Log overlay**: Fades in a floating hacker console displaying decrypted developer database credentials, years of experience, startup details, and skills lists.
- **Control**: Click anywhere inside the overlay to exit and return to the main net.

### 3. Floating Developer CLI Terminal Drawer (Responsive Update)
- **Concept**: Added a slide-out command line interface drawer at the bottom-left corner of the viewport (accessed via the floating `[>_]` button).
- **Clipping Fixes**: Configured explicit padding overrides (`padding: 12px 16px !important`), width resets (`width: 100% !important; margin: 0 !important;`), and box-sizing constraints to guarantee header and body text never shift past the container boundaries.
- **Advanced CLI Cockpit Commands**:
  - `help`: lists all available terminal commands.
  - `about`: details your name, handle, and professional history.
  - `skills`: prints out your entire tech stack catalog.
  - `rivoxa`: searches for details on the Rivoxa digital marketing agency.
  - `contact`: lists your email and instagram handle.
  - `system`: prints simulated diagnostic network logs (telemetry CPU temp, threads uptime).
  - `audit` / `scan`: initiates progressive network probe diagnostic sweeps.
  - `credits`: displays Byte/Credits balance.
  - `theme [cyan/magenta/green/yellow]`: swaps accent theme colors.
  - `beats [play/stop]`: controls ambient audio playback.
  - `game [start/stop]`: launches space shooter from console.
  - `diff [easy/medium/hard]`: adjusts shooter speed.
  - `buy [double/shield/bomb]`: purchases upgrade shop items from command line.
  - `matrix` / `hack`: decrypts system archives and boots up the Matrix Rain takeover screen.
  - `glitch`: scrambles all layout headers on the page.
  - `clear`: clears out the logs buffer.
  - `cheat`: easter egg that sets the high score to 999 and maxes out shop Byte credits.

### 4. Hacker Compiler Simulator Mode
- **Tab Panel**: Accessed via the **"HACKER COMPILER"** tab next to the game.
- **Keystroke Ingestion**: Click inside the window and type any keys to print out highly advanced Machine Learning algorithm blocks in Python.
- **Completion chime**: Triggers an unlock sound and decrypter layout panel upon reaching 100% progress.

### 5. 3D Perspective Card Tilt
- Implemented responsive mouse-move tracking scripts on all major cards (`.cyber-card`, `.rgb-card-border`).
- Dynamically tilts cards in 3D perspective space (rotating on X and Y axes up to 7 degrees and scaling up to `1.02` for hover highlight feedback).
- Automatically bypassed on mobile devices/touchscreens to preserve rendering performance.

### 6. Soundtrack Equalizer Visualizer (Navbar Integration)
- Integrated a mini audio frequency equalizing visualizer next to the **BEATS** play button.
- When enabled, vertical neon cyan equalizer bars pulse up and down in sync with the arpeggiated loop tempo, visually representing audio playback.

### 7. Interactive Background Particles Canvas
- Added a full-viewport canvas in the background (`#bgParticlesCanvas`) rendering floating matrix nodes.
- When particles drift close to each other, they connect with very faint network lines.
- **Dynamic Adaptability**: The particle and line colors automatically read root CSS variables, changing color instantly when you swap theme accents.

### 8. RGB Color Accent Swapper
- Added a color swatch widget in the sticky top navigation menu.
- Visitors can click on **Cyan, Magenta, Matrix Green, or Cyber Amber** dots.
- Clicking updates CSS root properties (`--neon-cyan`, `--cyan-glow`), instantly swapping the glow, hover accents, text highlights, and background particles across the entire site with smooth transitions.

### 9. Smooth Scroll Entrance Reveals
- Integrated an Intersection Observer (AOS style) script that tracks scroll thresholds.
- Main layout cards slide and fade up smoothly as they enter the visitor's screen, creating a highly polished browsing transition.

### 10. Custom Easing Cursor Follower
- Displays a glowing neon circle that follows the cursor using high-easing inertia (`cursorEase = 0.16`) for a fluid desktop experience.
- Detects hovers on links, buttons, color dots, and canvas, expanding into a hollow neon ring.
- Automatically disables on touch screen devices and hides standard desktop cursors.

### 11. Animated Typing loop (Hero Section)
- Added an automated typing-carousel loop in the hero header. It dynamically types and deletes professional titles.

### 12. Floating Scroll To Top HUD
- Implemented a floating neon circular scroll button in the bottom right corner.
- Fades in dynamically when scrolling down the page. Clicking it plays a synthesized chiptune lift sound and scrolls the viewport smoothly back to the top header.

### 13. Interactive Skills Documentation Search
- Every tag and box inside **Languages Mastered**, **Current Focus**, **Frontend Architecture**, and **Backend & Database Infrastructure** is now fully interactive.
- Clicking any skill (e.g. *Python*, *React*, *Scikit-Learn*, or *Next.js*) automatically opens a Google search for that technical documentation in a new tab.

### 14. Rivoxa Re-branding & Get Hired Portal
- **Automation Digital Marketing Agency**: The company spotlight text has been rewritten to reflect Rivoxa's core business model:  
  *"Rivoxa is a leading Automation Digital Marketing Agency specializing in streamlining growth marketing campaigns, automating customer acquisition pipelines, and integrating data-driven marketing software architectures."*
- **"Get Hired" Gateway**: Added a high-visibility button in the Rivoxa card. Clicking it immediately opens the visitor's mail client, addressing an email to **`rivoxapvt@gmail.com`** with a pre-filled subject line: `Job Application - RIVOXA`.

---

## Localhost Server Status (Active)

Following the system restart, I restarted the native PowerShell background static server:
* **Host Address**: [http://localhost:8000/](http://localhost:8000/)
* **Local Source Path**: `C:\Users\ayush\.gemini\antigravity\scratch\gaming-portfolio`
* **Log Location**: [task-286.log](file:///C:/Users/ayush/.gemini/antigravity/brain/c279cb63-639f-48fe-a27e-d1432c4af852/.system_generated/tasks/task-286.log)

Navigate to [http://localhost:8000/](http://localhost:8000/) on your browser to view the final website and play the game!
