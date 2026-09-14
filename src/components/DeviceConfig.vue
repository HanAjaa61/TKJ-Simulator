<script setup>
import { ref } from 'vue';
import { sanitizeInput, fieldFormatError, fieldPlaceholder, fieldInputMode } from '../game/fieldRules.js';

const props = defineProps({
  device: { type: Object, required: true }
});
const emit = defineEmits(['close', 'save']);

const formData = ref({ ...props.device.config });
const saveState = ref(null); // { type: 'ok' | 'error', text: string }

function onFieldInput(field, event) {
  const cleaned = sanitizeInput(field, event.target.value);
  formData.value[field.key] = cleaned;
  event.target.value = cleaned;
  saveState.value = null; // input berubah lagi -> notifikasi lama sudah tidak relevan
}

function fieldError(field) {
  return fieldFormatError(field, formData.value[field.key]);
}

function isFieldValid(field) {
  const value = formData.value[field.key];
  return !!value && !fieldError(field);
}

// Cek semua field (termasuk yang masih kosong) untuk notifikasi ringkasan saat Simpan.
function validateAll() {
  const errors = [];
  for (const field of props.device.fields) {
    const value = formData.value[field.key];
    if (value === undefined || value === null || value === '') {
      errors.push(`\u2022 ${field.label}: belum diisi`);
      continue;
    }
    const err = fieldFormatError(field, value);
    if (err) errors.push(`\u2022 ${field.label}: ${err}`);
  }
  return errors;
}

// Tombol SIMPAN: selalu menyimpan apa pun yang sudah diketik (supaya progres tidak
// pernah hilang), lalu menampilkan notifikasi apakah datanya sudah valid semua atau
// masih ada yang perlu dibetulkan. Panel TIDAK tertutup, supaya user bisa langsung
// membetulkan kalau ada error.
function saveConfig() {
  emit('save', { id: props.device.id, config: { ...formData.value } });
  const errors = validateAll();
  if (errors.length === 0) {
    saveState.value = { type: 'ok', text: '\u2714 Konfigurasi tersimpan & valid!' };
  } else {
    saveState.value = {
      type: 'error',
      text: `Tersimpan, tapi masih ada yang perlu dibetulkan:\n${errors.join('\n')}`
    };
  }
}

// EXIT: tetap menyimpan dulu data yang ada saat ini (jaga-jaga kalau user belum sempat
// klik SIMPAN) baru menutup panel, supaya tidak ada lagi kasus "sudah diisi tapi pas
// dibuka lagi kosong".
function exitConfig() {
  emit('close', { id: props.device.id, config: { ...formData.value } });
}
</script>

<template>
  <div class="config-overlay">
    <div class="config-box">
      <div class="config-header">
        <button class="exit-btn" @click="exitConfig">EXIT</button>
        <p class="config-title">{{ device.label }}</p>
      </div>

      <!-- Cuma bagian daftar field ini yang bisa discroll kalau fieldnya banyak;
           tombol SIMPAN & EXIT tetap selalu kelihatan tanpa perlu discroll dulu. -->
      <div class="config-scroll">
        <div v-if="device.fields.length === 0" class="no-fields">
          Device ini tidak butuh konfigurasi tambahan.
        </div>

        <div v-for="field in device.fields" :key="field.key" class="field-row">
          <label class="field-label">{{ field.label }}</label>
          <input
            :value="formData[field.key]"
            class="field-input"
            :class="{ 'field-input-error': fieldError(field), 'field-input-ok': isFieldValid(field) }"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :inputmode="fieldInputMode(field)"
            :placeholder="fieldPlaceholder(field)"
            @input="onFieldInput(field, $event)"
          />
          <p v-if="fieldError(field)" class="field-error">{{ fieldError(field) }}</p>
        </div>

        <p v-if="saveState" class="save-banner" :class="saveState.type === 'ok' ? 'save-banner-ok' : 'save-banner-error'">{{ saveState.text }}</p>
      </div>

      <div v-if="device.fields.length > 0" class="action-row">
        <button class="save-btn" @click="saveConfig">SIMPAN</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  font-family: 'Press Start 2P', monospace;
}

.config-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.config-box {
  position: relative;
  width: 100%;
  max-width: 380px;
  max-height: 85vh;
  background-color: #1e1e1e;
  border: 4px solid #ffffff;
  box-shadow: 6px 6px 0 0 #000000;
  box-sizing: border-box;
  /* Layout kolom: header & tombol SIMPAN selalu kelihatan, cuma daftar field yang
     discroll kalau kepanjangan — jadi user tidak perlu scroll dulu untuk simpan. */
  display: flex;
  flex-direction: column;
}

.config-header {
  position: relative;
  flex-shrink: 0;
  padding: 1.75rem 1.5rem 0.75rem;
}

.config-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 1.5rem;
  min-height: 0;
}

.exit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #c0392b;
  color: #ffffff;
  border: 3px solid #1a1a1a;
  padding: 6px 10px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  box-shadow: 3px 3px 0 0 #000000;
}

.exit-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.config-title {
  color: #5ec95e;
  font-size: 0.85rem;
  margin: 0 1.5rem 0 0;
  text-align: center;
}

.no-fields {
  color: #aaaaaa;
  font-size: 0.65rem;
  text-align: center;
  line-height: 1.8;
  padding: 0.5rem 0 1rem;
}

.field-row {
  margin-bottom: 1.2rem;
}

.field-label {
  display: block;
  color: #ffffff;
  font-size: 0.6rem;
  margin-bottom: 0.5rem;
}

.field-input {
  width: 100%;
  padding: 0.6rem;
  font-size: 0.7rem;
  font-family: 'Press Start 2P', monospace;
  background-color: #0a0a0a;
  color: #5ec9ff;
  border: 2px solid #444444;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: #5ec9ff;
}

.field-input-error {
  border-color: #e05f4f;
}

.field-input-ok {
  border-color: #5ec95e;
}

.field-error {
  color: #e05f4f;
  font-size: 0.5rem;
  margin: 0.4rem 0 0;
  line-height: 1.6;
}

.save-banner {
  font-size: 0.55rem;
  line-height: 1.8;
  white-space: pre-line;
  padding: 0.7rem;
  margin: 0.5rem 0 1rem;
  border: 2px solid;
  box-sizing: border-box;
}

.save-banner-ok {
  color: #5ec95e;
  border-color: #5ec95e;
  background-color: rgba(94, 201, 94, 0.08);
}

.save-banner-error {
  color: #e05f4f;
  border-color: #e05f4f;
  background-color: rgba(224, 95, 79, 0.08);
}

.action-row {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 0.9rem 1.5rem 1.5rem;
  border-top: 2px solid #333333;
  margin-top: 0.5rem;
}

.save-btn {
  width: 100%;
  background-color: #1d9e75;
  color: #ffffff;
  border: 3px solid #1a1a1a;
  padding: 0.8rem;
  font-size: 0.7rem;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  box-shadow: 3px 3px 0 0 #000000;
}

.save-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* Layar sempit (HP): perkecil padding, font, dan jarak antar elemen supaya konten
   lebih ringkas dan makin jarang butuh scroll sama sekali. */
@media (max-width: 480px), (max-height: 700px) {
  .config-box {
    max-height: 92vh;
  }
  .config-header {
    padding: 1.4rem 1.1rem 0.5rem;
  }
  .config-scroll {
    padding: 0 1.1rem;
  }
  .config-title {
    font-size: 0.7rem;
  }
  .field-row {
    margin-bottom: 0.8rem;
  }
  .field-label {
    font-size: 0.55rem;
    margin-bottom: 0.35rem;
  }
  .field-input {
    padding: 0.45rem;
    font-size: 0.65rem;
  }
  .save-banner {
    font-size: 0.5rem;
    padding: 0.5rem;
  }
  .action-row {
    padding: 0.6rem 1.1rem 1.1rem;
  }
  .save-btn {
    padding: 0.6rem;
    font-size: 0.65rem;
  }
}
</style>