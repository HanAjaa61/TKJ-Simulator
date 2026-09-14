<script setup>
const emit = defineEmits(['select']);

const THEMES = [
  { key: 'smart_room', label: 'Smart Room Temperature Monitoring' },
  { key: 'smart_water', label: 'Smart Water Monitoring' },
  { key: 'smart_forest', label: 'Smart Forest Monitoring' },
  { key: 'smart_waste', label: 'Smart Waste Management' },
  { key: 'smart_parking', label: 'Smart Parking System' },
  { key: 'smart_hydropower', label: 'Smart Hydropower Monitoring' }
];

function pick(themeKey) {
  emit('select', themeKey);
}
</script>

<template>
  <div class="theme-screen">
    <p class="theme-title">PILIH TEMA SIMULASI</p>
    <div class="theme-grid">
      <button
        v-for="theme in THEMES"
        :key="theme.key"
        class="theme-card"
        @click="pick(theme.key)"
      >
        {{ theme.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  font-family: 'Press Start 2P', monospace;
}

.theme-screen {
  width: 100vw;
  height: 100vh;
  background-color: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
}

.theme-title {
  color: #5ec95e;
  font-size: clamp(0.9rem, 2.5vw, 1.3rem);
  margin-bottom: 2rem;
  text-align: center;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 640px;
}

@media (max-width: 640px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}

.theme-card {
  background-color: #1e1e1e;
  color: #ffffff;
  border: 3px solid #444444;
  padding: 1rem 0.75rem;
  font-size: 0.6rem;
  line-height: 1.6;
  cursor: pointer;
  text-align: left;
  box-shadow: 4px 4px 0 0 #000000;
  transition: transform 0.05s ease, border-color 0.15s ease;
}

.theme-card:hover {
  border-color: #5ec9ff;
}

.theme-card:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
</style>