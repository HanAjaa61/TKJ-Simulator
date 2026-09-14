# TKJ Simulator

Simulator perakitan & konfigurasi jaringan komputer berbasis web, dibuat untuk membantu siswa **TKJ (Teknik Komputer dan Jaringan)** memahami topologi jaringan dan sistem IoT sederhana secara interaktif — mulai dari memasang perangkat, menyambungkan kabel yang sesuai, mengisi konfigurasi IP/Subnet/Gateway/DNS, sampai memvalidasi dan menjalankan simulasi alur data secara visual.

Dibangun dengan **Vue 3** untuk UI/menu dan **Phaser 3/4** untuk kanvas simulasi drag-and-drop bergaya pixel-art.

## ✨ Fitur

- **6 tema simulasi IoT & jaringan**, masing-masing dengan topologi dan aturan koneksi yang berbeda:
  | Tema | Deskripsi Singkat |
  |---|---|
  | 🌡️ Smart Room Temperature Monitoring | Monitoring suhu ruangan lewat sensor DHT22 |
  | 💧 Smart Water Monitoring | Monitoring ketinggian/level air (status siaga & krisis air) |
  | 🌳 Smart Forest Monitoring | Monitoring kelembaban tanah hutan, tersambung lewat WiFi ke Access Point |
  | 🗑️ Smart Waste Management | Monitoring volume tempat sampah lewat sensor ultrasonik |
  | 🚗 Smart Parking System | Deteksi slot parkir kosong/terisi lewat sensor infrared |
  | ⚡ Smart Hydropower Monitoring | Monitoring arus listrik dari pembangkit listrik tenaga air |
- **Drag-and-drop perangkat** ke kanvas: PC, Laptop, Server, Switch, Router, Access Point, Arduino (mikrokontroler), dan berbagai sensor IoT.
- **Mode Connect** untuk menyambungkan perangkat dengan jenis kabel yang otomatis sesuai (UTP, Fiber Optic, WiFi, Jumper GPIO), lengkap dengan validasi kompatibilitas antar perangkat.
- **Konfigurasi perangkat real-time**: pengisian IP Address, Subnet Mask, Gateway, DNS, SSID/Password WiFi, jumlah port switch, dsb — dengan validasi format & keyboard yang menyesuaikan jenis data.
- **Validasi topologi bertahap** (tombol VALIDASI): mengecek kelengkapan perangkat, koneksi, pengisian field, konflik IP, kesamaan subnet, gateway, DNS, hingga kecocokan kredensial WiFi.
- **Simulasi alur data** (tombol PLAY): memvisualisasikan aliran data dari sensor hingga ke PC/Laptop dengan animasi titik bergerak di sepanjang kabel, lengkap dengan pembacaan sensor acak dan indikator status berwarna.
- Mendukung banyak pasang **Sensor + Arduino sekaligus** dalam satu topologi pada beberapa tema, dengan alur simulasi serempak (bersamaan) maupun asinkron/acak (khusus tema Smart Parking, karena kendaraan keluar-masuk tidak mungkin serempak).
- Tampilan responsif untuk desktop maupun mobile/tablet, dengan overlay peringatan rotasi layar.

## 🛠️ Tech Stack

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- [Phaser](https://phaser.io/) — game engine untuk kanvas simulasi interaktif
- [Vite](https://vite.dev/) — build tool & dev server

## 📁 Struktur Proyek

```
tkj-simulator/
├── public/                    # Aset statis (favicon, dll.)
├── src/
│   ├── assets/
│   │   ├── audio/              # Musik & efek suara menu
│   │   └── icons/               # Ikon pixel-art tiap jenis perangkat
│   ├── components/
│   │   ├── AudioPermission.vue  # Layar izin audio sebelum masuk menu
│   │   ├── DeviceConfig.vue     # Panel form konfigurasi perangkat (IP/Subnet/dll.)
│   │   ├── RotateOverlay.vue    # Overlay peringatan rotasi layar (mobile)
│   │   └── ThemeSelect.vue      # Layar pemilihan tema simulasi
│   ├── game/
│   │   ├── fieldRules.js        # Sumber kebenaran tunggal untuk validasi & format field
│   │   ├── main.js              # Konfigurasi Phaser.Game
│   │   └── scenes/
│   │       ├── BootScene.js
│   │       └── MainScene.js     # Scene utama: seluruh logika kanvas, drag-drop, kabel, validasi & simulasi
│   ├── views/
│   │   ├── GamePlay.vue         # Wrapper Phaser + panel konfigurasi
│   │   └── Home.vue             # Halaman menu utama (Play/Exit)
│   ├── App.vue                  # Router antar layar (permission → home → theme → game)
│   └── main.js                  # Entry point Vue
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Cara Menjalankan (Clone & Install)

### Prasyarat

- [Node.js](https://nodejs.org/) versi `^22.18.0` atau `>=24.12.0`
- [Git](https://git-scm.com/)

### Langkah-langkah

1. **Clone repository ini**
   ```bash
   git clone https://github.com/HanAjaa61/TKJ-Simulator.git
   ```

2. **Masuk ke folder proyek**
   ```bash
   cd TKJ-Simulator
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Jalankan mode development**
   ```bash
   npm run dev
   ```
   Buka URL yang muncul di terminal (biasanya `http://localhost:5173`) di browser.

5. **(Opsional) Build untuk production**
   ```bash
   npm run build
   ```
   Hasil build akan ada di folder `dist/`. Untuk mencoba hasil build tersebut secara lokal:
   ```bash
   npm run preview
   ```

## 🎮 Cara Bermain

1. Izinkan audio saat pertama kali membuka aplikasi, lalu klik **PLAY** di menu utama.
2. Pilih salah satu dari 6 tema simulasi yang tersedia.
3. **Drag** perangkat dari sidebar kiri ke kanvas sesuai kebutuhan topologi tema tersebut.
4. Klik **⚙ Konfigurasi** pada tiap perangkat untuk mengisi IP Address, Subnet Mask, dan field lain yang relevan.
5. Aktifkan tombol **CONNECT**, lalu klik dua perangkat berurutan untuk menyambungkannya dengan kabel yang sesuai.
6. Klik **VALIDASI** untuk mengecek apakah topologi & konfigurasi sudah benar.
7. Klik **▶ PLAY** untuk menjalankan simulasi dan melihat data mengalir dari sensor sampai ke PC/Laptop.

## 📄 Lisensi

Belum ditentukan.
