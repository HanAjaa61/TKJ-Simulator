<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Phaser from 'phaser';
import { gameConfig } from '../game/main.js';
import DeviceConfig from '../components/DeviceConfig.vue';

const props = defineProps({
  theme: { type: String, required: true }
});

let game;
const activeDevice = ref(null);

onMounted(() => {
  game = new Phaser.Game(gameConfig);
  // Kirim tema lewat registry sebelum MainScene sempat auto-start (lihat init() di MainScene.js).
  game.registry.set('theme', props.theme);
  game.events.on('device-select', (payload) => {
    activeDevice.value = payload;
  });
});

// Selama panel konfigurasi terbuka, kanvas/sidebar di belakangnya dibekukan total
// (this.input.enabled = false di MainScene) supaya klik di kolom input tidak pernah
// "tembus" dan malah mengenai komponen lain di kanvas. Baru aktif lagi setelah panel
// benar-benar ditutup (tombol EXIT).
watch(activeDevice, (value) => {
  if (!game) return;
  game.events.emit(value ? 'config-opened' : 'config-closed');
});

function saveConfig({ id, config }) {
  game.events.emit('device-config-save', { id, config });
}

function closeConfig({ id, config }) {
  game.events.emit('device-config-save', { id, config });
  activeDevice.value = null;
}

onUnmounted(() => {
  game?.destroy(true);
});
</script>

<template>
  <div id="phaser-container" class="game-wrapper"></div>
  <DeviceConfig v-if="activeDevice" :device="activeDevice" @save="saveConfig" @close="closeConfig" />
</template>

<style scoped>
.game-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000000;
}
</style>