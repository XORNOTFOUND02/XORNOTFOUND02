/* ==========================================================================
   APP SCRIPT LOGIC: PARTICLES, THEME SWAPPER, CURSOR, MUSIC & TERMINAL CLI
   ========================================================================== */

// --- 1. WEB AUDIO SYNTHESIZER ENGINE ---
let audioCtx = null;
let soundMuted = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthSound(freqs, durations, type = 'sine', gainVal = 0.1) {
    if (soundMuted) return;
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const now = audioCtx.currentTime;
        let timeOffset = 0;

        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, now + timeOffset);
            
            gainNode.gain.setValueAtTime(gainVal, now + timeOffset);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + durations[index]);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + durations[index]);
            
            timeOffset += durations[index] * 0.7;
        });
    } catch (e) {
        console.error("Audio Synthesis failed:", e);
    }
}

// Chiptune Game Sounds
function playJumpSound() {
    playSynthSound([350, 550], [0.06, 0.08], 'sine', 0.08);
}

function playScoreSound() {
    playSynthSound([523.25, 783.99], [0.08, 0.12], 'triangle', 0.08);
}

function playCrashSound() {
    playSynthSound([220, 110, 55], [0.1, 0.1, 0.25], 'sawtooth', 0.12);
}

function playShieldAbsorbSound() {
    playSynthSound([400, 200], [0.12, 0.12], 'sawtooth', 0.08);
}

function playBombExplosionSound() {
    playSynthSound([300, 150, 80], [0.1, 0.1, 0.3], 'sawtooth', 0.18);
}


// --- 2. AMBIENT CYBER SOUNDTRACK LOOP (SEQUENCER) ---
let musicInterval = null;
let musicActive = false;
let musicGain = null;
let filterNode = null;

// Arpeggiated Space Minor loop progression (Am, F, C, G)
const synthScale = [
    [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4 (Am)
    [174.61, 261.63, 349.23, 440.00], // F3, C4, F4, A4 (Fmaj)
    [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5 (Cmaj)
    [196.00, 246.94, 293.66, 392.00]  // G3, B3, D4, G4 (Gmaj)
];

let chordIndex = 0;
let noteIndex = 0;

function startAmbientSoundtrack() {
    try {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(600, audioCtx.currentTime);
        filterNode.connect(audioCtx.destination);
        
        musicGain = audioCtx.createGain();
        musicGain.gain.setValueAtTime(0.012, audioCtx.currentTime);
        musicGain.connect(filterNode);
        
        musicActive = true;
        
        const vis = document.getElementById('audioVisualizer');
        if (vis) {
            vis.classList.remove('d-none');
            vis.classList.add('active');
        }
        
        musicInterval = setInterval(() => {
            if (!musicActive) return;
            
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            
            const currentChord = synthScale[chordIndex];
            const freq = currentChord[noteIndex];
            
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            const noteGain = audioCtx.createGain();
            noteGain.gain.setValueAtTime(0, audioCtx.currentTime);
            noteGain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);
            
            osc.connect(noteGain);
            noteGain.connect(musicGain);
            
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + 0.3);
            
            noteIndex = (noteIndex + 1) % 4;
            if (noteIndex === 0) {
                chordIndex = (chordIndex + 1) % 4;
            }
        }, 200);
    } catch(e) {
        console.warn("Soundtrack initialization failed:", e);
    }
}

function stopAmbientSoundtrack() {
    musicActive = false;
    clearInterval(musicInterval);
    if (musicGain) {
        musicGain.disconnect();
    }
    
    const vis = document.getElementById('audioVisualizer');
    if (vis) {
        vis.classList.remove('active');
        vis.classList.add('d-none');
    }
}

function initSoundtrackToggle() {
    const musicBtn = document.getElementById('bgMusicBtn');
    const musicIcon = document.getElementById('musicIcon');
    if (!musicBtn) return;
    
    musicBtn.addEventListener('click', () => {
        if (!musicActive) {
            startAmbientSoundtrack();
            musicIcon.className = "fas fa-pause text-neon-cyan";
        } else {
            stopAmbientSoundtrack();
            musicIcon.className = "fas fa-play";
        }
    });
}


// --- 3. GOOGLE SEARCH REDIRECTS FOR SKILL NODES ---
function initSkillRedirects() {
    const skillNodes = document.querySelectorAll('.clickable-skill');
    
    skillNodes.forEach(node => {
        node.addEventListener('click', (e) => {
            let query = node.getAttribute('data-search');
            if (!query) {
                const nameNode = node.querySelector('.skill-name') || node.querySelector('.font-code');
                query = nameNode ? nameNode.innerText.trim() : node.innerText.trim();
            }
            
            if (query) {
                playSynthSound([600], [0.05], 'sine', 0.05); // blip
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.open(url, '_blank');
            }
        });
    });
}


// --- 4. RETRO SPACE SHOOTER (FIGHTER JET) ENGINE ---
let canvas = null;
let ctx = null;
let gameInterval = null;
let gameActive = false;

// Physics scaling values mapped to difficulty settings
const diffSettings = {
    easy: { enemySpeed: 1.0, spawnRate: 80, bulletSpeed: 4 },
    medium: { enemySpeed: 1.6, spawnRate: 55, bulletSpeed: 5 },
    hard: { enemySpeed: 2.3, spawnRate: 35, bulletSpeed: 6 }
};
const PIPE_WIDTH = 44;

let currentDiff = 'easy';
let currentSkin = 'visor'; // Default visor jet

// State parameters
let playerX = 240;
const playerY = 290;
const playerWidth = 24;
const playerHeight = 18;

let score = 0;
let highScore = 0;
let bullets = [];
let enemies = [];
let gameFrame = 0;
let bombFlashActive = 0; // Flash effect ticker

// Upgrade Shop Items state
let credits = 0;
let upgrades = {
    double: false,
    shield: 0,
    bombs: 0
};

function loadHighScore() {
    try {
        const stored = localStorage.getItem('xor_shooter_high');
        if (stored) {
            highScore = parseInt(stored);
            document.getElementById('gameHighScore').innerText = highScore;
        }
    } catch (e) {
        console.warn("localStorage high score access failed:", e);
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        document.getElementById('gameHighScore').innerText = highScore;
        try {
            localStorage.setItem('xor_shooter_high', highScore);
        } catch (e) {
            console.warn("localStorage score write error:", e);
        }
    }
}

// Load and save upgrades shop parameters
function loadUpgrades() {
    try {
        const storedCredits = localStorage.getItem('xor_shop_credits');
        if (storedCredits) {
            credits = parseInt(storedCredits);
            document.getElementById('shopCredits').innerText = credits;
        }
        const storedUpgrades = localStorage.getItem('xor_shop_upgrades');
        if (storedUpgrades) {
            upgrades = JSON.parse(storedUpgrades);
        }
        updateShopButtonsUI();
    } catch (e) {
        console.warn("Error loading upgrades shop configurations:", e);
    }
}

function saveUpgrades() {
    try {
        localStorage.setItem('xor_shop_credits', credits);
        localStorage.setItem('xor_shop_upgrades', JSON.stringify(upgrades));
        document.getElementById('shopCredits').innerText = credits;
        updateShopButtonsUI();
    } catch (e) {
        console.warn("Error saving upgrades shop configurations:", e);
    }
}

function updateShopButtonsUI() {
    const dblBtn = document.getElementById('buyDoubleBtn');
    const shldBtn = document.getElementById('buyShieldBtn');
    const bombBtn = document.getElementById('buyBombBtn');
    
    if (dblBtn) {
        if (upgrades.double) {
            dblBtn.innerText = "ACTIVE";
            dblBtn.classList.add('active-diff');
        } else {
            dblBtn.innerText = "10 BYTES";
            dblBtn.classList.remove('active-diff');
        }
    }
    if (shldBtn) {
        shldBtn.innerText = upgrades.shield > 0 ? `SHIELD [x${upgrades.shield}] (+15B)` : "15 BYTES";
    }
    if (bombBtn) {
        bombBtn.innerText = upgrades.bombs > 0 ? `BOMBS [x${upgrades.bombs}] (+25B)` : "25 BYTES";
    }
}

function initGame() {
    canvas = document.getElementById('flappyCanvas'); 
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    loadHighScore();
    loadUpgrades();
    
    const startBtn = document.getElementById('startGameBtn');
    
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    
    // Move controls over canvas bounds
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const relativeX = (e.clientX - rect.left) * scaleX;
        
        playerX = Math.max(playerWidth, Math.min(canvas.width - playerWidth, relativeX));
    });

    // Touch control
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const relativeX = (touch.clientX - rect.left) * scaleX;
        
        playerX = Math.max(playerWidth, Math.min(canvas.width - playerWidth, relativeX));
    }, { passive: false });

    // Keyboard Arrow Keys & EMP Bomb Trigger
    document.addEventListener('keydown', (e) => {
        const arcadeTab = document.getElementById('arcadeTabContent');
        if (arcadeTab && arcadeTab.classList.contains('d-none')) return;

        if (e.code === 'ArrowLeft') {
            playerX = Math.max(playerWidth, playerX - 16);
        } else if (e.code === 'ArrowRight') {
            playerX = Math.min(canvas.width - playerWidth, playerX + 16);
        } else if (e.code === 'KeyB') {
            // Trigger EMP bomb shockwave
            if (gameActive && upgrades.bombs > 0) {
                triggerEMPBomb();
            }
        }
    });

    // Difficulty selectors
    const diffButtons = document.querySelectorAll('[data-diff]');
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            diffButtons.forEach(b => b.classList.remove('active-diff'));
            btn.classList.add('active-diff');
            
            currentDiff = btn.getAttribute('data-diff');
            playSynthSound([500, 700], [0.06, 0.08], 'sine', 0.05);
            
            if (gameActive) {
                triggerGameOver();
            } else {
                drawInitialGrid();
            }
        });
    });

    // Skin selector
    const skinSelect = document.getElementById('gameSkinSelect');
    if (skinSelect) {
        skinSelect.addEventListener('change', (e) => {
            currentSkin = skinSelect.value;
            playSynthSound([550, 750], [0.05, 0.05], 'sine', 0.05);
            if (!gameActive) {
                drawInitialGrid();
            }
        });
    }
    
    drawInitialGrid();
}

function drawInitialGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#11151d';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    drawPlayerJet(playerX, playerY);
}

function startGame() {
    if (gameActive) return;
    
    playerX = 240;
    score = 0;
    bullets = [];
    enemies = [];
    gameFrame = 0;
    bombFlashActive = 0;
    gameActive = true;
    
    document.getElementById('gameScore').innerText = '0';
    document.getElementById('gameOverlay').classList.add('d-none');
    
    playJumpSound();
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGameLoop, 1000 / 60);
}

function triggerEMPBomb() {
    upgrades.bombs--;
    saveUpgrades();
    
    playBombExplosionSound();
    bombFlashActive = 12; // trigger screen flash frames
    
    // Wipe all screen enemies and grant credits
    const enemiesClearedCount = enemies.length;
    score += enemiesClearedCount;
    credits += enemiesClearedCount;
    document.getElementById('gameScore').innerText = score;
    enemies = [];
    
    saveUpgrades();
}

function triggerGameOver() {
    gameActive = false;
    clearInterval(gameInterval);
    playCrashSound();
    saveHighScore();
    
    const overlay = document.getElementById('gameOverlay');
    const title = document.getElementById('overlayTitle');
    const subtitle = document.getElementById('overlaySubtitle');
    const btn = document.getElementById('startGameBtn');
    
    title.innerText = "JET CRASHED!";
    title.className = "font-tech text-neon-magenta mb-2";
    subtitle.innerText = `[${currentDiff.toUpperCase()} MODE] Score: ${score}. High Score: ${highScore}. Defend the network next time!`;
    btn.innerText = "RESTART MISSION";
    
    overlay.classList.remove('d-none');
}

function updateGameLoop() {
    gameFrame++;
    const settings = diffSettings[currentDiff];
    
    if (bombFlashActive > 0) bombFlashActive--;

    // Automatic shoot every 14 frames
    if (gameFrame % 14 === 0) {
        if (upgrades.double) {
            bullets.push({ x: playerX - 6, y: playerY - 10 });
            bullets.push({ x: playerX + 6, y: playerY - 10 });
        } else {
            bullets.push({ x: playerX, y: playerY - 10 });
        }
        playSynthSound([600, 900], [0.03, 0.03], 'sine', 0.02); // Laser sound
    }
    
    // Spawn enemies
    if (gameFrame % settings.spawnRate === 0) {
        const enemyWidth = 24;
        const enemyX = Math.random() * (canvas.width - enemyWidth * 2) + enemyWidth;
        enemies.push({
            x: enemyX,
            y: -10,
            width: enemyWidth,
            height: 16,
            speed: settings.enemySpeed + Math.random() * 0.3
        });
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= settings.bulletSpeed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        
        // Check collision with player
        if (checkPlayerCollision(enemies[i])) {
            if (upgrades.shield > 0) {
                upgrades.shield--;
                saveUpgrades();
                enemies.splice(i, 1);
                playShieldAbsorbSound();
                continue;
            } else {
                triggerGameOver();
                return;
            }
        }
        
        // Leak in system (enemy reaches bottom)
        if (enemies[i].y > canvas.height) {
            triggerGameOver();
            return;
        }
        
        // Bullet collisions
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkBulletCollision(bullets[j], enemies[i])) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score++;
                credits++; // award credits currency
                document.getElementById('gameScore').innerText = score;
                saveUpgrades();
                playSynthSound([500, 300], [0.06, 0.06], 'sawtooth', 0.04);
                break;
            }
        }
    }
    
    renderCanvas();
}

function checkPlayerCollision(enemy) {
    return (
        enemy.x - enemy.width/2 < playerX + playerWidth/2 &&
        enemy.x + enemy.width/2 > playerX - playerWidth/2 &&
        enemy.y - enemy.height/2 < playerY + playerHeight/2 &&
        enemy.y + enemy.height/2 > playerY - playerHeight/2
    );
}

function checkBulletCollision(bullet, enemy) {
    return (
        bullet.x > enemy.x - enemy.width/2 &&
        bullet.x < enemy.x + enemy.width/2 &&
        bullet.y > enemy.y - enemy.height/2 &&
        bullet.y < enemy.y + enemy.height/2
    );
}

function drawPlayerJet(x, y) {
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = accentColor;
    
    // Draw force shield outline if active
    if (upgrades.shield > 0) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    if (currentSkin === 'visor') {
        // Cyan space fighter jet
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x - 12, y + 8);
        ctx.lineTo(x - 4, y + 4);
        ctx.lineTo(x + 4, y + 4);
        ctx.lineTo(x + 12, y + 8);
        ctx.closePath();
        ctx.fill();
        
        // Neon thruster
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.fillRect(x - 3, y + 5, 6, 4);
    } 
    else if (currentSkin === 'glitch') {
        // Green matrix fighter jet shape
        ctx.fillStyle = accentColor;
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▲", x, y);
        ctx.fillText("01", x - 10, y + 4);
        ctx.fillText("10", x + 10, y + 4);
    } 
    else if (currentSkin === 'skull') {
        // Red alien command jet
        ctx.shadowColor = '#ff007f';
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x - 10, y + 6);
        ctx.lineTo(x + 10, y + 6);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = "8px monospace";
        ctx.fillText("☠", x, y + 1);
    } 
    else if (currentSkin === 'pixel') {
        // Orange retro arcade cube ship
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x - 8, y - 4, 16, 8);
        ctx.fillRect(x - 2, y - 8, 4, 4);
        ctx.fillRect(x - 12, y + 2, 4, 4);
        ctx.fillRect(x + 8, y + 2, 4, 4);
    }
    
    ctx.shadowBlur = 0;
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid backdrop
    ctx.strokeStyle = '#090d14';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw bullets
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f0ff';
    ctx.fillStyle = accentColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = accentColor;
    bullets.forEach(b => {
        ctx.fillRect(b.x - 2, b.y - 4, 4, 8);
    });
    
    // Draw enemies (Bugs)
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    enemies.forEach(e => {
        ctx.fillRect(e.x - 8, e.y - 6, 16, 12);
        // Antennas
        ctx.fillRect(e.x - 6, e.y - 10, 2, 4);
        ctx.fillRect(e.x + 4, e.y - 10, 2, 4);
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(e.x - 4, e.y - 4, 2, 2);
        ctx.fillRect(e.x + 2, e.y - 4, 2, 2);
        ctx.fillStyle = '#ff007f';
    });
    
    ctx.shadowBlur = 0;
    
    drawPlayerJet(playerX, playerY);

    // Draw inventory indicators on canvas overlay
    ctx.fillStyle = accentColor;
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    if (upgrades.shield > 0) {
        ctx.fillText(`SHLD: ${upgrades.shield}`, 12, 24);
    }
    if (upgrades.bombs > 0) {
        ctx.fillText(`BOMB: ${upgrades.bombs} [B]`, 12, 36);
    }

    // Shockwave Screen Flash overlay rendering
    if (bombFlashActive > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${bombFlashActive / 12})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}


// --- 5. SCROLL TO TOP HUD SYSTEM ---
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 450) {
            scrollTopBtn.classList.remove('d-none');
        } else {
            scrollTopBtn.classList.add('d-none');
        }
    });
    
    scrollTopBtn.addEventListener('click', () => {
        playSynthSound([600, 800], [0.08, 0.1], 'sine', 0.05);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// --- 6. HERO TYPING LOOP TEXT CYCLER ---
function initTypingAnimation() {
    const subtitleNode = document.querySelector('.hero-section h2');
    if (!subtitleNode) return;

    const phrases = [
        "AKA (XORNOTFOUND)",
        "FOUNDER OF RIVOXA",
        "AI / MACHINE LEARNING ENGINEER",
        "FULLSTACK DEVELOPER (+3 YRS EXP)"
    ];
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function typeLoop() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            subtitleNode.innerText = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            subtitleNode.innerText = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typingSpeed = isDeleting ? 30 : 60;
        
        if (!isDeleting && charIndex === currentPhrase.length) {
            typingSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 400;
        }
        
        setTimeout(typeLoop, typingSpeed);
    }
    
    typeLoop();
}


// --- 7. SCROLL ENTRANCE ANIMATIONS (AOS Observer) ---
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => observer.observe(el));
}


// --- 8. DYNAMIC THEME ACCENT SWAPPER ---
const themeColors = {
    cyan: { val: '#00f0ff', glow: '0 0 15px rgba(0, 240, 255, 0.4)' },
    magenta: { val: '#ff007f', glow: '0 0 15px rgba(255, 0, 127, 0.4)' },
    green: { val: '#39ff14', glow: '0 0 15px rgba(57, 255, 20, 0.4)' },
    yellow: { val: '#f59e0b', glow: '0 0 15px rgba(245, 158, 11, 0.4)' }
};

function initThemeSwapper() {
    const swatches = document.querySelectorAll('.accent-dot');
    swatches.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const colorKey = dot.getAttribute('data-color');
            const theme = themeColors[colorKey];
            if (!theme) return;
            
            playSynthSound([440, 880], [0.08, 0.12], 'sine', 0.05);
            
            document.documentElement.style.setProperty('--neon-cyan', theme.val);
            document.documentElement.style.setProperty('--cyan-glow', theme.glow);
            
            swatches.forEach(s => s.classList.remove('active'));
            dot.classList.add('active');
            
            if (!gameActive) {
                drawInitialGrid();
            }
        });
    });
}


// --- 9. FLOATING BACKGROUND PARTICLES SYSTEM ---
function initBgParticles() {
    const bgCanvas = document.getElementById('bgParticlesCanvas');
    if (!bgCanvas) return;
    
    const bgCtx = bgCanvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    class Particle {
        constructor() {
            this.x = Math.random() * bgCanvas.width;
            this.y = Math.random() * bgCanvas.height;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.size = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
        }
        
        draw(accentColor) {
            bgCtx.fillStyle = accentColor + '20';
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }
    
    const particleCount = 55;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animateBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f0ff';
        
        particles.forEach(p => {
            p.update();
            p.draw(accentColor);
        });
        
        bgCtx.strokeStyle = accentColor + '07';
        bgCtx.lineWidth = 0.8;
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 110) {
                    bgCtx.beginPath();
                    bgCtx.moveTo(particles[i].x, particles[i].y);
                    bgCtx.lineTo(particles[j].x, particles[j].y);
                    bgCtx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animateBg);
    }
    
    animateBg();
}


// --- 10. NEON HUD CURSOR FOLLOWER ---
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
const cursorEase = 0.16;

function initCursorFollower() {
    const cursor = document.getElementById('cursorFollower');
    if (!cursor) return;
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (cursor.style.display !== 'block' && window.matchMedia('(pointer: fine)').matches) {
            cursor.style.display = 'block';
        }
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.display = 'none';
    });

    function updateCursor() {
        if (window.matchMedia('(pointer: fine)').matches && cursor.style.display !== 'none') {
            cursorX += (mouseX - cursorX) * cursorEase;
            cursorY += (mouseY - cursorY) * cursorEase;
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
        }
        requestAnimationFrame(updateCursor);
    }
    updateCursor();
    
    function addHoverListeners() {
        const hoverTargets = document.querySelectorAll('a, button, .clickable-skill, .accent-dot, .compiler-tab, #flappyCanvas, select');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });
    }
    addHoverListeners();
    
    const startBtn = document.getElementById('startGameBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            setTimeout(addHoverListeners, 100);
        });
    }
}


// --- 11. 3D PERSPECTIVE TILT CARDS ANIMATION ---
function init3DTilt() {
    const cards = document.querySelectorAll('.cyber-card, .rgb-card-border');
    if (window.matchMedia('(pointer: coarse)').matches) return; // Skip touchscreens
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((centerY - y) / centerY) * 7;
            const rotateY = ((x - centerX) / centerX) * 7;
            
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.style.transition = 'transform 0.1s ease-out';
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });
}


// --- 12. MATRIX DECRYPTION OVERLAY (EASTER EGG) ---
function initMatrixRain() {
    const brandLink = document.querySelector('.navbar-brand');
    const overlay = document.getElementById('matrixOverlay');
    const matrixCanvas = document.getElementById('matrixCanvas');
    if (!brandLink || !overlay || !matrixCanvas) return;
    
    const matrixCtx = matrixCanvas.getContext('2d');
    let rainInterval = null;
    
    brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        playSynthSound([523.25, 261.63, 130.81], [0.12, 0.12, 0.35], 'sawtooth', 0.15);
        overlay.classList.remove('d-none');
        
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]+=#*()";
        const fontSize = 15;
        const columns = matrixCanvas.width / fontSize;
        
        const rainDrops = [];
        for (let x = 0; x < columns; x++) {
            rainDrops[x] = 1;
        }
        
        function drawRain() {
            matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f0ff';
            matrixCtx.fillStyle = accentColor;
            matrixCtx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                matrixCtx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
                
                if (rainDrops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        }
        
        clearInterval(rainInterval);
        rainInterval = setInterval(drawRain, 30);
    });
    
    overlay.addEventListener('click', () => {
        playSynthSound([1046.50, 523.25], [0.08, 0.12], 'sine', 0.08);
        overlay.classList.add('d-none');
        clearInterval(rainInterval);
    });
}


// --- 13. FLOATING HUD TERMINAL DRAWER CLIENT CONSOLE ---
function appendTerminalDrawerLog(text) {
    const log = document.getElementById('drawerTerminalLog');
    if (!log) return;
    log.innerHTML += text + "<br>";
    log.scrollTop = log.scrollHeight;
}

function processTerminalDrawerCommand(cmd) {
    cmd = cmd.trim().toLowerCase();
    if (!cmd) return;
    
    appendTerminalDrawerLog(`<span class="text-neon-cyan">Guest@XORNOTFOUND:~#</span> ${cmd}`);
    playSynthSound([600], [0.06], 'sine', 0.08);
    
    // Command prefixes parser
    if (cmd.startsWith('theme ')) {
        const color = cmd.substring(6).trim();
        const dot = document.querySelector(`.accent-dot[data-color="${color}"]`);
        if (dot) {
            dot.click();
            appendTerminalDrawerLog(`<span class="text-success">[THEME] Successfully swapped theme color to ${color.toUpperCase()}.</span>`);
        } else {
            appendTerminalDrawerLog(`<span class="text-danger">[THEME] Color accent '${color}' not found. Available: cyan, magenta, green, yellow.</span>`);
        }
        return;
    }
    
    if (cmd.startsWith('beats ')) {
        const action = cmd.substring(6).trim();
        if (action === 'play' || action === 'start' || action === 'on') {
            if (!musicActive) {
                document.getElementById('bgMusicBtn').click();
            }
            appendTerminalDrawerLog(`<span class="text-success">[BEATS] Space ambient sound loop initiated.</span>`);
        } else if (action === 'stop' || action === 'pause' || action === 'off') {
            if (musicActive) {
                document.getElementById('bgMusicBtn').click();
            }
            appendTerminalDrawerLog(`<span class="text-warning">[BEATS] Sound loop deactivated.</span>`);
        } else {
            appendTerminalDrawerLog(`<span class="text-danger">[BEATS] Usage: beats play | beats stop</span>`);
        }
        return;
    }
    
    if (cmd.startsWith('game ')) {
        const action = cmd.substring(5).trim();
        if (action === 'start' || action === 'play') {
            document.getElementById('tabArcadeBtn').click();
            startGame();
            appendTerminalDrawerLog(`<span class="text-success">[GAME] Cyber Jet Shooter starting...</span>`);
        } else if (action === 'stop' || action === 'exit' || action === 'over') {
            if (gameActive) triggerGameOver();
            appendTerminalDrawerLog(`<span class="text-warning">[GAME] Mission aborted.</span>`);
        } else {
            appendTerminalDrawerLog(`<span class="text-danger">[GAME] Usage: game start | game stop</span>`);
        }
        return;
    }
    
    if (cmd.startsWith('diff ') || cmd.startsWith('difficulty ')) {
        const diff = cmd.replace('difficulty ', '').replace('diff ', '').trim();
        const diffBtn = document.getElementById(`diff${diff.charAt(0).toUpperCase() + diff.slice(1)}`);
        if (diffBtn) {
            diffBtn.click();
            appendTerminalDrawerLog(`<span class="text-success">[DIFF] Game difficulty successfully set to ${diff.toUpperCase()}.</span>`);
        } else {
            appendTerminalDrawerLog(`<span class="text-danger">[DIFF] Options: easy, medium, hard</span>`);
        }
        return;
    }
    
    if (cmd.startsWith('buy ')) {
        const item = cmd.substring(4).trim();
        if (item === 'double' || item === 'laser' || item === 'lasers') {
            document.getElementById('buyDoubleBtn').click();
            appendTerminalDrawerLog(`<span class="text-success">[SHOP] Dispatched Double Laser request. Check Upgrades console.</span>`);
        } else if (item === 'shield' || item === 'force') {
            document.getElementById('buyShieldBtn').click();
            appendTerminalDrawerLog(`<span class="text-success">[SHOP] Dispatched Shield module request. Check Upgrades console.</span>`);
        } else if (item === 'bomb' || item === 'emp') {
            document.getElementById('buyBombBtn').click();
            appendTerminalDrawerLog(`<span class="text-success">[SHOP] Dispatched EMP Bomb request. Check Upgrades console.</span>`);
        } else {
            appendTerminalDrawerLog(`<span class="text-danger">[SHOP] Usage: buy double | buy shield | buy bomb</span>`);
        }
        return;
    }

    switch (cmd) {
        case 'help':
            appendTerminalDrawerLog(`Available Commands:<br>
            - <span class="text-yellow">help</span>: Lists all scripts.<br>
            - <span class="text-yellow">about</span>: Prints developer bio details.<br>
            - <span class="text-yellow">skills</span>: Evaluates technical stack.<br>
            - <span class="text-yellow">rivoxa</span>: Evaluates Rivoxa Agency profile.<br>
            - <span class="text-yellow">contact</span>: Prints contact coordinates.<br>
            - <span class="text-yellow">system</span>: Prints simulated server diagnostics telemetry.<br>
            - <span class="text-yellow">audit</span> / <span class="text-yellow">scan</span>: Performs network diagnostics check.<br>
            - <span class="text-yellow">credits</span>: Displays Byte/Credits balance.<br>
            - <span class="text-yellow">theme [cyan/magenta/green/yellow]</span>: Swaps accents.<br>
            - <span class="text-yellow">beats [play/stop]</span>: Toggles music tracks.<br>
            - <span class="text-yellow">game [start/stop]</span>: Controls Shooter arcade.<br>
            - <span class="text-yellow">diff [easy/medium/hard]</span>: Updates game speed.<br>
            - <span class="text-yellow">buy [double/shield/bomb]</span>: Purchase shop modules.<br>
            - <span class="text-yellow">matrix</span>: Decrypts security overlay.<br>
            - <span class="text-yellow">glitch</span>: Scrambles viewport headings.<br>
            - <span class="text-yellow">clear</span>: Wipes log buffers.`);
            break;
            
        case 'about':
            appendTerminalDrawerLog(`[EVALUATING PROFILE]:<br>
            NAME: AYUSH SHUKLA (AKA XORNOTFOUND)<br>
            EXP: +3 Years Professional Coding<br>
            GUILD: Rivoxa Automation & AI Engineering`);
            break;
            
        case 'skills':
            appendTerminalDrawerLog(`[LANGUAGES]: Python, Java, C, C++, JS<br>
            [FRONTEND]: Flutter, React, Next.js<br>
            [BACKEND]: Node.js, Express<br>
            [DATABASE]: MongoDB NoSQL<br>
            [AI/ML]: Scikit-Learn pipelines`);
            break;
            
        case 'rivoxa':
            appendTerminalDrawerLog(`[RIVOXA SEARCH]: Automation Digital Marketing Agency.<br>
            Specialization: Automating client acquisition pipelines and deploying growth marketing campaign pipelines.`);
            break;
            
        case 'contact':
            appendTerminalDrawerLog(`EMAIL: <span class="text-neon-magenta">rivoxapvt@gmail.com</span><br>
            INSTA: <span class="text-neon-cyan">@__ayushzz_</span>`);
            break;
            
        case 'scan':
        case 'audit':
            appendTerminalDrawerLog(`<span class="text-warning">[INITIATING SECURITY AUDIT ON PORTFOLIO SECTORS...]</span>`);
            let scanStep = 0;
            const scanLogs = [
                "Scanning port 8000 (Local Host)... OPEN",
                "Auditing encryption handshakes... SECURE",
                "Probing database injection nodes... SAFE (0 vulnerabilities)",
                "Analyzing network traffic filters... COMPILER STABLE",
                "Sanitizing memory stacks... WIPE SUCCESSFUL",
                "<span class='text-success'>[AUDIT COMPLETE] Systems 100% secured & optimized.</span>"
            ];
            function runScanAnimation() {
                if (scanStep < scanLogs.length) {
                    appendTerminalDrawerLog(`[+] ${scanLogs[scanStep]}`);
                    scanStep++;
                    playSynthSound([800 + (scanStep * 80)], [0.05], 'sine', 0.04);
                    setTimeout(runScanAnimation, 600);
                }
            }
            setTimeout(runScanAnimation, 400);
            break;

        case 'system':
        case 'status':
            appendTerminalDrawerLog(`[DIAGNOSING NETWORK TELEMETRY]:<br>
            - CPU TEMP: 44.2°C (STABLE)<br>
            - UPTIME: 247.8 Hours (ACTIVE)<br>
            - THREADS: 8 Active Pools<br>
            - MEMORY LEAK RATE: 0.00% (SECURE)<br>
            - SECTOR SECURE DECRYPTION: 100% OK`);
            break;

        case 'credits':
        case 'balance':
            appendTerminalDrawerLog(`[ACCOUNT BALANCE]: ${credits} Bytes/Credits available.`);
            break;
            
        case 'matrix':
        case 'hack':
            appendTerminalDrawerLog(`<span class="text-warning">REDIRECTING... BOOTING SECRET DATA DECIPHER ENGINE</span>`);
            setTimeout(() => {
                document.querySelector('.navbar-brand').click();
            }, 800);
            break;
            
        case 'clear':
            const logBox = document.getElementById('drawerTerminalLog');
            if (logBox) logBox.innerHTML = "Console buffer cleared. Type 'help' for options.<br><br>Guest@XORNOTFOUND:~#";
            break;
            
        case 'cheat':
            highScore = 999;
            credits = 9999; // grant bytes credits
            document.getElementById('gameHighScore').innerText = highScore;
            localStorage.setItem('xor_shooter_high', 999);
            saveUpgrades();
            appendTerminalDrawerLog(`<span class="text-success">[CHEAT ACTIVATED] Space Shooter stats & credits maxed!</span>`);
            break;
            
        case 'glitch':
            appendTerminalDrawerLog(`<span class="text-warning">[CORRUPTING COMPILER SECTORS] Triggering visual text scramble...</span>`);
            triggerPageGlitchScramble();
            break;
            
        default:
            appendTerminalDrawerLog(`<span class="text-danger">Error: Command '${cmd}' not recognized. Type 'help' for script list.</span>`);
            break;
    }
}

function scrambleText(element, duration = 1200) {
    const originalText = element.innerText;
    const chars = '!@#$%^&*()_+-=[]{}|;:",./<>?';
    let startTime = null;
    
    function update(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        
        if (progress >= duration) {
            element.innerText = originalText;
            return;
        }
        
        const percent = progress / duration;
        const normalCount = Math.floor(percent * originalText.length);
        const scrambleCount = originalText.length - normalCount;
        
        let result = originalText.substring(0, normalCount);
        for (let i = 0; i < scrambleCount; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        element.innerText = result;
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function triggerPageGlitchScramble() {
    playSynthSound([150, 300, 450, 100], [0.1, 0.1, 0.1, 0.4], 'sawtooth', 0.15);
    
    const targets = document.querySelectorAll('h1, h2, h3, .nav-link');
    targets.forEach(el => {
        if (el.innerText.trim() && el.childElementCount === 0) {
            scrambleText(el, 1400);
        }
    });
}

function initHeadingGlitches() {
    const heroHeader = document.querySelector('.hero-section h1');
    if (heroHeader) {
        heroHeader.addEventListener('mouseenter', () => {
            playSynthSound([200, 350], [0.05, 0.08], 'sawtooth', 0.08);
            scrambleText(heroHeader, 900);
        });
    }
}

function initTerminalDrawer() {
    const toggleBtn = document.getElementById('terminalToggleBtn');
    const drawer = document.getElementById('terminalDrawer');
    const closeBtn = document.getElementById('closeTerminalBtn');
    const form = document.getElementById('drawerTerminalForm');
    const input = document.getElementById('drawerTerminalInput');
    
    if (!toggleBtn || !drawer || !closeBtn || !form || !input) return;
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.toggle('d-none');
        playSynthSound([500, 600], [0.08, 0.1], 'sine', 0.05);
        if (!drawer.classList.contains('d-none')) {
            input.focus();
        }
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.add('d-none');
        playSynthSound([600, 400], [0.08, 0.1], 'sine', 0.05);
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmdVal = input.value;
        processTerminalDrawerCommand(cmdVal);
        input.value = "";
    });
}


// --- 14. ARCADE INTERACTIVE TABS & HACKER COMPILER SIMULATOR & UPGRADES SHOP ---
const pythonHackerCode = `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score

# --- XORNOTFOUND NEURAL NETWORK INGESTION ---
class CyberClassifier:
    def __init__(self, learning_rate=0.01, epochs=1000):
        self.lr = learning_rate
        self.epochs = epochs
        self.weights = None
        self.bias = None

    def sigmoid(self, z):
        return 1 / (1 + np.exp(-z))

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        # Gradient Descent loop optimizer
        for epoch in range(self.epochs):
            linear_model = np.dot(X, self.weights) + self.bias
            predictions = self.sigmoid(linear_model)

            dw = (1 / n_samples) * np.dot(X.T, (predictions - y))
            db = (1 / n_samples) * np.sum(predictions - y)

            self.weights -= self.lr * dw
            self.bias -= self.lr * db
            
    def predict(self, X):
        linear_model = np.dot(X, self.weights) + self.bias
        predictions = self.sigmoid(linear_model)
        return [1 if i > 0.5 else 0 for i in predictions]

# Initializing Scikit-Learn Data Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Training model segment
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
pipeline.fit(X_train, y_train)

# System evaluation logs
predictions = pipeline.predict(X_test)
print("COMPILER SCORE: ", accuracy_score(y_test, predictions))
print(classification_report(y_test, predictions))
# UNLOCKED SECTOR STATUS: 100% OK
`;

let compilerCodeIndex = 0;
let isCompilerComplete = false;

function initArcadeTabs() {
    const tabArcade = document.getElementById('tabArcadeBtn');
    const tabCompiler = document.getElementById('tabCompilerBtn');
    const tabShop = document.getElementById('tabShopBtn');
    
    const contentArcade = document.getElementById('arcadeTabContent');
    const contentCompiler = document.getElementById('compilerTabContent');
    const contentShop = document.getElementById('shopTabContent');
    
    if (!tabArcade || !tabCompiler || !tabShop || !contentArcade || !contentCompiler || !contentShop) return;
    
    // Tab switching controls
    tabArcade.addEventListener('click', () => {
        playSynthSound([500], [0.08], 'sine', 0.05);
        tabArcade.classList.add('active-tab');
        tabCompiler.classList.remove('active-tab');
        tabShop.classList.remove('active-tab');
        
        contentArcade.classList.remove('d-none');
        contentCompiler.classList.add('d-none');
        contentShop.classList.add('d-none');
    });
    
    tabCompiler.addEventListener('click', () => {
        playSynthSound([600], [0.08], 'sine', 0.05);
        tabCompiler.classList.add('active-tab');
        tabArcade.classList.remove('active-tab');
        tabShop.classList.remove('active-tab');
        
        contentCompiler.classList.remove('d-none');
        contentArcade.classList.add('d-none');
        contentShop.classList.add('d-none');
    });

    tabShop.addEventListener('click', () => {
        playSynthSound([550], [0.08], 'sine', 0.05);
        tabShop.classList.add('active-tab');
        tabArcade.classList.remove('active-tab');
        tabCompiler.classList.remove('active-tab');
        
        contentShop.classList.remove('d-none');
        contentArcade.classList.add('d-none');
        contentCompiler.classList.add('d-none');
        
        // Refresh credit views inside shop tab
        document.getElementById('shopCredits').innerText = credits;
    });

    // Hacker compiler keystrokes simulator logic
    const codeBox = document.getElementById('compilerCodeBox');
    const progressText = document.getElementById('compilerProgress');
    const overlay = document.getElementById('compilerOverlay');
    const resetBtn = document.getElementById('resetCompilerBtn');

    window.addEventListener('keydown', (e) => {
        if (contentCompiler.classList.contains('d-none') || isCompilerComplete) return;
        
        if (["Space", "ArrowUp", "ArrowDown", "Tab"].includes(e.code)) {
            e.preventDefault();
        }

        if (compilerCodeIndex === 0) {
            codeBox.innerHTML = "";
        }

        const charsPerPress = 5;
        const slice = pythonHackerCode.substring(compilerCodeIndex, compilerCodeIndex + charsPerPress);
        codeBox.innerText += slice;
        compilerCodeIndex += charsPerPress;

        codeBox.scrollTop = codeBox.scrollHeight;

        const progress = Math.min(100, Math.floor((compilerCodeIndex / pythonHackerCode.length) * 100));
        progressText.innerText = `PROGRESS: ${progress}%`;

        playSynthSound([1500 - (progress * 10)], [0.04], 'sine', 0.04);

        if (progress >= 100) {
            isCompilerComplete = true;
            playSynthSound([523.25, 659.25, 783.99, 1046.50], [0.15, 0.15, 0.15, 0.5], 'triangle', 0.1);
            overlay.classList.remove('d-none');
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            playSynthSound([600, 400], [0.08, 0.1], 'sine', 0.05);
            codeBox.innerText = "Click here and type any keys on your keyboard to compile machine learning models...";
            compilerCodeIndex = 0;
            isCompilerComplete = false;
            progressText.innerText = "PROGRESS: 0%";
            overlay.classList.add('d-none');
        });
    }

    // Upgrades hardware shop purchase listeners
    const dblBtn = document.getElementById('buyDoubleBtn');
    const shldBtn = document.getElementById('buyShieldBtn');
    const bombBtn = document.getElementById('buyBombBtn');
    
    if (dblBtn) {
        dblBtn.addEventListener('click', () => {
            if (credits >= 10 && !upgrades.double) {
                credits -= 10;
                upgrades.double = true;
                saveUpgrades();
                playSynthSound([523.25, 659.25], [0.08, 0.12], 'sine', 0.08); // upgrade success
            } else if (upgrades.double) {
                playSynthSound([200], [0.08], 'sine', 0.05); // already owned
            } else {
                playSynthSound([150, 100], [0.08, 0.08], 'sawtooth', 0.08); // error
            }
        });
    }

    if (shldBtn) {
        shldBtn.addEventListener('click', () => {
            if (credits >= 15) {
                credits -= 15;
                upgrades.shield++;
                saveUpgrades();
                playSynthSound([523.25, 783.99], [0.08, 0.12], 'sine', 0.08);
            } else {
                playSynthSound([150, 100], [0.08, 0.08], 'sawtooth', 0.08);
            }
        });
    }

    if (bombBtn) {
        bombBtn.addEventListener('click', () => {
            if (credits >= 25) {
                credits -= 25;
                upgrades.bombs++;
                saveUpgrades();
                playSynthSound([659.25, 1046.50], [0.08, 0.12], 'sine', 0.08);
            } else {
                playSynthSound([150, 100], [0.08, 0.08], 'sawtooth', 0.08);
            }
        });
    }
}


// --- 15. STATE ENGINE STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    initTypingAnimation();
    initSkillRedirects();
    initGame();
    initScrollToTop();
    initScrollReveal();
    initThemeSwapper();
    initBgParticles();
    initCursorFollower();
    initSoundtrackToggle();
    init3DTilt();
    initMatrixRain();
    initTerminalDrawer();
    initHeadingGlitches();
    initArcadeTabs();
});
