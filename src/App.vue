<script setup>
import { ref } from 'vue';
import AudioPermission from './components/AudioPermission.vue';
import Home from './views/Home.vue';
import ThemeSelect from './components/ThemeSelect.vue';
import GamePlay from './views/GamePlay.vue';
import RotateOverlay from './components/RotateOverlay.vue';

const currentView = ref('permission');
const selectedTheme = ref(null);

function onThemeSelected(themeKey) {
  selectedTheme.value = themeKey;
  currentView.value = 'game';
}
</script>

<template>
  <RotateOverlay />

  <Transition name="fade" mode="out-in">
    <AudioPermission v-if="currentView === 'permission'" key="permission" @allow="currentView = 'home'" />
    <Home v-else-if="currentView === 'home'" key="home" @start="currentView = 'theme'" />
    <ThemeSelect v-else-if="currentView === 'theme'" key="theme" @select="onThemeSelected" />
    <GamePlay v-else key="game" :theme="selectedTheme" />
  </Transition>
</template>

<style>
html, body {
  background-color: #000000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>