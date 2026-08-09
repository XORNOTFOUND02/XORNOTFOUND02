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


// --- 4. FLAPPY BUG CANVAS GAME ENGINE WITH DIFFICULTY SCALING ---
let canvas = null;
let ctx = null;
let gameInterval = null;
let gameActive = false;

// Physics scaling values mapped to difficulty settings
const diffSettings = {
    easy: { gravity: 0.18, jump: -3.8, pipeSpeed: 1.2, pipeSpacing: 230, pipeGap: 122 },
    medium: { gravity: 0.22, jump: -4.2, pipeSpeed: 1.6, pipeSpacing: 190, pipeGap: 108 },
    hard: { gravity: 0.26, jump: -4.5, pipeSpeed: 2.3, pipeSpacing: 140, pipeGap: 95 }
};
const PIPE_WIDTH = 44;

let currentDiff = 'easy';

// State parameters
let visorY = 160;
let visorVelocity = 0;
const visorX = 75;
const visorRadius = 11;
let score = 0;
let highScore = 0;
let pipes = [];
let gameFrame = 0;

function loadHighScore() {
    try {
        const stored = localStorage.getItem('xor_flappy_high');
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
            localStorage.setItem('xor_flappy_high', highScore);
        } catch (e) {
            console.warn("localStorage score write error:", e);
        }
    }
}

function initGame() {
    canvas = document.getElementById('flappyCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    loadHighScore();
    
    const startBtn = document.getElementById('startGameBtn');
    
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });
    
    canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCanvasTap();
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCanvasTap();
    }, { passive: false });

    // Keyboard Spacebar Jump
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const rect = canvas.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
            );
            
            if (isInViewport) {
                e.preventDefault();
                handleCanvasTap();
            }
        }
    });

    // Difficulty settings selectors
    const diffButtons = document.querySelectorAll('[data-diff]');
    diffButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            diffButtons.forEach(b => b.classList.remove('active-diff'));
            btn.classList.add('active-diff');
            
            currentDiff = btn.getAttribute('data-diff');
            playSynthSound([500, 700], [0.06, 0.08], 'sine', 0.05);
            
            if (gameActive) {
                triggerGameOver(); // reset active run
            } else {
                drawInitialGrid();
            }
        });
    });
    
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
    
    drawVisor(visorX, visorY);
}

function startGame() {
    if (gameActive) return;
    
    visorY = 140;
    visorVelocity = 0;
    score = 0;
    pipes = [];
    gameFrame = 0;
    gameActive = true;
    
    document.getElementById('gameScore').innerText = '0';
    document.getElementById('gameOverlay').classList.add('d-none');
    
    playJumpSound();
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGameLoop, 1000 / 60);
}

function handleCanvasTap() {
    const settings = diffSettings[currentDiff];
    if (!gameActive) {
        startGame();
    } else {
        visorVelocity = settings.jump;
        playJumpSound();
    }
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
    
    title.innerText = "COMPILER CRASH!";
    title.className = "font-tech text-neon-magenta mb-2";
    subtitle.innerText = `[${currentDiff.toUpperCase()} MODE] Final Score: ${score}. High Score: ${highScore}. Try again to debug!`;
    btn.innerText = "RESTART GAME";
    
    overlay.classList.remove('d-none');
}

function updateGameLoop() {
    gameFrame++;
    const settings = diffSettings[currentDiff];
    
    visorVelocity += settings.gravity;
    visorY += visorVelocity;
    
    if (visorY + visorRadius >= canvas.height) {
        visorY = canvas.height - visorRadius;
        triggerGameOver();
        return;
    }
    if (visorY - visorRadius <= 0) {
        visorY = visorRadius;
        visorVelocity = 0.5;
    }
    
    if (gameFrame % settings.pipeSpacing === 0 || pipes.length === 0) {
        const minHeight = 40;
        const maxHeight = canvas.height - settings.pipeGap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
        const bottomHeight = canvas.height - topHeight - settings.pipeGap;
        
        pipes.push({
            x: canvas.width,
            top: topHeight,
            bottom: bottomHeight,
            passed: false
        });
    }
    
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= settings.pipeSpeed;
        
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < visorX) {
            pipes[i].passed = true;
            score++;
            document.getElementById('gameScore').innerText = score;
            playScoreSound();
        }
        
        if (checkCollision(pipes[i])) {
            triggerGameOver();
            return;
        }
        
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
    
    renderCanvas();
}

function checkCollision(pipe) {
    if (visorX + visorRadius > pipe.x && visorX - visorRadius < pipe.x + PIPE_WIDTH) {
        const settings = diffSettings[currentDiff];
        if (visorY - visorRadius < pipe.top || visorY + visorRadius > canvas.height - pipe.bottom) {
            return true;
        }
    }
    return false;
}

function drawVisor(x, y) {
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f0ff';
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = accentColor;
    
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y, visorRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#020305';
    ctx.fillRect(x - visorRadius - 1, y - 3, (visorRadius * 2) + 2, 6);
    
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff007f';
    ctx.fillStyle = '#ff007f';
    ctx.fillRect(x - 5, y - 1, 10, 2);
    
    ctx.shadowBlur = 0;
}

function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    pipes.forEach(pipe => {
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 0, 127, 0.4)';
        ctx.strokeStyle = '#ff007f';
        ctx.fillStyle = 'rgba(255, 0, 127, 0.08)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.rect(pipe.x, 0, PIPE_WIDTH, pipe.top);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.rect(pipe.x, canvas.height - pipe.bottom, PIPE_WIDTH, pipe.bottom);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    });
    
    drawVisor(visorX, visorY);
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
        const hoverTargets = document.querySelectorAll('a, button, .clickable-skill, .accent-dot, .compiler-tab, #flappyCanvas');
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
    
    switch (cmd) {
        case 'help':
            appendTerminalDrawerLog(`Available Commands:<br>
            - <span class="text-yellow">help</span>: Lists all scripts.<br>
            - <span class="text-yellow">about</span>: Prints developer bio details.<br>
            - <span class="text-yellow">skills</span>: Evaluates technical languages stack.<br>
            - <span class="text-yellow">rivoxa</span>: Evaluates Rivoxa Agency profile.<br>
            - <span class="text-yellow">contact</span>: Prints contact coordinates.<br>
            - <span class="text-yellow">matrix</span> / <span class="text-yellow">hack</span>: Decrypts security overlay.<br>
            - <span class="text-yellow">glitch</span>: Triggers cyber matrix text scrambler.<br>
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
            document.getElementById('gameHighScore').innerText = highScore;
            localStorage.setItem('xor_flappy_high', 999);
            appendTerminalDrawerLog(`<span class="text-success">[CHEAT ACTIVATED] Flappy Bug High Score set to 999!</span>`);
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
    
    // Open drawer
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.toggle('d-none');
        playSynthSound([500, 600], [0.08, 0.1], 'sine', 0.05);
        if (!drawer.classList.contains('d-none')) {
            input.focus();
        }
    });
    
    // Close drawer
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.add('d-none');
        playSynthSound([600, 400], [0.08, 0.1], 'sine', 0.05);
    });
    
    // Form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmdVal = input.value;
        processTerminalDrawerCommand(cmdVal);
        input.value = "";
    });
}


// --- 14. STATE ENGINE STARTUP ---
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
});
