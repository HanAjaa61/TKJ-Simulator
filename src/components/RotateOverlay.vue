<template>
  <div class="rotate-overlay">
    <div class="rotate-icon">📱</div>
    <p class="rotate-text">Putar perangkat kamu ke posisi landscape untuk bermain</p>
  </div>
</template>

<style scoped>
.rotate-overlay {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  z-index: 9999;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  text-align: center;
  padding: 2rem;
}

.rotate-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: rotate-hint 1.5s ease-in-out infinite;
}

.rotate-text {
  font-size: 1.1rem;
  max-width: 300px;
}

@keyframes rotate-hint {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
}

/* Munculin overlay HANYA kalau layar kecil (mobile/tablet) DAN posisi portrait */
@media (max-width: 900px) and (orientation: portrait) {
  .rotate-overlay {
    display: flex;
  }
}
</style>