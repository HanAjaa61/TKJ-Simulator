<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import bgmSrc from '../assets/audio/menu-bgm.mp3';
import clickSrc from '../assets/audio/click.mp3';

const emit = defineEmits(['start']);

const bgm = new Audio(bgmSrc);
bgm.loop = true;
bgm.volume = 0.4;

const clickSound = new Audio(clickSrc);
clickSound.volume = 0.6;

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function startGame() {
  playClick();
  bgm.pause();
  emit('start');
}

function exitGame() {
  playClick();
  bgm.pause();
  window.close();
}

onMounted(() => {
  // Izin audio sudah didapat lewat klik tombol "Izinkan" di layar sebelumnya,
  // jadi backsound bisa langsung diputar begitu halaman menu muncul.
  bgm.play().catch(() => {});
});

onUnmounted(() => {
  bgm.pause();
});
</script>

<template>
  <div class="menu-container">
    <div class="overlay">
      <h1 class="game-title">
        <span class="title-line">TKJ</span>
        <span class="title-line">SIMULATOR</span>
      </h1>

      <div class="button-group">
        <button class="mc-btn mc-btn-play" @click="startGame">PLAY</button>
        <button class="mc-btn mc-btn-exit" @click="exitGame">EXIT</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  font-family: 'Press Start 2P', monospace;
}

.menu-container {
  width: 100vw;
  height: 100vh;
  background-image: url('/src/assets/menu-background.jpeg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  image-rendering: pixelated;
}

.overlay {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8vh;
  background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.6) 100%);
}

.game-title {
  position: absolute;
  top: 10vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.title-line {
  font-size: clamp(1.4rem, 4.5vw, 3rem);
  color: #ffffff;
  text-shadow:
    3px 3px 0 #3a3a3a,
    -2px 2px 0 #3a3a3a,
    2px -2px 0 #3a3a3a,
    -2px -2px 0 #3a3a3a,
    0 6px 0 #1a1a1a;
  letter-spacing: 0.15em;
  line-height: 1.4;
}

.title-line:last-child {
  color: #5ec95e;
  text-shadow:
    3px 3px 0 #234d23,
    -2px 2px 0 #234d23,
    2px -2px 0 #234d23,
    -2px -2px 0 #234d23,
    0 6px 0 #0f2a0f;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: center;
}

.mc-btn {
  width: clamp(220px, 32vw, 320px);
  padding: 1.1rem 1.5rem;
  font-size: clamp(0.8rem, 1.6vw, 1.1rem);
  color: #ffffff;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  letter-spacing: 0.05em;
  cursor: pointer;
  border: 4px solid #1a1a1a;
  border-radius: 0;
  image-rendering: pixelated;
  transition: transform 0.05s ease;
}

.mc-btn:active {
  transform: translateY(2px);
}

.mc-btn-play {
  background-color: #6ab04c;
  box-shadow:
    inset -4px -4px 0 0 #3d7a2c,
    inset 4px 4px 0 0 #9ed685,
    4px 4px 0 0 #000000;
}

.mc-btn-play:hover {
  background-color: #7ec95a;
}

.mc-btn-exit {
  background-color: #c0392b;
  box-shadow:
    inset -4px -4px 0 0 #7a2318,
    inset 4px 4px 0 0 #e05f4f,
    4px 4px 0 0 #000000;
}

.mc-btn-exit:hover {
  background-color: #d4483a;
}
</style>