<script setup>
const emit = defineEmits(['allow']);

function allow() {
  emit('allow');
}

function deny() {
  window.close();
}
</script>

<template>
  <div class="permission-screen">
    <div class="permission-box">
      <p class="permission-title">IZIN AUDIO</p>
      <p class="permission-text">
        Game ini membutuhkan suara (musik &amp; efek tombol) untuk pengalaman terbaik.
        Izinkan audio diputar?
      </p>

      <div class="permission-buttons">
        <button class="mc-btn mc-btn-allow" @click="allow">IZINKAN</button>
        <button class="mc-btn mc-btn-deny" @click="deny">TOLAK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

* {
  font-family: 'Press Start 2P', monospace;
}

.permission-screen {
  width: 100vw;
  height: 100vh;
  background-color: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.permission-box {
  max-width: 480px;
  width: 100%;
  background-color: #1e1e1e;
  border: 4px solid #ffffff;
  box-shadow: 6px 6px 0 0 #000000;
  padding: 2rem 1.75rem;
  text-align: center;
}

.permission-title {
  color: #5ec95e;
  font-size: clamp(1rem, 3vw, 1.4rem);
  letter-spacing: 0.1em;
  margin: 0 0 1.5rem;
}

.permission-text {
  color: #ffffff;
  font-size: clamp(0.65rem, 1.8vw, 0.85rem);
  line-height: 2;
  margin: 0 0 2rem;
}

.permission-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.mc-btn {
  width: clamp(180px, 60%, 260px);
  padding: 0.9rem 1.2rem;
  font-size: clamp(0.65rem, 1.6vw, 0.9rem);
  color: #ffffff;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  letter-spacing: 0.05em;
  cursor: pointer;
  border: 4px solid #1a1a1a;
  border-radius: 0;
  transition: transform 0.05s ease;
}

.mc-btn:active {
  transform: translateY(2px);
}

.mc-btn-allow {
  background-color: #6ab04c;
  box-shadow:
    inset -4px -4px 0 0 #3d7a2c,
    inset 4px 4px 0 0 #9ed685,
    4px 4px 0 0 #000000;
}

.mc-btn-allow:hover {
  background-color: #7ec95a;
}

.mc-btn-deny {
  background-color: #c0392b;
  box-shadow:
    inset -4px -4px 0 0 #7a2318,
    inset 4px 4px 0 0 #e05f4f,
    4px 4px 0 0 #000000;
}

.mc-btn-deny:hover {
  background-color: #d4483a;
}
</style>