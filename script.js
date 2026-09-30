/**
 * ==========================================================
 * ALISON PÁEZ - INTERACTIVE WEBSITE LOGIC
 * Includes Web Audio API effects, Canvas particle system,
 * Interactive pet meter, sound synth, guestbook & confetti
 * ==========================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ========================================================
  // 1. WEB AUDIO API SYNTHESIZER (No external audio files needed!)
  // ========================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play a soft cute chime for buttons and hearts
  function playChime(freq = 587.33, type = 'sine') {
    try {
      initAudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log('Audio feedback not available', e);
    }
  }

  // Sparkle melody
  function playSparkleSound() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playChime(freq, 'triangle');
      }, idx * 70);
    });
  }

  // Ocean wave synthesizer using filtered noise
  let isBeachSoundPlaying = false;
  let waveGainNode = null;
  let waveSourceNode = null;

  function toggleBeachSound() {
    initAudioContext();
    const btnText = document.getElementById('beach-btn-text');

    if (isBeachSoundPlaying) {
      if (waveGainNode) {
        waveGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        setTimeout(() => {
          if (waveSourceNode) {
            waveSourceNode.stop();
            waveSourceNode.disconnect();
          }
        }, 1000);
      }
      isBeachSoundPlaying = false;
      btnText.textContent = 'Escuchar sonido de olas 🌊';
      showToast('Sonido de olas pausado', 'fa-water');
      return;
    }

    try {
      // Generate 5 seconds of white/pink noise buffer
      const bufferSize = audioCtx.sampleRate * 4;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Pink-ish filter
        lastOut = data[i];
      }

      waveSourceNode = audioCtx.createBufferSource();
      waveSourceNode.buffer = buffer;
      waveSourceNode.loop = true;

      // Filter to simulate ocean swells
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);

      // Low frequency oscillator for wave swells
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime); // 5-second wave cycle
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(220, audioCtx.currentTime);
      lfo.connect(filter.frequency);
      lfo.start();

      waveGainNode = audioCtx.createGain();
      waveGainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      waveGainNode.gain.linearRampToValueAtTime(0.22, audioCtx.currentTime + 1.5);

      waveSourceNode.connect(filter);
      filter.connect(waveGainNode);
      waveGainNode.connect(audioCtx.destination);

      waveSourceNode.start();
      isBeachSoundPlaying = true;
      btnText.textContent = 'Pausar olas de la playa ⏸️';
      showToast('Sintetizando la brisa y olas del mar 🌊🐚', 'fa-umbrella-beach');
    } catch (e) {
      console.error(e);
      showToast('No se pudo activar el audio en este navegador', 'fa-circle-exclamation');
    }
  }

  // Chill ambient lofi synthesizer loop for music player
  let isLofiPlaying = false;
  let lofiTimer = null;
  const lofiNotes = [261.63, 329.63, 392.00, 493.88, 523.25, 587.33, 659.25]; // Dreamy scale

  function playLofiChord() {
    if (!isLofiPlaying) return;
    initAudioContext();

    const noteIdx = Math.floor(Math.random() * lofiNotes.length);
    const freq = lofiNotes[noteIdx];

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.4);

    lofiTimer = setTimeout(playLofiChord, 1200 + Math.random() * 800);
  }

  function toggleLofiMusic() {
    initAudioContext();
    const playIcon = document.getElementById('play-icon');
    const soundWaves = document.getElementById('sound-waves');

    if (isLofiPlaying) {
      isLofiPlaying = false;
      clearTimeout(lofiTimer);
      playIcon.classList.remove('fa-pause');
      playIcon.classList.add('fa-play');
      soundWaves.classList.remove('playing');
      showToast('Música ambiental pausada 🌙', 'fa-moon');
    } else {
      isLofiPlaying = true;
      playLofiChord();
      playIcon.classList.remove('fa-play');
      playIcon.classList.add('fa-pause');
      soundWaves.classList.add('playing');
      showToast('Reproduciendo Vibra Morada Chill 💜🎶', 'fa-music');
    }
  }

  // ========================================================
  // 2. CANVAS FLOATING PARTICLES (Hearts, Stars & Purple Orbs)
  // ========================================================
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particlesArray = [];
  const colors = ['#c084fc', '#a855f7', '#e9d5ff', '#ec4899', '#f472b6', '#ffffff'];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, isBurst = false) {
      this.x = x !== undefined ? x : Math.random() * canvas.width;
      this.y = y !== undefined ? y : Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.isHeart = Math.random() > 0.65;
      this.opacity = Math.random() * 0.7 + 0.3;

      if (isBurst) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.decay = Math.random() * 0.015 + 0.01;
      } else {
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = -(Math.random() * 0.8 + 0.3); // Drift upward
        this.decay = 0;
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      if (this.isHeart) {
        // Draw tiny cute heart
        const hSize = this.size * 2;
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        const topCurveHeight = hSize * 0.3;
        ctx.moveTo(0, topCurveHeight);
        // top left curve
        ctx.bezierCurveTo(
          -hSize / 2, -topCurveHeight,
          -hSize, topCurveHeight / 3,
          0, hSize
        );
        // top right curve
        ctx.bezierCurveTo(
          hSize, topCurveHeight / 3,
          hSize / 2, -topCurveHeight,
          0, topCurveHeight
        );
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw glowing circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.decay > 0) {
        this.opacity -= this.decay;
      } else {
        // Loop from bottom to top
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
      }
    }
  }

  // Populate initial floating dust
  function initParticles() {
    particlesArray = [];
    const count = Math.min(Math.floor(window.innerWidth / 20), 65);
    for (let i = 0; i < count; i++) {
      particlesArray.push(new Particle());
    }
  }
  initParticles();

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particlesArray.length - 1; i >= 0; i--) {
      const p = particlesArray[i];
      p.update();
      p.draw();

      if (p.decay > 0 && p.opacity <= 0.05) {
        particlesArray.splice(i, 1);
      }
    }

    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // Burst effect function
  function createBurst(x, y, count = 35) {
    for (let i = 0; i < count; i++) {
      particlesArray.push(new Particle(x, y, true));
    }
  }

  // ========================================================
  // 3. TOAST NOTIFICATION HELPER
  // ========================================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, icon = 'fa-sparkles') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="color: #c084fc; font-size: 1.15rem;"></i>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  // ========================================================
  // 4. NAVIGATION BAR SCROLL & TOGGLE
  // ========================================================
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      } else {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });
  }

  // Close menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        const icon = navToggle.querySelector('i');
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
    });
  });

  // Active section indicator on scroll
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ========================================================
  // 5. INTERACTIVE BUTTONS & ACTIONS
  // ========================================================

  // Sparkle Button
  const sparkleBtn = document.getElementById('sparkle-btn');
  if (sparkleBtn) {
    sparkleBtn.addEventListener('click', (e) => {
      const rect = sparkleBtn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);
      playSparkleSound();
      showToast('¡Lluvia de magia y brillos morados activada! ✨💜', 'fa-wand-magic-sparkles');
    });
  }

  // Navbar Audio button & Floating Player
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const playerPlayBtn = document.getElementById('player-play-btn');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', toggleLofiMusic);
  }
  if (playerPlayBtn) {
    playerPlayBtn.addEventListener('click', toggleLofiMusic);
  }

  // Beach Sound Button
  const beachSoundBtn = document.getElementById('beach-sound-btn');
  if (beachSoundBtn) {
    beachSoundBtn.addEventListener('click', toggleBeachSound);
  }

  // Zoe Petting Interaction
  const petZoeBtn = document.getElementById('pet-zoe-btn');
  const petCountEl = document.getElementById('pet-count');
  let petCount = 12;

  if (petZoeBtn) {
    petZoeBtn.addEventListener('click', (e) => {
      petCount++;
      petCountEl.textContent = petCount;

      const rect = petZoeBtn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
      playChime(784, 'triangle');

      // Create floating heart/paw over Zoe's image
      const zoeImgContainer = document.querySelector('.zoe-image-container');
      if (zoeImgContainer) {
        const floatEmoji = document.createElement('div');
        floatEmoji.textContent = Math.random() > 0.5 ? '🐾' : '💖';
        floatEmoji.style.position = 'absolute';
        floatEmoji.style.left = `${Math.random() * 70 + 15}%`;
        floatEmoji.style.bottom = '20px';
        floatEmoji.style.fontSize = '2rem';
        floatEmoji.style.zIndex = '10';
        floatEmoji.style.pointerEvents = 'none';
        floatEmoji.style.transition = 'all 1s ease-out';

        zoeImgContainer.appendChild(floatEmoji);

        setTimeout(() => {
          floatEmoji.style.transform = 'translateY(-120px) scale(1.4)';
          floatEmoji.style.opacity = '0';
        }, 30);

        setTimeout(() => {
          floatEmoji.remove();
        }, 1100);
      }

      showToast('¡Zoe movió su colita feliz por tu caricia! 🐶💖', 'fa-paw');
    });
  }

  // Salchipapa Craving Meter Button
  const craveBtn = document.getElementById('crave-btn');
  const cravingValEl = document.getElementById('craving-val');
  let cravingAmount = 1000;

  if (craveBtn) {
    craveBtn.addEventListener('click', (e) => {
      cravingAmount += 500;
      cravingValEl.textContent = `${cravingAmount}%`;

      const rect = craveBtn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
      playChime(659, 'sine');

      const messages = [
        '¡Alerta roja! Necesitas una salchipapa gigante ya mismo 🍟🔥',
        '¡Nivel de antojo insuperable! Con tocineta y salsa especial 🤤',
        '¡Una salchipapa con Alison cura cualquier día difícil! 🌭✨',
        '¡El amor por la salchipapa nunca es demasiado! 💖🍟'
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      showToast(randomMsg, 'fa-utensils');
    });
  }

  // Tooth Polish / Smile Simulator
  const polishSmileBtn = document.getElementById('polish-smile-btn');
  const toothShine = document.getElementById('tooth-shine');
  const smileMsg = document.getElementById('smile-msg');

  if (polishSmileBtn) {
    polishSmileBtn.addEventListener('click', () => {
      toothShine.classList.remove('sparkle-active');
      void toothShine.offsetWidth; // trigger reflow
      toothShine.classList.add('sparkle-active');

      playSparkleSound();
      createBurst(window.innerWidth / 2, window.innerHeight / 2, 30);

      const phrases = [
        '¡Sonrisa impecable de pasarela garantizada por la Dra. Alison Páez! ✨🦷',
        '¡Diseño de sonrisa de ensueño activado! Confianza al 1000% 💜',
        '¡Cuidado con amor y vocación! Futura Odontóloga del María Currea 🩺',
        '¡Brillando más que nunca! Tu sonrisa es tu mejor accesorio ✨'
      ];
      smileMsg.textContent = phrases[Math.floor(Math.random() * phrases.length)];
      showToast('¡Sonrisa radiante lista para transformar el mundo! 🦷✨', 'fa-tooth');
    });
  }

  // Special People Love Buttons
  const sendLoveButtons = document.querySelectorAll('.send-love-btn');
  sendLoveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = btn.dataset.target;
      const rect = btn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 35);
      playChime(880, 'sine');

      if (target === 'prima') {
        showToast('¡Le enviaste un abrazo infinito y amor a tu prima hermosa! 💖👯‍♀️', 'fa-heart');
      } else {
        showToast('¡Vibras y abrazos para tus amigos del alma! 🎉✨', 'fa-user-group');
      }
    });
  });

  const loveHeartBtns = document.querySelectorAll('.love-heart-btn');
  loveHeartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
      playChime(987, 'triangle');
      showToast('¡Amor guardado en esta foto favorita! 💜', 'fa-heart');
    });
  });

  // ========================================================
  // 6. GUESTBOOK / BUZÓN DE MENSAJES CON LOCALSTORAGE
  // ========================================================
  const guestbookForm = document.getElementById('guestbook-form');
  const messagesGrid = document.getElementById('messages-grid');
  const messagesCount = document.getElementById('messages-count');
  const emojiButtons = document.querySelectorAll('.emoji-btn');
  let selectedEmoji = '💜';

  // Emoji picker selector
  emojiButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      emojiButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedEmoji = btn.dataset.emoji;
      playChime(500, 'sine');
    });
  });

  // Preloaded messages (initial state)
  const defaultMessages = [
    {
      id: 1,
      name: 'Tu Prima Consentida 💕',
      relation: 'Prima / Familia',
      message: '¡Te amo con toda mi alma Alison! Eres la mejor prima y confidente de este mundo. Siempre estaré para ti apoyándote en tu camino a ser la mejor odontóloga.',
      emoji: '💖',
      date: 'Hoy, con todo mi amor'
    },
    {
      id: 2,
      name: 'Mis Amigos Incondicionales 🌟',
      relation: 'Amigos de Verdad',
      message: '¡Alison, eres la amiga más auténtica, divertida y especial de todas! Gracias por tantas risas compartidas, aventuras y por estar siempre ahí. ¡Te queremos un montón!',
      emoji: '🤪',
      date: 'Ayer por la tarde'
    },
    {
      id: 3,
      name: 'Zoe la Consentida 🐾',
      relation: 'Fan de Zoe',
      message: 'Guau guauuu! Gracias por ser la mejor mamá humana del mundo, darme comidita rica y ponerme mi moñito rosa. ¡Te amo mucho!',
      emoji: '🐾',
      date: 'Siempre a tu lado'
    },
    {
      id: 4,
      name: 'Futura Paciente Feliz 😊',
      relation: 'Visitante Especial',
      message: '¡Sé que vas a ser una odontóloga extraordinaria Alison! Tu calidez y carisma van a devolverle la sonrisa a muchísimas personas. ¡Muchos éxitos!',
      emoji: '🦷',
      date: 'Recientemente'
    }
  ];

  function getStoredMessages() {
    const stored = localStorage.getItem('alison_guestbook_notes_v2');
    if (!stored) {
      localStorage.setItem('alison_guestbook_notes_v2', JSON.stringify(defaultMessages));
      return defaultMessages;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return defaultMessages;
    }
  }

  function renderMessages() {
    const list = getStoredMessages();
    messagesCount.textContent = `${list.length} notas`;
    messagesGrid.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'message-note-card';
      card.innerHTML = `
        <div class="note-header">
          <div class="note-author-info">
            <span class="note-emoji">${item.emoji || '💜'}</span>
            <div>
              <span class="note-author">${escapeHTML(item.name)}</span>
              <span class="note-role">${escapeHTML(item.relation)}</span>
            </div>
          </div>
          <span class="note-date">${item.date}</span>
        </div>
        <p class="note-content">"${escapeHTML(item.message)}"</p>
      `;
      messagesGrid.appendChild(card);
    });
  }

  function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  renderMessages();

  if (guestbookForm) {
    guestbookForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('sender-name');
      const relationInput = document.getElementById('sender-relation');
      const messageInput = document.getElementById('sender-message');

      const name = nameInput.value.trim();
      const relation = relationInput.value;
      const message = messageInput.value.trim();

      if (!name || !message) return;

      const newNote = {
        id: Date.now(),
        name: name,
        relation: relation,
        message: message,
        emoji: selectedEmoji,
        date: 'Hace un momento ✨'
      };

      const currentList = getStoredMessages();
      currentList.unshift(newNote);
      localStorage.setItem('alison_guestbook_notes_v2', JSON.stringify(currentList));

      renderMessages();
      guestbookForm.reset();

      playSparkleSound();
      createBurst(window.innerWidth / 2, window.innerHeight * 0.7, 40);
      showToast('¡Tu dedicatoria se guardó en el muro de Alison! 💌💜', 'fa-heart');
    });
  }

});
