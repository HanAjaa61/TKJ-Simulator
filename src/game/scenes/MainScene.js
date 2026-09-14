import Phaser from 'phaser';
import { FIELD_TYPES, sameNetwork, fieldFormatError } from '../fieldRules.js';

const PIXEL_FONT = '"Press Start 2P"';

// Nama device pakai nama komponen asli yang umum dipakai di project IoT/Arduino/ESP32 sungguhan
const DEVICE_INFO = {
  pc: { label: 'PC', icon: 'icon_pc' },
  laptop: { label: 'Laptop', icon: 'icon_laptop' },
  server: { label: 'Server', icon: 'icon_server' },
  switch: { label: 'Switch', icon: 'icon_switch' },
  router: { label: 'Router', icon: 'icon_router' },
  ap: { label: 'Access Point', icon: 'icon_ap' },
  mikrokontroler: { label: 'Arduino', icon: 'icon_mikrokontroler' },
  sensor_suhu: { label: 'DHT22', icon: 'icon_sensor_suhu' },
  sensor_air: { label: 'JSN-SR04T', icon: 'icon_sensor_air' },
  sensor_kelembaban: { label: 'FC-28', icon: 'icon_sensor_kelembaban' },
  sensor_ultrasonik: { label: 'HC-SR04', icon: 'icon_sensor_ultrasonik' },
  sensor_infrared: { label: 'E18-D80NK', icon: 'icon_sensor_infrared' },
  sensor_arus: { label: 'ACS712', icon: 'icon_sensor_arus' }
};

const CATEGORIES = {
  'End Devices': ['pc', 'laptop', 'server'],
  'Switches': ['switch'],
  'Routers': ['router'],
  'Wireless': ['ap'],
  'IoT & Sensors': ['mikrokontroler', 'sensor_suhu', 'sensor_air', 'sensor_kelembaban', 'sensor_ultrasonik', 'sensor_infrared', 'sensor_arus']
};

// Tiap field diberi 'type' yang spesifik (bukan cuma 'ip' generik) supaya:
//  1) keyboard/karakter yang diizinkan saat mengetik sesuai jenis datanya
//     (IP vs Subnet Mask vs angka bulat vs nama perangkat vs SSID/Password WiFi), dan
//  2) aturan validasinya bisa berbeda antara IP Address, Gateway, dan DNS
//     walau ketiganya sama-sama "kelihatan" seperti IP.
const CONFIG_FIELDS = {
  pc: [
    { key: 'ip', label: 'IP Address', type: FIELD_TYPES.IP },
    { key: 'subnet', label: 'Subnet Mask', type: FIELD_TYPES.SUBNET },
    { key: 'gateway', label: 'Default Gateway', type: FIELD_TYPES.GATEWAY },
    { key: 'dns', label: 'DNS Server', type: FIELD_TYPES.DNS }
  ],
  laptop: [
    { key: 'ip', label: 'IP Address', type: FIELD_TYPES.IP },
    { key: 'subnet', label: 'Subnet Mask', type: FIELD_TYPES.SUBNET },
    { key: 'gateway', label: 'Default Gateway', type: FIELD_TYPES.GATEWAY },
    { key: 'dns', label: 'DNS Server', type: FIELD_TYPES.DNS }
  ],
  server: [
    { key: 'ip', label: 'IP Address', type: FIELD_TYPES.IP },
    { key: 'subnet', label: 'Subnet Mask', type: FIELD_TYPES.SUBNET },
    { key: 'gateway', label: 'Default Gateway', type: FIELD_TYPES.GATEWAY },
    { key: 'dns', label: 'DNS Server', type: FIELD_TYPES.DNS }
  ],
  // Switch unmanaged (paling umum di lab SMK) memang tidak butuh IP — cukup identitas fisiknya
  switch: [
    { key: 'name', label: 'Nama Switch', type: FIELD_TYPES.HOSTNAME },
    { key: 'ports', label: 'Jumlah Port', type: FIELD_TYPES.INTEGER, min: 4, max: 48 }
  ],
  router: [
    { key: 'ip', label: 'IP Address (LAN)', type: FIELD_TYPES.IP },
    { key: 'subnet', label: 'Subnet Mask', type: FIELD_TYPES.SUBNET },
    { key: 'dns', label: 'DNS Server', type: FIELD_TYPES.DNS }
  ],
  // AP dipakai sebagai bridge nirkabel unmanaged: yang jadi "kunci" koneksi adalah
  // SSID + Password, bukan IP (sama seperti Switch unmanaged di atas).
  ap: [
    { key: 'ssid', label: 'SSID', type: FIELD_TYPES.SSID },
    { key: 'password', label: 'Password (WPA2)', type: FIELD_TYPES.PASSWORD }
  ],
  mikrokontroler: [
    { key: 'deviceId', label: 'Device ID', type: FIELD_TYPES.HOSTNAME },
    { key: 'ip', label: 'IP Address', type: FIELD_TYPES.IP },
    { key: 'subnet', label: 'Subnet Mask', type: FIELD_TYPES.SUBNET },
    { key: 'gateway', label: 'Default Gateway', type: FIELD_TYPES.GATEWAY }
  ],
  // Sensor suhu (khusus tema Smart Room) tidak butuh field ambang batas manual —
  // rentang hijau/kuning/merah-nya sudah tetap (lihat SUHU_NORMAL_MIN/MAX di bawah).
  sensor_suhu: [],
  // Sensor level air (khusus tema Smart Water Monitoring) tidak lagi punya field
  // ambang batas manual — ambang batas krisisnya sudah tetap dikunci di kode
  // (lihat AIR_STATUS_ZONES di bawah). Yang diisi user cuma tinggi tiang tempat
  // sensornya dipasang.
  sensor_air: [{ key: 'tinggiTiang', label: 'Tinggi Tiang Sensor (cm)', type: FIELD_TYPES.NUMBER, min: 500, max: 600 }],
  // Sensor kelembaban tanah (khusus tema Smart Forest Monitoring) tidak lagi butuh
  // field ambang batas manual — zona status (Gersang/Lembab/Sangat Lembab/Terendam)
  // sudah tetap dikunci di kode (lihat KELEMBABAN_ZONES di bawah), sama seperti
  // sensor_suhu di tema Smart Room.
  sensor_kelembaban: [],
  // Sensor tempat sampah (khusus tema Smart Waste Management) pakai DUA field jarak:
  //  - emptyDistance: jarak sensor ke lantai dasar tempat sampah saat KOSONG (referensi 0%).
  //  - threshold: jarak aman minimum ke tumpukan sampah paling atas sebelum dianggap PENUH (100%).
  // Persentase volume dihitung dari posisi jarak hasil pembacaan di antara kedua angka ini.
  sensor_ultrasonik: [
    { key: 'emptyDistance', label: 'Batas Jarak Kosong (cm)', type: FIELD_TYPES.NUMBER, min: 10, max: 150 },
    { key: 'threshold', label: 'Ambang Batas (cm)', type: FIELD_TYPES.NUMBER, min: 0, max: 145 }
  ],
  // Sensor infrared (khusus tema Smart Parking System) tidak butuh field konfigurasi
  // apa pun — statusnya (kosong/terisi) langsung diacak 0/1 saat simulasi jalan
  // (lihat rollParkingReading di bawah), sama seperti sensor_suhu & sensor_air yang
  // juga tidak punya field ambang batas manual.
  sensor_infrared: [],
  // Sensor arus (khusus tema Smart Hydropower Monitoring) tidak pakai field ambang
  // batas manual — yang diisi user adalah nilai dasar bacaan sensornya sendiri
  // (5A - 15A), yang nanti dikalikan faktor random sistem saat simulasi (lihat
  // rollArusReading di bawah).
  sensor_arus: [{ key: 'nilaiArus', label: 'Nilai Sensor Arus (A)', type: FIELD_TYPES.NUMBER, min: 5, max: 15 }]
};

// Field WiFi tambahan yang wajib diisi di sisi Mikrokontroler HANYA ketika
// mikrokontroler tsb tersambung ke Access Point lewat kabel WiFi pada tema aktif
// (contoh: Smart Forest Monitoring). Kredensialnya harus SAMA PERSIS dengan AP,
// sama seperti perangkat asli yang harus tahu SSID+Password sebelum bisa join WiFi.
const MIKROKONTROLER_WIFI_FIELDS = [
  { key: 'wifiSsid', label: 'WiFi SSID (harus sama dgn AP)', type: FIELD_TYPES.SSID },
  { key: 'wifiPassword', label: 'WiFi Password (harus sama dgn AP)', type: FIELD_TYPES.PASSWORD }
];

// Router di tema-tema tertentu dipecah jadi 2 sisi (LAN vs WAN/Backbone) karena
// topologinya memang beda arah: sisi LAN menghadap Switch/AP (kumpulan Arduino),
// sisi WAN/Backbone menghadap Server lewat Fiber Optic. DNS tetap satu (global untuk semua).
const ROUTER_LAN_WAN_FIELDS = [
  { key: 'lanIp', label: 'IP Address (LAN)', type: FIELD_TYPES.IP },
  { key: 'lanSubnet', label: 'Subnet Mask (LAN)', type: FIELD_TYPES.SUBNET },
  { key: 'wanIp', label: 'IP Address (WAN/Backbone)', type: FIELD_TYPES.IP },
  { key: 'wanSubnet', label: 'Subnet Mask (WAN/Backbone)', type: FIELD_TYPES.SUBNET },
  { key: 'dns', label: 'DNS Server (Global)', type: FIELD_TYPES.DNS }
];

// Daftar tema yang Router-nya pakai field LAN/WAN terpisah di atas (bukan field
// router biasa ip/subnet/dns tunggal).
const ROUTER_LAN_WAN_THEMES = ['smart_waste', 'smart_room', 'smart_water', 'smart_hydropower', 'smart_parking', 'smart_forest'];

const THEME_CHAINS = {
  smart_room: { name: 'Smart Room Temperature Monitoring', chain: ['sensor_suhu', 'mikrokontroler', 'switch', 'router', 'server'] },
  smart_water: { name: 'Smart Water Monitoring', chain: ['sensor_air', 'mikrokontroler', 'switch', 'router', 'server'] },
  smart_forest: { name: 'Smart Forest Monitoring', chain: ['sensor_kelembaban', 'mikrokontroler', 'ap', 'router', 'server'] },
  smart_waste: { name: 'Smart Waste Management', chain: ['sensor_ultrasonik', 'mikrokontroler', 'switch', 'router', 'server'] },
  smart_parking: { name: 'Smart Parking System', chain: ['sensor_infrared', 'mikrokontroler', 'switch', 'router', 'server'] },
  smart_hydropower: { name: 'Smart Hydropower Monitoring', chain: ['sensor_arus', 'mikrokontroler', 'switch', 'router', 'server'] }
};

const CABLE_DEFS = {
  jumper: { id: 'jumper', label: 'Kabel Jumper (GPIO)', color: 0xf0997b, dash: false },
  wifi: { id: 'wifi', label: 'WiFi 2.4GHz (Nirkabel)', color: 0x5ec9ff, dash: true },
  utp: { id: 'utp', label: 'UTP Cat6 (Straight-Through)', color: 0x6ab04c, dash: false },
  fiber: { id: 'fiber', label: 'Fiber Optic (Backbone)', color: 0xffc94d, dash: false }
};

const READING_CONFIG = {
  sensor_suhu: { unit: '°C', min: 15, max: 40, alertAbove: true },
  sensor_kelembaban: { unit: '%', min: 0, max: 100, alertAbove: true },
  sensor_ultrasonik: { unit: 'cm', min: 0, max: 150, alertBelow: true },
  sensor_infrared: { unit: '', min: 0, max: 1, alertAbove: true }
};

const SIDEBAR_WIDTH = 180;
const ICON_SIZE = 56;
const TAP_MOVE_THRESHOLD = 8;

// Area terlarang buat naruh/geser device — nutupin sidebar + kotak legenda kabel
const RESERVED_ZONE = { right: SIDEBAR_WIDTH + 240, bottom: 170 };

// Daftar tema yang mendukung BEBERAPA pasang Sensor+Arduino sekaligus (bukan cuma
// satu seperti tema lain), semuanya bermuara ke satu Switch/AP -> Router -> Server
// yang sama, dan pembacaannya ditampilkan SEMUA sekaligus di tiap PC/Laptop.
// Catatan: 'smart_parking' juga ada di sini tapi pakai alur simulasi TERSENDIRI
// yang tidak serempak (lihat startParkingBranchLoops), karena keluar-masuknya
// mobil di parkiran memang tidak bisa serempak seperti sensor tema lain.
const MULTI_BRANCH_THEMES = ['smart_waste', 'smart_room', 'smart_water', 'smart_hydropower', 'smart_parking', 'smart_forest'];

function isSensor(type) {
  return type.startsWith('sensor_');
}

// ---------- HELPER MULTI-CABANG (Sensor+Arduino lebih dari satu pasang) ----------
// Dipakai tema-tema di MULTI_BRANCH_THEMES: user boleh memasang BEBERAPA pasang
// Sensor+Arduino (tiap pasang mewakili satu titik/ruangan berbeda) yang semuanya
// tersambung ke satu Switch/AP yang sama (hub-nya ditentukan dari urutan chain tema).
function getMikroBranches(scene, themeKey) {
  const theme = THEME_CHAINS[themeKey];
  const hubType = theme.chain[2]; // device antara Mikrokontroler & Router (switch/ap)
  const mikros = scene.placedDevices.filter(d => d.getData('deviceData').type === 'mikrokontroler');
  return mikros.map(mikro => {
    const sensorConn = scene.connections.find(c =>
      (c.from === mikro && isSensor(c.to.getData('deviceData').type)) ||
      (c.to === mikro && isSensor(c.from.getData('deviceData').type))
    );
    const sensor = sensorConn ? (sensorConn.from === mikro ? sensorConn.to : sensorConn.from) : null;
    const connectedToHub = scene.connections.some(c =>
      (c.from === mikro && c.to.getData('deviceData').type === hubType) ||
      (c.to === mikro && c.from.getData('deviceData').type === hubType)
    );
    return { mikro, sensor, connectedToHub, hubType };
  });
}

// Hitung persentase volume tempat sampah dari jarak baca sensor:
//  - distance == emptyDistance -> 0%   (tempat sampah kosong)
//  - distance == threshold     -> 100% (tumpukan sampah sudah di batas aman sensor)
function wasteVolumePercent(distance, emptyDistance, threshold) {
  const pct = ((emptyDistance - distance) / (emptyDistance - threshold)) * 100;
  return Phaser.Math.Clamp(pct, 0, 100);
}

// Ambil satu pembacaan acak untuk sebuah sensor tempat sampah, berdasarkan
// konfigurasi emptyDistance & threshold yang sudah diisi user.
function rollWasteReading(sensorDevice) {
  const cfg = sensorDevice.getData('config') || {};
  const emptyDistance = parseFloat(cfg.emptyDistance);
  const threshold = parseFloat(cfg.threshold);
  if (!Number.isFinite(emptyDistance) || !Number.isFinite(threshold) || emptyDistance <= threshold) return null;

  // Jarak diacak sedikit di bawah ambang batas sampai batas kosong, supaya kadang-kadang
  // benar-benar menyentuh kondisi 0% (kosong) maupun 100% (penuh), bukan cuma nilai tengah.
  const distance = Phaser.Math.FloatBetween(Math.max(0, threshold - 10), emptyDistance);
  const percent = wasteVolumePercent(distance, emptyDistance, threshold);
  return { distance, percent, threshold, emptyDistance };
}

function wasteStatusColor(percent) {
  if (percent >= 100) return '#e05f4f'; // merah: penuh
  if (percent >= 50) return '#e0c14f'; // kuning: setengah atau lebih
  return '#6ab04c'; // hijau: masih longgar/kosong
}

// Rentang suhu ruangan yang dianggap NORMAL (hijau): 20°C - 24°C. Di luar itu ada
// zona WASPADA (kuning) selebar SUHU_WASPADA_MARGIN derajat di kedua sisi, lalu
// zona BAHAYA (merah) di luar zona kuning (terlalu dingin ATAU terlalu panas).
// Sensor suhu tidak lagi butuh field ambang batas manual — rentangnya sudah tetap.
const SUHU_NORMAL_MIN = 20;
const SUHU_NORMAL_MAX = 24;
const SUHU_WASPADA_MARGIN = 3;
const SUHU_WASPADA_LOW = SUHU_NORMAL_MIN - SUHU_WASPADA_MARGIN; // 17
const SUHU_WASPADA_HIGH = SUHU_NORMAL_MAX + SUHU_WASPADA_MARGIN; // 27

function suhuStatus(reading) {
  if (reading < SUHU_WASPADA_LOW || reading > SUHU_WASPADA_HIGH) return { text: '\u26A0 BAHAYA', color: '#e05f4f' };
  if (reading < SUHU_NORMAL_MIN || reading > SUHU_NORMAL_MAX) return { text: '\u26A0 WASPADA', color: '#e0c14f' };
  return { text: '\u2714 NORMAL', color: '#6ab04c' };
}

// Acak suhu dengan peluang SAMA RATA (1/3) untuk jatuh di zona hijau, kuning, atau
// merah — supaya ketiga indikator warna sama-sama sering muncul selama simulasi,
// bukan didominasi salah satu warna kalau diacak rata di seluruh rentang sekaligus.
// Batas fisik terluar (min/max) sensor tetap ikut READING_CONFIG.sensor_suhu.
function rollSuhuReading() {
  const { min, max } = READING_CONFIG.sensor_suhu;
  const zone = Phaser.Math.Between(0, 2); // 0: hijau, 1: kuning, 2: merah
  const coldSide = Math.random() < 0.5; // untuk kuning/merah: sisi dingin atau panas dipilih acak
  if (zone === 0) return Phaser.Math.FloatBetween(SUHU_NORMAL_MIN, SUHU_NORMAL_MAX);
  if (zone === 1) {
    return coldSide
      ? Phaser.Math.FloatBetween(SUHU_WASPADA_LOW, SUHU_NORMAL_MIN)
      : Phaser.Math.FloatBetween(SUHU_NORMAL_MAX, SUHU_WASPADA_HIGH);
  }
  return coldSide
    ? Phaser.Math.FloatBetween(min, SUHU_WASPADA_LOW)
    : Phaser.Math.FloatBetween(SUHU_WASPADA_HIGH, max);
}

// Zona status krisis air (khusus tema Smart Water Monitoring), dikunci tetap di
// kode (tidak bisa diubah user) — sama seperti rentang suhu Smart Room di atas.
// Nilai "hasil" = Tinggi Tiang - nilai baca sensor (10cm - 450cm). Makin BESAR
// hasilnya berarti makin sedikit air yang terdeteksi tiangnya (makin "kering"),
// jadi urutan status dari hasil BESAR ke KECIL: Krisis Air -> Normal -> Siaga 3 ->
// Siaga 2 -> Siaga 1 (paling parah/kritis, ambang baku mutunya di 80cm).
const AIR_STATUS_ZONES = [
  { label: 'SIAGA 1', color: '#e05f4f', min: 0, max: 80 },
  { label: 'SIAGA 2', color: '#e08a3c', min: 81, max: 150 },
  { label: 'SIAGA 3', color: '#e0c14f', min: 151, max: 250 },
  { label: 'NORMAL', color: '#6ab04c', min: 251, max: 469 },
  { label: 'KRISIS AIR', color: '#ffffff', min: 470, max: Infinity }
];

// Simulasikan pembacaan sensor level air: nilai baca sensor diacak dari rentang
// 10cm - 450cm, lalu hasil = Tinggi Tiang - nilai baca. Zona status dipilih dulu
// secara ACAK RATA (tiap satu dari 5 zona di atas punya peluang yang sama untuk
// muncul, 20% masing-masing), baru nilai hasilnya digenerate di dalam rentang
// zona tsb — supaya kelima status/warna sama-sama sering muncul selama simulasi,
// bukan didominasi salah satu warna kalau nilai baca sensornya diacak polos.
function rollAirCrisisReading(sensorDevice, deviceId) {
  const cfg = sensorDevice.getData('config') || {};
  const tinggiTiang = parseFloat(cfg.tinggiTiang);
  if (!Number.isFinite(tinggiTiang)) return null;

  // Batas fisik hasil pengurangan mengikuti rentang nilai baca sensor (10cm - 450cm):
  // hasil minimal saat nilai baca maksimal (450cm), hasil maksimal saat nilai baca
  // minimal (10cm).
  const physicalMin = Math.max(0, tinggiTiang - 450);
  const physicalMax = tinggiTiang - 10;

  const zone = AIR_STATUS_ZONES[Phaser.Math.Between(0, AIR_STATUS_ZONES.length - 1)];
  const lo = Math.max(zone.min, physicalMin);
  const hi = Math.min(Number.isFinite(zone.max) ? zone.max : physicalMax, physicalMax);
  const result = hi > lo ? Phaser.Math.FloatBetween(lo, hi) : Phaser.Math.Clamp(zone.min, physicalMin, physicalMax);

  const symbol = zone.label === 'NORMAL' ? '\u2714' : '\u26A0';
  return {
    label: `${deviceId}: ${result.toFixed(0)}cm  ${symbol} ${zone.label}`,
    color: zone.color
  };
}

// Zona status arus (khusus tema Smart Hydropower Monitoring). Hasil yang dipakai
// untuk menentukan status adalah (Nilai Sensor Arus x faktor random sistem), lihat
// rollArusReading di bawah. Batas-batas ini tetap/dikunci di kode.
const ARUS_STATUS_ZONES = [
  { label: 'NORMAL', color: '#6ab04c', min: 1500, max: 6000 },
  { label: 'WASPADA', color: '#e0c14f', min: 6001, max: 8000 },
  { label: 'SIAGA', color: '#e08a3c', min: 8001, max: 9000 },
  { label: 'BAHAYA', color: '#e05f4f', min: 9001, max: Infinity }
];

function arusStatus(result) {
  return ARUS_STATUS_ZONES.find(z => result >= z.min && result <= z.max) || ARUS_STATUS_ZONES[ARUS_STATUS_ZONES.length - 1];
}

// Simulasikan pembacaan sensor arus: nilai dasar yang diisi user di konfigurasi
// (5A - 15A) dikalikan faktor random sistem (300 - 1000), hasilnya itu yang
// ditentukan statusnya lalu ditampilkan di end device.
function rollArusReading(sensorDevice, deviceId) {
  const cfg = sensorDevice.getData('config') || {};
  const nilaiArus = parseFloat(cfg.nilaiArus);
  if (!Number.isFinite(nilaiArus)) return null;

  const factor = Phaser.Math.FloatBetween(300, 1000);
  const result = nilaiArus * factor;
  const status = arusStatus(result);
  const symbol = status.label === 'NORMAL' ? '\u2714' : '\u26A0';

  return {
    label: `${deviceId}: ${result.toFixed(0)}A  ${symbol} ${status.label}`,
    color: status.color
  };
}

// Simulasikan pembacaan sensor infrared (khusus tema Smart Parking System): tidak
// ada field konfigurasi apa pun, statusnya langsung diacak 0 atau 1 tiap putaran
// simulasi (peluang sama rata 50/50) —
//  0 -> slot KOSONG (hijau)
//  1 -> slot TERISI (merah)
// Device ID yang ditampilkan diambil dari Device ID Arduino yang terpasang di
// slot parkir tsb (contoh: "Lantai1-1A").
function rollParkingReading(deviceId) {
  const isTerisi = Phaser.Math.Between(0, 1) === 1;
  return {
    label: `ID: ${deviceId}  Status: ${isTerisi ? 'Terisi' : 'Kosong'}`,
    color: isTerisi ? '#e05f4f' : '#6ab04c'
  };
}

// Zona status kelembaban tanah (khusus tema Smart Forest Monitoring), dikunci tetap
// di kode — sama seperti rentang suhu Smart Room. Urutan dari kering ke basah:
// Gersang (merah, terlalu kering) -> Lembab (hijau, kondisi ideal) -> Sangat Lembab
// (oranye, mulai berlebih) -> Terendam (merah, kebanjiran/tergenang air).
const KELEMBABAN_ZONES = [
  { label: 'GERSANG', color: '#e05f4f', min: 0, max: 39 },
  { label: 'LEMBAB', color: '#6ab04c', min: 40, max: 60 },
  { label: 'SANGAT LEMBAB', color: '#e08a3c', min: 61, max: 79 },
  { label: 'TERENDAM', color: '#e05f4f', min: 80, max: 100 }
];

// Acak kelembaban tanah dengan peluang SAMA RATA (1/4) untuk jatuh di salah satu
// dari 4 zona di atas — supaya keempat status/warna sama-sama sering muncul selama
// simulasi, bukan didominasi salah satu zona kalau diacak rata 0-100% sekaligus.
function rollKelembabanReading() {
  const zone = KELEMBABAN_ZONES[Phaser.Math.Between(0, KELEMBABAN_ZONES.length - 1)];
  const value = Phaser.Math.FloatBetween(zone.min, zone.max);
  return { value, zone };
}

// Ambil satu pembacaan acak untuk satu cabang Sensor+Arduino, sesuai jenis sensornya.
// Mengembalikan { label, color } yang siap ditampilkan di output PC/Laptop.
function rollBranchReading(themeKey, sensorDevice, deviceId) {
  const sensorType = sensorDevice.getData('deviceData').type;

  if (sensorType === 'sensor_kelembaban') {
    const { value, zone } = rollKelembabanReading();
    const symbol = zone.label === 'LEMBAB' ? '\u2714' : '\u26A0';
    return { label: `ID: ${deviceId}  ${value.toFixed(1)}%  ${symbol} ${zone.label}`, color: zone.color };
  }

  if (sensorType === 'sensor_ultrasonik') {
    const reading = rollWasteReading(sensorDevice);
    if (!reading) return null;
    return {
      label: `${deviceId}: ${reading.percent.toFixed(0)}% (batas ${reading.threshold}cm)`,
      color: wasteStatusColor(reading.percent)
    };
  }

  if (sensorType === 'sensor_suhu') {
    const value = rollSuhuReading();
    const status = suhuStatus(value);
    return { label: `ID: ${deviceId}  ${value.toFixed(1)}${READING_CONFIG.sensor_suhu.unit}  ${status.text}`, color: status.color };
  }

  if (sensorType === 'sensor_air') {
    return rollAirCrisisReading(sensorDevice, deviceId);
  }

  if (sensorType === 'sensor_arus') {
    return rollArusReading(sensorDevice, deviceId);
  }

  if (sensorType === 'sensor_infrared') {
    return rollParkingReading(deviceId);
  }

  const cfg = READING_CONFIG[sensorType];
  const threshold = parseFloat(sensorDevice.getData('config')?.threshold);
  if (!cfg || !Number.isFinite(threshold)) return null;
  const value = Phaser.Math.FloatBetween(cfg.min, cfg.max);

  let isAlert = false;
  if (cfg.alertAbove) isAlert = value > threshold;
  else if (cfg.alertBelow) isAlert = value < threshold;
  return {
    label: `${deviceId}: ${value.toFixed(1)}${cfg.unit}  ${isAlert ? '\u26A0 ALERT' : '\u2714 NORMAL'}`,
    color: isAlert ? '#e05f4f' : '#6ab04c'
  };
}

function getSegmentCable(typeA, typeB) {
  const pair = [typeA, typeB];
  if (pair.includes('mikrokontroler') && pair.some(isSensor)) return CABLE_DEFS.jumper;
  if (pair.includes('mikrokontroler') && pair.includes('switch')) return CABLE_DEFS.utp;
  if (pair.includes('mikrokontroler') && pair.includes('ap')) return CABLE_DEFS.wifi;
  if (pair.includes('switch') && pair.includes('router')) return CABLE_DEFS.utp;
  if (pair.includes('ap') && pair.includes('router')) return CABLE_DEFS.utp;
  if (pair.includes('router') && pair.includes('server')) return CABLE_DEFS.fiber;
  if (pair.includes('server') && (pair.includes('pc') || pair.includes('laptop'))) return CABLE_DEFS.utp;
  return null;
}

// Field konfigurasi sebuah device bisa berbeda tergantung TEMA aktif, karena media
// koneksinya bisa beda (contoh: Mikrokontroler yang tersambung ke AP lewat WiFi
// butuh SSID+Password tambahan, sedangkan yang tersambung ke Switch lewat UTP tidak).
function getConfigFields(type, themeKey) {
  // Router di tema-tema tertentu (lihat ROUTER_LAN_WAN_THEMES) pakai field LAN/WAN
  // terpisah, bukan field router biasa (ip/subnet/dns tunggal) yang dipakai tema lain.
  if (type === 'router' && ROUTER_LAN_WAN_THEMES.includes(themeKey)) return [...ROUTER_LAN_WAN_FIELDS];

  const base = CONFIG_FIELDS[type] ? [...CONFIG_FIELDS[type]] : [];
  const theme = THEME_CHAINS[themeKey];
  if (!theme || type !== 'mikrokontroler') return base;

  const idx = theme.chain.indexOf('mikrokontroler');
  if (idx === -1) return base;

  const neighborTypes = [theme.chain[idx - 1], theme.chain[idx + 1]].filter(Boolean);
  const connectsViaWifi = neighborTypes.some(n => getSegmentCable('mikrokontroler', n)?.id === 'wifi');
  return connectsViaWifi ? [...base, ...MIKROKONTROLER_WIFI_FIELDS] : base;
}

function isTypingInInput() {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

function clampOutsideReservedZone(x, y) {
  let cx = x;
  let cy = y;
  if (cx < SIDEBAR_WIDTH + 40) cx = SIDEBAR_WIDTH + 40;
  if (cx < RESERVED_ZONE.right && cy < RESERVED_ZONE.bottom) {
    cy = RESERVED_ZONE.bottom + 20;
  }
  return { x: cx, y: cy };
}

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.placedDevices = [];
    this.connections = [];
    this.cableHitZones = [];
    this.connectMode = false;
    this.firstSelectedDevice = null;
    this.selectedForDelete = null;
    this.selectedForDeleteType = null;
    this.activeContextMenu = null;
    this.contextMenuDeviceId = null;
    this.simRunning = false;
    this.simOutputTexts = [];
    this.simBranchDots = [];
    this.branches = [];
    this.branchReadings = [];
    this.branchDots = [];
    this.branchTrunkDot = null;
    this.branchDisplayDots = [];
    this.activeTheme = 'smart_room';
    this.activeCategory = 'End Devices';
  }

  init(data) {
    // Utamakan tema dari data.start() kalau ada (mis. dipanggil manual/testing),
    // tapi sumber normalnya sekarang lewat game.registry yang di-set oleh GamePlay.vue
    // sebelum scene ini sempat auto-start, supaya tema yang benar sudah tersedia
    // sejak run pertama (tidak perlu di-restart lagi -> tidak ada race condition).
    const requestedTheme = data?.theme || this.registry.get('theme');
    if (requestedTheme && THEME_CHAINS[requestedTheme]) {
      this.activeTheme = requestedTheme;
    }
    this.allowedTypes = new Set([...THEME_CHAINS[this.activeTheme].chain, 'pc', 'laptop']);
  }

  preload() {
    // Ikon dimuat dari folder public/icons (BUKAN src/assets/icons) supaya ikut
    // ter-copy apa adanya ke hasil build (dist/) oleh Vite. Kalau path-nya string
    // biasa ke dalam src/ seperti sebelumnya, Vite tidak bisa mendeteksi & membundle
    // file-nya secara statis, jadi ikon akan 404 di production/hosting (mis. Vercel)
    // walaupun tampil normal saat "npm run dev".
    const iconKeys = Object.values(DEVICE_INFO).map(d => d.icon);
    iconKeys.forEach(key => this.load.image(key, `/icons/${key}.png`));
    this.load.on('loaderror', file => console.warn(`Icon belum ada: ${file.key}`));
  }

  create() {
    this.loadPixelFontThenBuild();
  }

  // Menunggu font "Press Start 2P" benar-benar siap sebelum menggambar UI Phaser.
  // PENTING: teks yang digambar Phaser ke <canvas> itu seperti "foto" -- begitu
  // digambar pakai font fallback (mis. monospace bawaan browser), dia TIDAK akan
  // otomatis berganti lagi walau font aslinya menyusul selesai dimuat setelahnya.
  // Makanya proses ini tidak boleh asal document.fonts.load(...).then(...) saja,
  // karena itu bisa "gagal diam-diam" kalau @font-face-nya belum sempat terdaftar
  // di stylesheet saat baris ini dijalankan (rawan terjadi di hosting production
  // seperti Vercel, beda dari localhost yang biasanya sudah ke-cache/cepat).
  loadPixelFontThenBuild() {
    const fontSpec = `16px ${PIXEL_FONT}`;
    const proceed = () => this.buildUI();

    // Kalau font sudah siap (mis. sudah pernah dimuat sebelumnya di sesi ini),
    // langsung lanjut tanpa nunggu apa pun.
    if (document.fonts.check(fontSpec)) {
      proceed();
      return;
    }

    // document.fonts.ready menunggu SEMUA font yang diminta oleh CSS halaman
    // (termasuk <link> Google Fonts di index.html) selesai dimuat -- jauh lebih
    // andal daripada document.fonts.load() untuk satu font spesifik. Dikombinasi
    // dengan timeout 3 detik supaya game tetap bisa jalan (pakai font fallback)
    // kalau koneksi user benar-benar lambat/terputus, bukannya macet selamanya.
    Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]).then(proceed);
  }

  buildUI() {
    const { width, height } = this.scale;
    this.isTouchDevice = this.sys.game.device.input.touch;

    this.add.rectangle(0, 0, width, height, 0x1d1d1d).setOrigin(0, 0);
    this.add.rectangle(0, 0, SIDEBAR_WIDTH, height, 0x111111).setOrigin(0, 0);

    // Klik di area kanvas yang kosong (bukan device/kabel/tombol) akan membatalkan
    // pilihan kabel/device yang sedang di-highlight (efek glow-nya hilang).
    // Objek lain (device, kabel, tombol) ditambahkan setelah ini dan akan menerima
    // klik lebih dulu; kalau mereka memanggil event.stopPropagation() klik tidak
    // akan sampai ke sini.
    this.canvasBg = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive();
    this.canvasBg.on('pointerdown', () => {
      this.hideContextMenu();
      if (!this.selectedForDelete) return;
      if (this.selectedForDeleteType === 'device') {
        this.setDeviceHighlight(this.selectedForDelete, 0xffffff);
      }
      this.selectedForDelete = null;
      this.selectedForDeleteType = null;
      this.trashIcon.setVisible(false);
      this.redrawConnections();
    });

    this.categoryTabsContainer = this.add.container(0, 0);
    this.deviceListContainer = this.add.container(0, 0);
    this.renderCategoryTabs();
    this.renderDeviceList();

    this.cableLayer = this.add.graphics();
    this.legendContainer = this.add.container(SIDEBAR_WIDTH + 16, 16);
    this.legendContainer.setVisible(false);

    this.connectBtn = this.makeButton(width - 170, 20, 160, 'CONNECT: OFF', 0x444444, () => {
      this.connectMode = !this.connectMode;
      this.connectBtn.bg.fillColor = this.connectMode ? 0x1d9e75 : 0x444444;
      this.connectBtn.text.setText(this.connectMode ? 'CONNECT: ON' : 'CONNECT: OFF');
      this.clearConnectSelection();
      this.hideContextMenu();
    });

    this.validateBtn = this.makeButton(width - 170, height - 90, 160, 'VALIDASI', 0x2a6b9a, () => {
      const result = this.validateTopology();
      this.showFeedback(width / 2, 100, result.message, result.ok ? '#6ab04c' : '#e05f4f');
      if (!result.ok && result.deviceId) this.pulseDeviceError(result.deviceId);
    });

    this.playBtn = this.makeButton(width - 170, height - 50, 160, '\u25B6 PLAY', 0x2a6b9a, () => {
      if (this.simRunning) {
        this.stopSimulation();
        return;
      }
      const result = this.validateTopology();
      if (!result.ok) {
        this.showFeedback(width / 2, 100, result.message, '#e05f4f');
        if (result.deviceId) this.pulseDeviceError(result.deviceId);
        return;
      }
      this.startSimulation();
    });

    // Ikon hapus (🗑) ditampilkan di SEMUA platform (desktop maupun mobile) begitu ada
    // device/kabel yang dipilih — sebelumnya cuma muncul di layar sentuh, jadi di
    // desktop terasa seperti tidak ada fitur hapus sama sekali (padahal ada, tapi cuma
    // lewat shortcut keyboard tersembunyi). Lingkaran gelap di belakang emoji dipakai
    // supaya area yang bisa disentuh/diklik lebih besar & lebih gampang kena di HP.
    const trashBg = this.add.circle(0, 0, 16, 0x1a1a1a, 0.9).setStrokeStyle(2, 0xe05f4f);
    const trashLabel = this.add.text(0, 0, '\u{1F5D1}', { fontSize: '16px' }).setOrigin(0.5);
    this.trashIcon = this.add.container(0, 0, [trashBg, trashLabel]);
    this.trashIcon.setSize(36, 36);
    this.trashIcon.setDepth(900);
    this.trashIcon.setInteractive({ useHandCursor: true });
    this.trashIcon.setVisible(false);
    this.trashIcon.on('pointerdown', (pointer, localX, localY, event) => {
      this.deleteSelected();
      event.stopPropagation();
    });

    // Shortcut keyboard untuk desktop: tombol "Delete" (Windows/Linux) DAN "Backspace"
    // (banyak keyboard Mac tidak punya tombol Delete terpisah, cuma Backspace).
    // preventDefault() dipasang supaya Backspace di luar kolom input tidak memicu
    // "back" browser secara tidak sengaja.
    const handleDeleteKey = (event) => {
      if (isTypingInInput()) return;
      event?.preventDefault?.();
      this.deleteSelected();
    };
    this.input.keyboard.on('keydown-DELETE', handleDeleteKey);
    this.input.keyboard.on('keydown-BACKSPACE', handleDeleteKey);

    this.game.events.on('device-config-save', ({ id, config }) => {
      const device = this.placedDevices.find(d => d.getData('id') === id);
      if (device) device.setData('config', config);
    });

    // Bekukan seluruh input kanvas (device, kabel, sidebar, tombol) selagi panel
    // konfigurasi Vue sedang terbuka, supaya klik di form konfigurasi tidak pernah
    // "tembus" ke komponen lain yang kebetulan ada di posisi yang sama.
    this.game.events.on('config-opened', () => {
      this.input.enabled = false;
    });
    this.game.events.on('config-closed', () => {
      this.input.enabled = true;
    });

    this.setupSidebarDragHandlers();
  }

  makeButton(x, y, w, label, color, onClick) {
    const bg = this.add.rectangle(x, y, w, 30, color).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + 8, y + 9, label, { fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff' });
    bg.on('pointerdown', onClick);
    return { bg, text };
  }

  renderCategoryTabs() {
    this.categoryTabsContainer.removeAll(true);
    Object.keys(CATEGORIES).forEach((name, index) => {
      const y = 16 + index * 30;
      const isActive = name === this.activeCategory;
      const tabBg = this.add.rectangle(SIDEBAR_WIDTH / 2, y, SIDEBAR_WIDTH - 16, 26, isActive ? 0x2a6b4f : 0x1a1a1a)
        .setStrokeStyle(1, 0x444444).setInteractive({ useHandCursor: true });
      const tabText = this.add.text(SIDEBAR_WIDTH / 2, y, name, { fontFamily: PIXEL_FONT, fontSize: '9px', color: '#ffffff' }).setOrigin(0.5);
      tabBg.on('pointerdown', () => { this.activeCategory = name; this.renderCategoryTabs(); this.renderDeviceList(); });
      this.categoryTabsContainer.add([tabBg, tabText]);
    });
  }

  renderDeviceList() {
    this.deviceListContainer.removeAll(true);
    const types = CATEGORIES[this.activeCategory];
    const startY = 16 + Object.keys(CATEGORIES).length * 30 + 20;
    types.forEach((type, index) => {
      const deviceData = { type, ...DEVICE_INFO[type] };
      this.createSidebarItem(deviceData, SIDEBAR_WIDTH / 2, startY + index * (ICON_SIZE + 24));
    });
  }

  createSidebarItem(deviceData, x, y) {
    const container = this.add.container(x, y);
    const icon = this.createDeviceIcon(deviceData);
    const label = this.add.text(0, ICON_SIZE / 2 + 10, deviceData.label, {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffffff', align: 'center', wordWrap: { width: ICON_SIZE + 20 }
    }).setOrigin(0.5, 0);

    container.add([icon, label]);
    container.setSize(ICON_SIZE, ICON_SIZE);
    container.setInteractive({ draggable: true });
    container.setData('isSidebarItem', true);
    container.setData('deviceData', deviceData);
    container.setData('originX', x);
    container.setData('originY', y);

    this.deviceListContainer.add(container);
    this.input.setDraggable(container);
  }

  setupSidebarDragHandlers() {
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (!gameObject.getData('isSidebarItem')) return;
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (!gameObject.getData('isSidebarItem')) return;
      const deviceData = gameObject.getData('deviceData');

      if (pointer.x > SIDEBAR_WIDTH) {
        if (this.allowedTypes.has(deviceData.type)) {
          const pos = clampOutsideReservedZone(pointer.x, pointer.y);
          this.spawnDevice(deviceData, pos.x, pos.y);
        } else {
          this.showFeedback(pointer.x, pointer.y, `${deviceData.label} tidak dipakai\npada tema ini.`, '#e05f4f');
        }
      }
      gameObject.x = gameObject.getData('originX');
      gameObject.y = gameObject.getData('originY');
    });
  }

  createDeviceIcon(deviceData) {
    if (this.textures.exists(deviceData.icon)) {
      const img = this.add.image(0, 0, deviceData.icon);
      img.setDisplaySize(ICON_SIZE, ICON_SIZE);
      return img;
    }
    return this.add.rectangle(0, 0, ICON_SIZE, ICON_SIZE, 0x378ade).setStrokeStyle(2, 0xffffff);
  }

  spawnDevice(deviceData, x, y) {
    const container = this.add.container(x, y);
    const icon = this.createDeviceIcon(deviceData);
    const label = this.add.text(0, ICON_SIZE / 2 + 10, deviceData.label, {
      fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffffff', align: 'center', wordWrap: { width: ICON_SIZE + 20 }
    }).setOrigin(0.5, 0);

    container.add([icon, label]);
    container.setSize(ICON_SIZE, ICON_SIZE);
    container.setInteractive({ draggable: true, useHandCursor: true });
    container.setDepth(10);
    container.setData('isPlacedDevice', true);
    container.setData('deviceData', deviceData);
    container.setData('id', Phaser.Utils.String.UUID());
    container.setData('config', {});
    container.iconRef = icon;

    this.input.setDraggable(container);

    container.on('drag', (pointer, dragX, dragY) => {
      this.hideContextMenu();
      const pos = clampOutsideReservedZone(dragX, dragY);
      container.x = pos.x;
      container.y = pos.y;
      this.redrawConnections();
    });

    let tapDownX = x;
    let tapDownY = y;
    container.on('pointerdown', (pointer) => {
      tapDownX = pointer.x;
      tapDownY = pointer.y;
    });
    container.on('pointerup', (pointer) => {
      const dist = Phaser.Math.Distance.Between(tapDownX, tapDownY, pointer.x, pointer.y);
      if (dist < TAP_MOVE_THRESHOLD) {
        this.onDeviceTap(container);
      }
    });

    this.placedDevices.push(container);
    return container;
  }

  onDeviceTap(device) {
    if (this.connectMode) {
      this.handleDeviceClickForConnect(device);
      return;
    }
    this.showDeviceContextMenu(device);
  }

  // Menu kecil "Konfigurasi" / "Hapus" yang muncul di dekat device begitu di-klik/tap.
  // Dipakai di posisi berbasis resolusi virtual (1280x720) sehingga otomatis ikut
  // pas skala di layar HP/tablet lewat Phaser.Scale.FIT, tanpa perlu logika terpisah
  // untuk tampilan responsif.
  showDeviceContextMenu(device) {
    this.hideContextMenu();

    const { width, height } = this.scale;
    const menuWidth = 150;
    const optionHeight = 32;
    const menuHeight = optionHeight * 2;

    let menuX = device.x - menuWidth / 2;
    let menuY = device.y - ICON_SIZE / 2 - 8 - menuHeight;
    // Kalau kepotong di bagian atas kanvas, tampilkan menunya di bawah device saja.
    if (menuY < 8) menuY = device.y + ICON_SIZE / 2 + 18;
    // Clamp supaya tidak kepotong sidebar/tepi kanvas — penting juga di layar sempit/mobile.
    menuX = Phaser.Math.Clamp(menuX, SIDEBAR_WIDTH + 8, width - menuWidth - 8);
    menuY = Phaser.Math.Clamp(menuY, 8, height - menuHeight - 8);

    const container = this.add.container(menuX, menuY);
    container.setDepth(1000);

    const bg = this.add.rectangle(0, 0, menuWidth, menuHeight, 0x111111, 0.97)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x444444);
    container.add(bg);

    const addOption = (index, label, color, onClick) => {
      const y = index * optionHeight;
      const optBg = this.add.rectangle(0, y, menuWidth, optionHeight, 0x1a1a1a)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      const optText = this.add.text(12, y + optionHeight / 2, label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color
      }).setOrigin(0, 0.5);
      optBg.on('pointerover', () => optBg.fillColor = 0x2a2a2a);
      optBg.on('pointerout', () => optBg.fillColor = 0x1a1a1a);
      optBg.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();
        onClick();
      });
      container.add([optBg, optText]);
      if (index === 1) {
        // Garis pemisah tipis antar opsi
        const divider = this.add.rectangle(0, y, menuWidth, 1, 0x444444).setOrigin(0, 0);
        container.add(divider);
      }
    };

    addOption(0, '\u2699 Konfigurasi', '#5ec9ff', () => {
      this.hideContextMenu();
      this.openDeviceConfig(device);
    });
    addOption(1, '\u{1F5D1} Hapus', '#e05f4f', () => {
      this.hideContextMenu();
      this.selectSingle(device, 'device');
    });

    this.activeContextMenu = container;
    this.contextMenuDeviceId = device.getData('id');
  }

  hideContextMenu() {
    if (this.activeContextMenu) {
      this.activeContextMenu.destroy();
      this.activeContextMenu = null;
      this.contextMenuDeviceId = null;
    }
  }

  openDeviceConfig(device) {
    const deviceData = device.getData('deviceData');
    this.game.events.emit('device-select', {
      id: device.getData('id'),
      type: deviceData.type,
      label: deviceData.label,
      fields: getConfigFields(deviceData.type, this.activeTheme),
      config: device.getData('config') || {}
    });
  }

  handleDeviceClickForConnect(device) {
    if (!this.firstSelectedDevice) {
      this.firstSelectedDevice = device;
      this.setDeviceHighlight(device, 0xffff00);
      return;
    }
    if (this.firstSelectedDevice === device) {
      this.clearConnectSelection();
      return;
    }

    const typeA = this.firstSelectedDevice.getData('deviceData').type;
    const typeB = device.getData('deviceData').type;
    const midX = (this.firstSelectedDevice.x + device.x) / 2;
    const midY = (this.firstSelectedDevice.y + device.y) / 2;

    const cableDef = getSegmentCable(typeA, typeB);
    if (!cableDef) {
      this.showFeedback(midX, midY, 'Sambungan ini tidak dibutuhkan\npada topologi tema ini.', '#e05f4f');
      this.clearConnectSelection();
      return;
    }

    const already = this.connections.some(c =>
      (c.from === this.firstSelectedDevice && c.to === device) ||
      (c.from === device && c.to === this.firstSelectedDevice)
    );
    if (already) {
      this.showFeedback(midX, midY, 'Sudah tersambung.', '#e0a04f');
      this.clearConnectSelection();
      return;
    }

    // Satu Arduino cuma boleh punya SATU sensor & SATU jalur uplink (ke Switch/AP) —
    // supaya tiap Arduino tetap mewakili satu titik/tempat sampah yang jelas, dan
    // supaya deteksi pasangan Sensor+Arduino di tema Smart Waste tidak ambigu.
    const mikroDevice = [this.firstSelectedDevice, device].find(d => d.getData('deviceData').type === 'mikrokontroler');
    if (mikroDevice) {
      const otherDevice = mikroDevice === this.firstSelectedDevice ? device : this.firstSelectedDevice;
      const otherType = otherDevice.getData('deviceData').type;

      if (isSensor(otherType)) {
        const alreadyHasSensor = this.connections.some(c => {
          const partner = c.from === mikroDevice ? c.to : (c.to === mikroDevice ? c.from : null);
          return partner && isSensor(partner.getData('deviceData').type);
        });
        if (alreadyHasSensor) {
          this.showFeedback(midX, midY, 'Arduino ini sudah tersambung\nke satu sensor.', '#e05f4f');
          this.clearConnectSelection();
          return;
        }
      }

      if (otherType === 'switch' || otherType === 'ap') {
        const alreadyUplinked = this.connections.some(c => {
          const partner = c.from === mikroDevice ? c.to : (c.to === mikroDevice ? c.from : null);
          if (!partner) return false;
          const pType = partner.getData('deviceData').type;
          return pType === 'switch' || pType === 'ap';
        });
        if (alreadyUplinked) {
          this.showFeedback(midX, midY, 'Arduino ini sudah punya\njalur uplink.', '#e05f4f');
          this.clearConnectSelection();
          return;
        }
      }
    }

    // Kapasitas port Switch: jumlah kabel yang boleh nyambung ke Switch dibatasi
    // oleh field "Jumlah Port" di konfigurasinya. User wajib set dulu jumlah port
    // sebelum bisa menyambungkan apa pun ke Switch tsb.
    const switchDevice = [this.firstSelectedDevice, device].find(d => d.getData('deviceData').type === 'switch');
    if (switchDevice) {
      const ports = parseInt((switchDevice.getData('config') || {}).ports, 10);
      if (!Number.isFinite(ports) || ports <= 0) {
        this.showFeedback(midX, midY, 'Set dulu "Jumlah Port" pada\nSwitch (menu Konfigurasi) sebelum\nmenyambungkan kabel.', '#e05f4f');
        this.clearConnectSelection();
        return;
      }
      const usedPorts = this.connections.filter(c => c.from === switchDevice || c.to === switchDevice).length;
      if (usedPorts >= ports) {
        this.showFeedback(midX, midY, `Port Switch sudah penuh (${usedPorts}/${ports}).\nTambah Jumlah Port atau lepas\nsalah satu koneksi dulu.`, '#e05f4f');
        this.clearConnectSelection();
        return;
      }
    }

    this.connections.push({
      id: Phaser.Utils.String.UUID(),
      from: this.firstSelectedDevice,
      to: device,
      cableType: cableDef
    });
    this.showFeedback(midX, midY, `Tersambung:\n${cableDef.label}`, '#6ab04c');
    this.clearConnectSelection();
    this.redrawConnections();
  }

  showFeedback(x, y, message, color) {
    const text = this.add.text(x, y - 20, message, {
      fontFamily: PIXEL_FONT, fontSize: '9px', color, backgroundColor: '#000000',
      padding: { x: 6, y: 4 }, align: 'center'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: text, y: y - 60, alpha: 0, delay: 1400, duration: 800,
      onComplete: () => text.destroy()
    });
  }

  pulseDeviceError(deviceId) {
    const device = this.placedDevices.find(d => d.getData('id') === deviceId);
    if (!device?.iconRef) return;
    this.tweens.add({ targets: device.iconRef, alpha: 0.3, duration: 200, yoyo: true, repeat: 4 });
  }

  setDeviceHighlight(device, color) {
    if (device.iconRef?.setStrokeStyle) device.iconRef.setStrokeStyle(3, color);
  }

  clearConnectSelection() {
    if (this.firstSelectedDevice) this.setDeviceHighlight(this.firstSelectedDevice, 0xffffff);
    this.firstSelectedDevice = null;
  }

  redrawConnections() {
    this.cableLayer.clear();
    this.cableHitZones.forEach(z => z.destroy());
    this.cableHitZones = [];

    this.connections.forEach(conn => {
      const isSelected = this.selectedForDelete === conn;
      // Warna kabel TIDAK pernah diganti jadi merah lagi — tetap warna aslinya sesuai
      // jenis konektornya (UTP/Fiber/Jumper/WiFi dst), supaya jenis kabelnya tetap
      // gampang dikenali walau sedang dipilih.
      const color = conn.cableType.color;

      if (isSelected) {
        // Efek glow "buatan tangan" (3 lapis stroke tipis-transparan yang makin
        // melebar) di warna yang SAMA dengan kabelnya, jadi kelihatan menyala tanpa
        // mengubah warna aslinya. Dipakai untuk baik kabel solid maupun putus-putus.
        [[14, 0.10], [9, 0.20], [5, 0.32]].forEach(([glowWidth, alpha]) => {
          this.cableLayer.lineStyle(glowWidth, color, alpha);
          this.cableLayer.beginPath();
          this.cableLayer.moveTo(conn.from.x, conn.from.y);
          this.cableLayer.lineTo(conn.to.x, conn.to.y);
          this.cableLayer.strokePath();
        });
      }

      if (conn.cableType.dash) {
        this.drawDashedLine(conn.from.x, conn.from.y, conn.to.x, conn.to.y, color, isSelected);
      } else {
        this.cableLayer.lineStyle(isSelected ? 4 : 3, color, 1);
        this.cableLayer.beginPath();
        this.cableLayer.moveTo(conn.from.x, conn.from.y);
        this.cableLayer.lineTo(conn.to.x, conn.to.y);
        this.cableLayer.strokePath();
      }

      const midX = (conn.from.x + conn.to.x) / 2;
      const midY = (conn.from.y + conn.to.y) / 2;
      const fullLength = Phaser.Math.Distance.Between(conn.from.x, conn.from.y, conn.to.x, conn.to.y);
      const angle = Phaser.Math.Angle.Between(conn.from.x, conn.from.y, conn.to.x, conn.to.y);

      // Sisakan area aman di dekat KEDUA UJUNG kabel (seukuran ikon device) supaya
      // klik di atas/dekat device tidak pernah "kesenggol" hitbox kabel — cuma
      // area TENGAH-TENGAH kabel yang bisa diklik untuk memilih konektornya.
      const endMargin = ICON_SIZE / 2 + 14;
      const hitLength = fullLength - endMargin * 2;
      if (hitLength > 10) {
        const zone = this.add.zone(midX, midY, hitLength, 16).setRotation(angle).setInteractive({ useHandCursor: true });
        zone.setDepth(5);
        zone.on('pointerdown', (pointer, localX, localY, event) => {
          this.hideContextMenu();
          this.selectSingle(conn, 'connection');
          // Cegah klik ini "tembus" ke rectangle latar kanvas di belakangnya, supaya
          // kabel yang baru saja dipilih tidak langsung ke-clear lagi di frame yang sama.
          event.stopPropagation();
        });
        this.cableHitZones.push(zone);
      }
    });

    this.updateCableLegend();
  }

  updateCableLegend() {
    this.legendContainer.removeAll(true);
    const usedIds = [...new Set(this.connections.map(c => c.cableType.id))];

    if (usedIds.length === 0) {
      this.legendContainer.setVisible(false);
      return;
    }
    this.legendContainer.setVisible(true);

    const bgHeight = 26 + usedIds.length * 22;
    const bg = this.add.rectangle(0, 0, 220, bgHeight, 0x111111, 0.9).setOrigin(0, 0).setStrokeStyle(1, 0x444444);
    const title = this.add.text(8, 8, 'KABEL TERPASANG', { fontFamily: PIXEL_FONT, fontSize: '7px', color: '#5ec95e' });
    this.legendContainer.add([bg, title]);

    usedIds.forEach((id, i) => {
      const def = Object.values(CABLE_DEFS).find(c => c.id === id);
      const y = 30 + i * 22;
      const swatch = this.add.rectangle(10, y, 14, 14, def.color).setOrigin(0, 0);
      const label = this.add.text(32, y - 1, def.label, { fontFamily: PIXEL_FONT, fontSize: '7px', color: '#ffffff' });
      this.legendContainer.add([swatch, label]);
    });
  }

  drawDashedLine(x1, y1, x2, y2, color, isSelected = false) {
    const dashLength = 8, gapLength = 6;
    const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
    let drawn = 0;
    this.cableLayer.lineStyle(isSelected ? 4 : 3, color, 1);
    while (drawn < distance) {
      const segEnd = Math.min(drawn + dashLength, distance);
      this.cableLayer.beginPath();
      this.cableLayer.moveTo(x1 + Math.cos(angle) * drawn, y1 + Math.sin(angle) * drawn);
      this.cableLayer.lineTo(x1 + Math.cos(angle) * segEnd, y1 + Math.sin(angle) * segEnd);
      this.cableLayer.strokePath();
      drawn += dashLength + gapLength;
    }
  }

  selectSingle(target, type) {
    this.selectedForDelete = target;
    this.selectedForDeleteType = type;

    if (type === 'device') {
      this.setDeviceHighlight(target, 0x00d4ff);
      this.trashIcon.setPosition(target.x + ICON_SIZE / 2 + 8, target.y - ICON_SIZE / 2 - 8);
      this.trashIcon.setVisible(true);
    } else {
      this.redrawConnections();
      const midX = (target.from.x + target.to.x) / 2;
      const midY = (target.from.y + target.to.y) / 2;
      this.trashIcon.setPosition(midX, midY - 20);
      this.trashIcon.setVisible(true);
    }
  }

  deleteSelected() {
    if (!this.selectedForDelete) return;
    this.hideContextMenu();

    if (this.selectedForDeleteType === 'device') {
      const device = this.selectedForDelete;
      this.connections = this.connections.filter(c => c.from !== device && c.to !== device);
      this.placedDevices = this.placedDevices.filter(d => d !== device);
      device.destroy();
      this.game.events.emit('device-removed', { id: device.getData('id') });
    } else if (this.selectedForDeleteType === 'connection') {
      this.connections = this.connections.filter(c => c !== this.selectedForDelete);
    }

    this.selectedForDelete = null;
    this.selectedForDeleteType = null;
    this.trashIcon.setVisible(false);
    this.stopSimulation();
    this.redrawConnections();
  }

  // ---------- VALIDASI BERTAHAP ----------
  validateTopology() {
    if (MULTI_BRANCH_THEMES.includes(this.activeTheme)) return this.validateBranchTopology();

    const theme = THEME_CHAINS[this.activeTheme];

    const chainDevices = [];
    for (const type of theme.chain) {
      const device = this.placedDevices.find(d => d.getData('deviceData').type === type);
      if (!device) {
        return { ok: false, message: `Langkah 1: "${DEVICE_INFO[type].label}" belum dipasang di kanvas.` };
      }
      chainDevices.push(device);
    }

    const anyDisplay = this.placedDevices.find(d => ['pc', 'laptop'].includes(d.getData('deviceData').type));
    if (!anyDisplay) {
      return { ok: false, message: 'Langkah 1: PC atau Laptop belum dipasang di kanvas.' };
    }

    for (let i = 0; i < chainDevices.length - 1; i++) {
      const a = chainDevices[i];
      const b = chainDevices[i + 1];
      const linked = this.connections.some(c => (c.from === a && c.to === b) || (c.from === b && c.to === a));
      if (!linked) {
        return {
          ok: false,
          message: `Langkah 2: ${a.getData('deviceData').label} belum terhubung ke ${b.getData('deviceData').label}.`,
          deviceId: a.getData('id')
        };
      }
    }

    const server = chainDevices[chainDevices.length - 1];
    const connectedDisplays = this.placedDevices.filter(d =>
      ['pc', 'laptop'].includes(d.getData('deviceData').type) &&
      this.connections.some(c => (c.from === server && c.to === d) || (c.from === d && c.to === server))
    );
    if (connectedDisplays.length === 0) {
      return {
        ok: false,
        message: 'Langkah 2: Server belum terhubung ke PC/Laptop manapun.',
        deviceId: server.getData('id')
      };
    }

    // Sertakan juga mikrokontroler yang punya field WiFi dinamis (tema yang pakai AP)
    const devicesToCheck = [...chainDevices, ...connectedDisplays];
    const deviceFieldsOf = (device) => getConfigFields(device.getData('deviceData').type, this.activeTheme);

    // Langkah 3: setiap field wajib diisi, dan formatnya harus benar sesuai jenisnya
    // (IP Address / Subnet Mask / Gateway / DNS / SSID / Password / dll masing-masing
    // punya aturan sendiri, tidak disamaratakan sebagai "IP" seperti sebelumnya).
    for (const device of devicesToCheck) {
      const label = device.getData('deviceData').label;
      const fields = deviceFieldsOf(device);
      const config = device.getData('config') || {};
      for (const field of fields) {
        const value = config[field.key];
        if (value === undefined || value === null || value === '') {
          return {
            ok: false,
            message: `Langkah 3: Isi dulu "${field.label}" pada ${label}.`,
            deviceId: device.getData('id')
          };
        }
        const formatError = fieldFormatError(field, value);
        if (formatError) {
          return {
            ok: false,
            message: `Langkah 3: "${field.label}" pada ${label} tidak valid.\n${formatError}`,
            deviceId: device.getData('id')
          };
        }
      }
    }

    const router = chainDevices.find(d => d.getData('deviceData').type === 'router');
    const routerCfg = router?.getData('config') || {};
    // Router di tema tertentu (lihat ROUTER_LAN_WAN_THEMES, contoh: Smart Room Temperature
    // Monitoring) punya sisi LAN (menghadap Switch/AP + Arduino + PC/Laptop) dan sisi
    // WAN/Backbone (menghadap Server lewat Fiber Optic) yang IP & Subnet-nya terpisah.
    const isLanWanRouter = ROUTER_LAN_WAN_THEMES.includes(this.activeTheme);

    // Langkah 4: tidak boleh ada IP Address kembar antar perangkat manapun di topologi
    // (di jaringan sungguhan, dua host dengan IP sama akan bentrok/IP conflict).
    const routerLanWanOwners = router && isLanWanRouter
      ? [
          { device: router, ip: routerCfg.lanIp },
          { device: router, ip: routerCfg.wanIp }
        ]
      : [];
    const ipOwners = devicesToCheck
      .map(device => ({ device, ip: (device.getData('config') || {}).ip }))
      .concat(routerLanWanOwners)
      .filter(entry => entry.ip);
    for (let i = 0; i < ipOwners.length; i++) {
      for (let j = i + 1; j < ipOwners.length; j++) {
        if (ipOwners[i].ip === ipOwners[j].ip) {
          return {
            ok: false,
            message: `Langkah 4: Konflik IP Address! ${ipOwners[i].device.getData('deviceData').label} dan ${ipOwners[j].device.getData('deviceData').label} sama-sama memakai ${ipOwners[i].ip}.`,
            deviceId: ipOwners[j].device.getData('id')
          };
        }
      }
    }

    // Langkah 5: Subnet Mask tiap perangkat harus SAMA dengan Router (satu segmen jaringan
    // yang sama harus pakai mask yang identik), lalu network ID-nya dihitung pakai mask
    // tersebut secara bitwise — bukan asumsi /24 seperti sebelumnya, jadi berlaku untuk
    // mask apa pun yang dipilih pengguna.
    const routerIp = isLanWanRouter ? routerCfg.lanIp : routerCfg.ip;
    const routerSubnet = isLanWanRouter ? routerCfg.lanSubnet : routerCfg.subnet;

    if (router) {
      for (const device of devicesToCheck) {
        if (device === router) continue;
        const cfg = device.getData('config') || {};
        // Sisi Server memakai segmen WAN/Backbone Router, sisi lain (Arduino, PC/Laptop)
        // memakai segmen LAN Router.
        const onWanSide = isLanWanRouter && device === server;
        const refIp = onWanSide ? routerCfg.wanIp : routerIp;
        const refSubnet = onWanSide ? routerCfg.wanSubnet : routerSubnet;
        const sideLabel = isLanWanRouter ? (onWanSide ? ' WAN/Backbone' : ' LAN') : '';

        if (cfg.subnet && cfg.subnet !== refSubnet) {
          return {
            ok: false,
            message: `Langkah 5: Subnet Mask ${device.getData('deviceData').label} (${cfg.subnet}) harus sama dengan Subnet Mask${sideLabel} Router (${refSubnet}).`,
            deviceId: device.getData('id')
          };
        }
        if (cfg.ip && !sameNetwork(cfg.ip, cfg.subnet, refIp, refSubnet)) {
          return {
            ok: false,
            message: `Langkah 5: IP ${device.getData('deviceData').label} (${cfg.ip}) tidak satu jaringan dengan${sideLabel} Router (${refIp}/${refSubnet}).`,
            deviceId: device.getData('id')
          };
        }
      }
    }

    // Langkah 6: Default Gateway di tiap perangkat harus PERSIS SAMA dengan IP Router
    // di sisi yang sesuai (cara kerja gateway sungguhan), dan tidak boleh sama dengan
    // IP miliknya sendiri.
    if (router) {
      for (const device of devicesToCheck) {
        const cfg = device.getData('config') || {};
        if (!cfg.gateway) continue;
        const onWanSide = isLanWanRouter && device === server;
        const refIp = onWanSide ? routerCfg.wanIp : routerIp;
        const sideLabel = isLanWanRouter ? (onWanSide ? ' WAN/Backbone' : ' LAN') : '';

        if (cfg.gateway === cfg.ip) {
          return {
            ok: false,
            message: `Langkah 6: Gateway ${device.getData('deviceData').label} tidak boleh sama dengan IP miliknya sendiri (${cfg.gateway}).`,
            deviceId: device.getData('id')
          };
        }
        if (cfg.gateway !== refIp) {
          return {
            ok: false,
            message: `Langkah 6: Gateway ${device.getData('deviceData').label} (${cfg.gateway}) harus sama dengan IP${sideLabel} Router (${refIp}).`,
            deviceId: device.getData('id')
          };
        }
      }
    }

    // Langkah 7: DNS Server tiap perangkat harus konsisten dengan DNS yang di-set di Router
    // (di jaringan sederhana, DNS biasanya dibagikan seragam oleh Router/DHCP ke semua klien).
    if (router && routerCfg.dns) {
      for (const device of devicesToCheck) {
        const cfg = device.getData('config') || {};
        if (cfg.dns && cfg.dns !== routerCfg.dns) {
          return {
            ok: false,
            message: `Langkah 7: DNS ${device.getData('deviceData').label} (${cfg.dns}) harus sama dengan DNS Router (${routerCfg.dns}).`,
            deviceId: device.getData('id')
          };
        }
      }
    }

    // Langkah 8: kalau ada hop nirkabel (Mikrokontroler <-> Access Point), kredensial
    // WiFi di kedua sisi harus identik — sama seperti perangkat asli yang tidak akan
    // berhasil join WiFi kalau SSID/Password-nya tidak cocok.
    const wifiLink = this.connections.find(c => c.cableType.id === 'wifi');
    if (wifiLink) {
      const apDevice = [wifiLink.from, wifiLink.to].find(d => d.getData('deviceData').type === 'ap');
      const otherDevice = [wifiLink.from, wifiLink.to].find(d => d !== apDevice);
      if (apDevice && otherDevice) {
        const apCfg = apDevice.getData('config') || {};
        const otherCfg = otherDevice.getData('config') || {};
        if (!otherCfg.wifiSsid || !otherCfg.wifiPassword) {
          return {
            ok: false,
            message: `Langkah 8: Isi dulu WiFi SSID & Password pada ${otherDevice.getData('deviceData').label} (harus sama dengan ${apDevice.getData('deviceData').label}).`,
            deviceId: otherDevice.getData('id')
          };
        }
        if (otherCfg.wifiSsid !== apCfg.ssid || otherCfg.wifiPassword !== apCfg.password) {
          return {
            ok: false,
            message: `Langkah 8: SSID/Password WiFi pada ${otherDevice.getData('deviceData').label} tidak sama dengan ${apDevice.getData('deviceData').label}. Perangkat tidak akan bisa terhubung ke WiFi.`,
            deviceId: otherDevice.getData('id')
          };
        }
      }
    }

    return { ok: true, message: `\u2714 ${theme.name}: Semua langkah valid, siap disimulasikan!` };
  }

  // Validasi untuk tema-tema di MULTI_BRANCH_THEMES: mendukung BEBERAPA pasang
  // Sensor+Arduino sekaligus (beda dari tema lain yang cuma satu), semuanya
  // bermuara ke satu Switch/AP -> Router -> Server yang sama.
  validateBranchTopology() {
    const theme = THEME_CHAINS[this.activeTheme];
    const sensorType = theme.chain[0];
    const hubType = theme.chain[2];
    const hubLabel = DEVICE_INFO[hubType].label;
    const hubCable = getSegmentCable('mikrokontroler', hubType)?.label || hubLabel;
    const jumperCable = CABLE_DEFS.jumper.label;

    const hubDevice = this.placedDevices.find(d => d.getData('deviceData').type === hubType);
    const router = this.placedDevices.find(d => d.getData('deviceData').type === 'router');
    const server = this.placedDevices.find(d => d.getData('deviceData').type === 'server');
    const anyMikro = this.placedDevices.find(d => d.getData('deviceData').type === 'mikrokontroler');
    const anySensor = this.placedDevices.find(d => d.getData('deviceData').type === sensorType);
    const anyDisplay = this.placedDevices.find(d => ['pc', 'laptop'].includes(d.getData('deviceData').type));

    if (!anySensor) return { ok: false, message: `Langkah 1: Sensor ${DEVICE_INFO[sensorType].label} belum dipasang di kanvas.` };
    if (!anyMikro) return { ok: false, message: 'Langkah 1: Arduino belum dipasang di kanvas.' };
    if (!hubDevice) return { ok: false, message: `Langkah 1: "${hubLabel}" belum dipasang di kanvas.` };
    if (!router) return { ok: false, message: 'Langkah 1: "Router" belum dipasang di kanvas.' };
    if (!server) return { ok: false, message: 'Langkah 1: "Server" belum dipasang di kanvas.' };
    if (!anyDisplay) return { ok: false, message: 'Langkah 1: PC atau Laptop belum dipasang di kanvas.' };

    // Langkah 2: tiap Arduino yang ada WAJIB sudah punya pasangan sensornya sendiri
    // dan sudah tersambung ke Switch/AP (supaya jelas dia mewakili titik/ruangan mana).
    const branches = getMikroBranches(this, this.activeTheme);
    for (const branch of branches) {
      const mikroLabel = branch.mikro.getData('config')?.deviceId || branch.mikro.getData('deviceData').label;
      if (!branch.sensor) {
        return {
          ok: false,
          message: `Langkah 2: Arduino "${mikroLabel}" belum tersambung ke Sensor ${DEVICE_INFO[sensorType].label} (${jumperCable}).`,
          deviceId: branch.mikro.getData('id')
        };
      }
      if (!branch.connectedToHub) {
        return {
          ok: false,
          message: `Langkah 2: Arduino "${mikroLabel}" belum tersambung ke ${hubLabel} (${hubCable}).`,
          deviceId: branch.mikro.getData('id')
        };
      }
    }

    const hubToRouter = this.connections.some(c => (c.from === hubDevice && c.to === router) || (c.from === router && c.to === hubDevice));
    if (!hubToRouter) {
      return { ok: false, message: `Langkah 2: ${hubLabel} belum terhubung ke Router.`, deviceId: hubDevice.getData('id') };
    }
    const routerToServer = this.connections.some(c => (c.from === router && c.to === server) || (c.from === server && c.to === router));
    if (!routerToServer) {
      return { ok: false, message: 'Langkah 2: Router belum terhubung ke Server (Fiber Optic).', deviceId: router.getData('id') };
    }

    const connectedDisplays = this.placedDevices.filter(d =>
      ['pc', 'laptop'].includes(d.getData('deviceData').type) &&
      this.connections.some(c => (c.from === server && c.to === d) || (c.from === d && c.to === server))
    );
    if (connectedDisplays.length === 0) {
      return { ok: false, message: 'Langkah 2: Server belum terhubung ke PC/Laptop manapun.', deviceId: server.getData('id') };
    }

    // Langkah 3: kapasitas port Switch tidak boleh terlampaui (jaga-jaga kalau field
    // port diubah lagi setelah kabel-kabel sudah terpasang sebelumnya). Hanya berlaku
    // kalau hub-nya Switch (unmanaged) — AP tidak punya konsep "jumlah port".
    if (hubType === 'switch') {
      const switchPorts = parseInt(hubDevice.getData('config')?.ports, 10);
      const switchUsedPorts = this.connections.filter(c => c.from === hubDevice || c.to === hubDevice).length;
      if (!Number.isFinite(switchPorts) || switchPorts <= 0) {
        return { ok: false, message: 'Langkah 3: Isi dulu "Jumlah Port" pada Switch.', deviceId: hubDevice.getData('id') };
      }
      if (switchUsedPorts > switchPorts) {
        return {
          ok: false,
          message: `Langkah 3: Koneksi ke Switch (${switchUsedPorts}) melebihi Jumlah Port yang di-set (${switchPorts}).`,
          deviceId: hubDevice.getData('id')
        };
      }
    }

    // Langkah 4: field wajib tiap perangkat harus terisi & valid formatnya —
    // termasuk SEMUA pasangan Sensor+Arduino, bukan cuma satu seperti tema lain.
    const sharedDevices = [hubDevice, router, server, ...connectedDisplays];
    const branchDevices = branches.flatMap(b => [b.mikro, b.sensor]);
    const allDevices = [...sharedDevices, ...branchDevices];
    for (const device of allDevices) {
      const label = device.getData('deviceData').label;
      const fields = getConfigFields(device.getData('deviceData').type, this.activeTheme);
      const config = device.getData('config') || {};
      for (const field of fields) {
        const value = config[field.key];
        if (value === undefined || value === null || value === '') {
          return { ok: false, message: `Langkah 4: Isi dulu "${field.label}" pada ${label}.`, deviceId: device.getData('id') };
        }
        const formatError = fieldFormatError(field, value);
        if (formatError) {
          return { ok: false, message: `Langkah 4: "${field.label}" pada ${label} tidak valid.\n${formatError}`, deviceId: device.getData('id') };
        }
      }
    }

    // Langkah 5: Device ID tiap Arduino harus UNIK (dipakai sebagai penanda titik/ruangan
    // mana, jadi tidak boleh ada dua Arduino dengan ID yang sama).
    const idOwners = branches.map(b => ({ device: b.mikro, id: b.mikro.getData('config').deviceId }));
    for (let i = 0; i < idOwners.length; i++) {
      for (let j = i + 1; j < idOwners.length; j++) {
        if (idOwners[i].id === idOwners[j].id) {
          return {
            ok: false,
            message: `Langkah 5: Device ID "${idOwners[i].id}" dipakai oleh lebih dari satu Arduino. Setiap Arduino harus punya Device ID unik.`,
            deviceId: idOwners[j].device.getData('id')
          };
        }
      }
    }

    // Langkah 6: khusus sensor tempat sampah (HC-SR04), "Batas Jarak Kosong" tiap
    // sensor harus lebih besar dari "Ambang Batas"-nya (kalau tidak, rumus persentase
    // volumenya jadi tidak masuk akal). Tema lain (mis. sensor suhu / level air) tidak
    // punya field ini.
    if (sensorType === 'sensor_ultrasonik') {
      for (const branch of branches) {
        const cfg = branch.sensor.getData('config') || {};
        const emptyDistance = parseFloat(cfg.emptyDistance);
        const threshold = parseFloat(cfg.threshold);
        if (emptyDistance <= threshold) {
          return {
            ok: false,
            message: `Langkah 6: "Batas Jarak Kosong" (${emptyDistance}cm) pada ${branch.sensor.getData('deviceData').label} harus LEBIH BESAR dari "Ambang Batas"-nya (${threshold}cm).`,
            deviceId: branch.sensor.getData('id')
          };
        }
      }
    }

    // Langkah 7: tidak boleh ada IP Address kembar antar perangkat manapun (termasuk
    // IP LAN & WAN Router sendiri).
    const routerCfg = router.getData('config') || {};
    const ipOwners = [
      ...branches.map(b => ({ device: b.mikro, ip: b.mikro.getData('config').ip })),
      ...connectedDisplays.map(d => ({ device: d, ip: d.getData('config').ip })),
      { device: server, ip: server.getData('config').ip },
      { device: router, ip: routerCfg.lanIp },
      { device: router, ip: routerCfg.wanIp }
    ].filter(entry => entry.ip);
    for (let i = 0; i < ipOwners.length; i++) {
      for (let j = i + 1; j < ipOwners.length; j++) {
        if (ipOwners[i].ip === ipOwners[j].ip) {
          return {
            ok: false,
            message: `Langkah 7: Konflik IP Address! ${ipOwners[i].device.getData('deviceData').label} dan ${ipOwners[j].device.getData('deviceData').label} sama-sama memakai ${ipOwners[i].ip}.`,
            deviceId: ipOwners[j].device.getData('id')
          };
        }
      }
    }

    // Langkah 8: perangkat sisi LAN (semua Arduino + PC/Laptop) harus satu jaringan
    // dengan sisi LAN Router; Server (sisi WAN/Backbone) harus satu jaringan dengan
    // sisi WAN Router — dua segmen yang berbeda, sesuai pemisahan LAN vs WAN/Backbone.
    const lanDevices = [...branches.map(b => b.mikro), ...connectedDisplays];
    for (const device of lanDevices) {
      const cfg = device.getData('config') || {};
      const label = device.getData('deviceData').label;
      if (cfg.subnet !== routerCfg.lanSubnet) {
        return {
          ok: false,
          message: `Langkah 8: Subnet Mask ${label} (${cfg.subnet}) harus sama dengan Subnet Mask LAN Router (${routerCfg.lanSubnet}).`,
          deviceId: device.getData('id')
        };
      }
      if (!sameNetwork(cfg.ip, cfg.subnet, routerCfg.lanIp, routerCfg.lanSubnet)) {
        return {
          ok: false,
          message: `Langkah 8: IP ${label} (${cfg.ip}) tidak satu jaringan dengan sisi LAN Router (${routerCfg.lanIp}/${routerCfg.lanSubnet}).`,
          deviceId: device.getData('id')
        };
      }
      if (cfg.gateway === cfg.ip) {
        return { ok: false, message: `Langkah 8: Gateway ${label} tidak boleh sama dengan IP miliknya sendiri (${cfg.gateway}).`, deviceId: device.getData('id') };
      }
      if (cfg.gateway !== routerCfg.lanIp) {
        return {
          ok: false,
          message: `Langkah 8: Gateway ${label} (${cfg.gateway}) harus sama dengan IP LAN Router (${routerCfg.lanIp}).`,
          deviceId: device.getData('id')
        };
      }
    }

    const serverCfg = server.getData('config') || {};
    if (serverCfg.subnet !== routerCfg.wanSubnet) {
      return {
        ok: false,
        message: `Langkah 8: Subnet Mask Server (${serverCfg.subnet}) harus sama dengan Subnet Mask WAN/Backbone Router (${routerCfg.wanSubnet}).`,
        deviceId: server.getData('id')
      };
    }
    if (!sameNetwork(serverCfg.ip, serverCfg.subnet, routerCfg.wanIp, routerCfg.wanSubnet)) {
      return {
        ok: false,
        message: `Langkah 8: IP Server (${serverCfg.ip}) tidak satu jaringan dengan sisi WAN/Backbone Router (${routerCfg.wanIp}/${routerCfg.wanSubnet}).`,
        deviceId: server.getData('id')
      };
    }
    if (serverCfg.gateway !== routerCfg.wanIp) {
      return {
        ok: false,
        message: `Langkah 8: Gateway Server (${serverCfg.gateway}) harus sama dengan IP WAN/Backbone Router (${routerCfg.wanIp}).`,
        deviceId: server.getData('id')
      };
    }

    // Langkah 9: DNS Server semua perangkat harus konsisten dengan DNS global Router.
    for (const device of [...lanDevices, server]) {
      const cfg = device.getData('config') || {};
      if (cfg.dns && cfg.dns !== routerCfg.dns) {
        return {
          ok: false,
          message: `Langkah 9: DNS ${device.getData('deviceData').label} (${cfg.dns}) harus sama dengan DNS Router (${routerCfg.dns}).`,
          deviceId: device.getData('id')
        };
      }
    }

    return { ok: true, message: `\u2714 ${theme.name}: Semua langkah valid, siap disimulasikan!` };
  }

  // ---------- SIMULASI PLAY/STOP ----------
  startSimulation() {
    if (MULTI_BRANCH_THEMES.includes(this.activeTheme)) {
      this.startBranchSimulation();
      return;
    }

    const theme = THEME_CHAINS[this.activeTheme];
    const chainDevices = theme.chain.map(type => this.placedDevices.find(d => d.getData('deviceData').type === type));
    const server = chainDevices[chainDevices.length - 1];

    this.simDisplays = this.placedDevices.filter(d =>
      ['pc', 'laptop'].includes(d.getData('deviceData').type) &&
      this.connections.some(c => (c.from === server && c.to === d) || (c.from === d && c.to === server))
    );

    this.simMainPath = chainDevices; // sensor -> mikrokontroler -> ... -> server
    this.simSensorDevice = chainDevices[0];

    this.simRunning = true;
    this.playBtn.text.setText('\u25A0 STOP');
    this.playBtn.bg.fillColor = 0xc0392b;

    this.rollReading();
    this.simDot = this.add.circle(this.simMainPath[0].x, this.simMainPath[0].y, 6, 0xffff00);
    this.animateMainChain(0);
  }

  rollReading() {
    const sensorType = this.simSensorDevice.getData('deviceData').type;
    const cfg = READING_CONFIG[sensorType];
    const threshold = parseFloat(this.simSensorDevice.getData('config').threshold);
    const reading = Phaser.Math.FloatBetween(cfg.min, cfg.max);

    let isAlert = false;
    if (cfg.alertAbove) isAlert = reading > threshold;
    else if (cfg.alertBelow) isAlert = reading < threshold;

    this.currentReadingLabel = `${reading.toFixed(1)}${cfg.unit}  ${isAlert ? '\u26A0 ALERT' : '\u2714 NORMAL'}`;
    this.currentReadingColor = isAlert ? '#e05f4f' : '#6ab04c';
  }

  // Jalur utama: sensor -> mikrokontroler -> ... -> Server, mengikuti kabel yang benar-benar ada.
  animateMainChain(index) {
    if (!this.simRunning) return;

    const isAtServer = index === this.simMainPath.length - 1;
    if (isAtServer) {
      // Sudah sampai Server. Dari sini titiknya bercabang satu per satu ke tiap
      // PC/Laptop yang tersambung LANGSUNG ke Server (bukan lanjut device-ke-device,
      // karena memang tidak ada kabel di antara sesama end device).
      this.animateToDisplays();
      return;
    }

    this.tweens.add({
      targets: this.simDot,
      x: this.simMainPath[index + 1].x,
      y: this.simMainPath[index + 1].y,
      duration: 600,
      onComplete: () => this.animateMainChain(index + 1)
    });
  }

  // Bercabang dari Server ke SEMUA end device SEKALIGUS (paralel) — bukan satu-satu —
  // supaya kesannya data memang di-broadcast serentak ke semua PC/Laptop yang
  // tersambung ke Server, sesuai kabel yang benar-benar terpasang (Server -> device).
  animateToDisplays() {
    if (!this.simRunning) return;

    const server = this.simMainPath[this.simMainPath.length - 1];

    if (this.simDisplays.length === 0) {
      // Tidak ada end device yang tersambung -> langsung jeda & ulangi dari awal.
      this.time.delayedCall(1200, () => {
        if (!this.simRunning) return;
        this.clearSimOutputs();
        this.rollReading();
        this.simDot.setPosition(this.simMainPath[0].x, this.simMainPath[0].y);
        this.animateMainChain(0);
      });
      return;
    }

    let completedCount = 0;
    this.simBranchDots = this.simDisplays.map(display => {
      const dot = this.add.circle(server.x, server.y, 6, 0xffff00);
      this.tweens.add({
        targets: dot,
        x: display.x,
        y: display.y,
        duration: 600,
        onComplete: () => {
          if (!this.simRunning) return;
          this.showDeviceOutput(display);
          completedCount++;
          // Baru lanjut ke putaran berikutnya setelah SEMUA titik cabang sampai
          // di device masing-masing (bukan menunggu satu-satu secara berurutan).
          if (completedCount === this.simDisplays.length) {
            this.time.delayedCall(1200, () => {
              if (!this.simRunning) return;
              this.clearSimOutputs();
              this.clearBranchDots();
              this.rollReading();
              this.simDot.setPosition(this.simMainPath[0].x, this.simMainPath[0].y);
              this.animateMainChain(0);
            });
          }
        }
      });
      return dot;
    });
  }

  clearBranchDots() {
    (this.simBranchDots || []).forEach(d => d.destroy());
    this.simBranchDots = [];
  }

  showDeviceOutput(device) {
    const text = this.add.text(device.x, device.y - 50, this.currentReadingLabel, {
      fontFamily: PIXEL_FONT, fontSize: '9px', color: this.currentReadingColor,
      backgroundColor: '#000000', padding: { x: 6, y: 4 }, align: 'center'
    }).setOrigin(0.5);
    this.simOutputTexts.push(text);
  }

  clearSimOutputs() {
    this.simOutputTexts.forEach(t => t.destroy());
    this.simOutputTexts = [];
  }

  stopSimulation() {
    this.simRunning = false;
    this.simDot?.destroy();
    this.simDot = null;
    this.clearBranchDots();
    this.clearBranchAnimDots();
    this.clearSimOutputs();
    this.clearParkingSim();
    if (this.playBtn) {
      this.playBtn.text.setText('\u25B6 PLAY');
      this.playBtn.bg.fillColor = 0x2a6b9a;
    }
  }

  // ---------- SIMULASI MULTI-CABANG (Sensor+Arduino lebih dari satu pasang) ----------
  // Dipakai tema-tema di MULTI_BRANCH_THEMES (Smart Waste Management, Smart Room
  // Temperature Monitoring, Smart Water Monitoring, Smart Hydropower Monitoring,
  // Smart Forest Monitoring — hub-nya Access Point, bukan Switch, tapi alurnya
  // sama). Smart Parking System TIDAK memakai alur di bawah ini (lihat
  // startParkingBranchLoops). Alur visualnya sengaja beda dari tema satu-jalur:
  //  1) Tiap pasang Sensor->Arduino->Switch/AP jalan BERSAMAAN (titik kuning sendiri-sendiri).
  //  2) Begitu semua sampai di hub, datanya "digabung" jadi SATU titik kuning yang
  //     lanjut Switch/AP->Router->Server (menggambarkan data-data itu lewat jalur backbone yang sama).
  //  3) Dari Server, dipecah lagi jadi beberapa titik BERSAMAAN ke tiap PC/Laptop, dan
  //     tiap PC/Laptop menampilkan pembacaan SEMUA cabang sekaligus (bukan cuma satu).
  startBranchSimulation() {
    const theme = THEME_CHAINS[this.activeTheme];
    const hubType = theme.chain[2];
    const hubDevice = this.placedDevices.find(d => d.getData('deviceData').type === hubType);
    const router = this.placedDevices.find(d => d.getData('deviceData').type === 'router');
    const server = this.placedDevices.find(d => d.getData('deviceData').type === 'server');

    this.branches = getMikroBranches(this, this.activeTheme).filter(b => b.sensor && b.connectedToHub);
    this.branchTrunkPath = [hubDevice, router, server];
    this.simDisplays = this.placedDevices.filter(d =>
      ['pc', 'laptop'].includes(d.getData('deviceData').type) &&
      this.connections.some(c => (c.from === server && c.to === d) || (c.from === d && c.to === server))
    );

    this.simRunning = true;
    this.playBtn.text.setText('\u25A0 STOP');
    this.playBtn.bg.fillColor = 0xc0392b;

    // Smart Parking beda dari tema multi-cabang lain: mobil keluar-masuk parkir
    // TIDAK serempak, jadi tiap pasang Sensor+Arduino dijalankan sebagai siklus
    // independen sendiri-sendiri (lihat startParkingBranchLoops), bukan digabung
    // jadi satu titik trunk yang bergerak bersamaan seperti animateBranchCycle.
    if (this.activeTheme === 'smart_parking') {
      this.startParkingBranchLoops();
      return;
    }

    this.rollBranchReadings();
    this.animateBranchCycle();
  }

  // ---------- SIMULASI KHUSUS SMART PARKING (tiap cabang jalan independen & acak) ----------
  // Di dunia nyata, mobil keluar-masuk tempat parkir TIDAK serempak — satu slot bisa
  // baru saja terisi sementara slot lain sudah kosong lagi duluan. Jadi tiap pasang
  // Sensor+Arduino di sini punya siklusnya SENDIRI-SENDIRI: delay acak sebelum mulai
  // jalan dan delay acak lagi sebelum putaran berikutnya, sehingga titik datanya
  // "susul-menyusul" di jalur (bukan semuanya bergerak bersamaan seperti tema
  // multi-cabang lain yang digabung jadi satu titik trunk).
  startParkingBranchLoops() {
    this.parkingDots = [];
    if (!this.parkingRowTexts) this.parkingRowTexts = new Map();

    this.branches.forEach((branch, rowIndex) => {
      // Delay awal acak per cabang supaya siklus tiap Arduino tidak mulai bersamaan.
      const initialDelay = Phaser.Math.Between(0, 1500);
      this.time.delayedCall(initialDelay, () => this.runParkingBranchCycle(branch, rowIndex));
    });
  }

  // Satu putaran penuh untuk SATU cabang: ambil pembacaan baru, lalu jalankan titik
  // kuning dari Sensor -> Arduino -> Switch -> Router -> Server.
  runParkingBranchCycle(branch, rowIndex) {
    if (!this.simRunning) return;

    const deviceId = branch.mikro.getData('config').deviceId;
    const reading = rollParkingReading(deviceId);

    const path = [branch.sensor, branch.mikro, ...this.branchTrunkPath];
    const dot = this.add.circle(path[0].x, path[0].y, 6, 0xffff00);
    this.parkingDots.push(dot);

    this.animateParkingDot(dot, path, 0, () => {
      this.parkingDots = this.parkingDots.filter(d => d !== dot);
      this.parkingBranchToDisplays(dot, reading, rowIndex);
    });
  }

  animateParkingDot(dot, path, index, onDone) {
    if (!this.simRunning) { dot.destroy(); return; }
    if (index >= path.length - 1) {
      onDone();
      return;
    }
    this.tweens.add({
      targets: dot,
      x: path[index + 1].x,
      y: path[index + 1].y,
      duration: 500,
      onComplete: () => this.animateParkingDot(dot, path, index + 1, onDone)
    });
  }

  // Dari Server, cabang ini pecah BERSAMAAN ke tiap PC/Laptop yang tersambung (data
  // milik satu Arduino memang dikirim ke semua layar sekaligus) — yang TIDAK serempak
  // hanyalah antar cabang Arduino yang berbeda, bukan antar layar untuk cabang yang sama.
  parkingBranchToDisplays(dot, reading, rowIndex) {
    if (!this.simRunning) { dot.destroy(); return; }
    const server = this.branchTrunkPath[this.branchTrunkPath.length - 1];
    dot.setPosition(server.x, server.y);

    if (this.simDisplays.length === 0) {
      dot.destroy();
      this.scheduleNextParkingCycle(rowIndex);
      return;
    }

    let completedCount = 0;
    this.simDisplays.forEach((display, dIndex) => {
      const branchDot = dIndex === 0 ? dot : this.add.circle(server.x, server.y, 6, 0xffff00);
      if (dIndex > 0) this.parkingDots.push(branchDot);
      this.tweens.add({
        targets: branchDot,
        x: display.x,
        y: display.y,
        duration: 600,
        onComplete: () => {
          if (!this.simRunning) { branchDot.destroy(); return; }
          this.updateParkingRow(display, reading, rowIndex);
          branchDot.destroy();
          this.parkingDots = this.parkingDots.filter(d => d !== branchDot);
          completedCount++;
          if (completedCount === this.simDisplays.length) {
            this.scheduleNextParkingCycle(rowIndex);
          }
        }
      });
    });
  }

  // Jadwalkan putaran berikutnya KHUSUS untuk cabang ini saja, dengan delay acak —
  // inilah yang bikin efek "susul-menyusul" antar Arduino (bukan semuanya nunggu
  // satu sama lain seperti tema multi-cabang lain).
  scheduleNextParkingCycle(rowIndex) {
    if (!this.simRunning) return;
    const branch = this.branches[rowIndex];
    if (!branch) return;
    const nextDelay = Phaser.Math.Between(1200, 3500);
    this.time.delayedCall(nextDelay, () => this.runParkingBranchCycle(branch, rowIndex));
  }

  // Update baris pembacaan MILIK cabang ini saja di sebuah PC/Laptop (baris cabang
  // lain tidak ikut berubah/hilang), supaya kelihatan seperti data yang datang
  // satu-satu, bukan semua baris di-refresh bersamaan.
  updateParkingRow(display, reading, rowIndex) {
    const key = `${display.getData('id')}:${rowIndex}`;
    const existing = this.parkingRowTexts.get(key);
    if (existing) existing.destroy();

    const text = this.add.text(display.x, display.y - 50 - rowIndex * 16, reading.label, {
      fontFamily: PIXEL_FONT, fontSize: '8px', color: reading.color,
      backgroundColor: '#000000', padding: { x: 5, y: 3 }, align: 'center'
    }).setOrigin(0.5);
    this.parkingRowTexts.set(key, text);
  }

  clearParkingSim() {
    (this.parkingDots || []).forEach(d => d.destroy());
    this.parkingDots = [];
    if (this.parkingRowTexts) {
      this.parkingRowTexts.forEach(t => t.destroy());
      this.parkingRowTexts.clear();
    }
  }

  // Ambil pembacaan acak baru untuk SEMUA cabang sekaligus, disimpan per Device ID
  // supaya konsisten dipakai sepanjang satu putaran animasi (dari sensor sampai ke end device).
  rollBranchReadings() {
    this.branchReadings = this.branches.map(branch => {
      const deviceId = branch.mikro.getData('config').deviceId;
      return rollBranchReading(this.activeTheme, branch.sensor, deviceId);
    });
  }

  animateBranchCycle() {
    if (!this.simRunning) return;
    this.clearBranchAnimDots();

    if (this.branches.length === 0) {
      this.time.delayedCall(1200, () => {
        if (!this.simRunning) return;
        this.rollBranchReadings();
        this.animateBranchCycle();
      });
      return;
    }

    // Tahap 1: tiap Sensor -> Arduino -> Switch/AP, semuanya BERSAMAAN.
    let arrivedAtHub = 0;
    this.branchDots = this.branches.map(branch => {
      const dot = this.add.circle(branch.sensor.x, branch.sensor.y, 6, 0xffff00);
      this.tweens.add({
        targets: dot,
        x: branch.mikro.x,
        y: branch.mikro.y,
        duration: 500,
        onComplete: () => {
          if (!this.simRunning) return;
          this.tweens.add({
            targets: dot,
            x: this.branchTrunkPath[0].x,
            y: this.branchTrunkPath[0].y,
            duration: 500,
            onComplete: () => {
              if (!this.simRunning) return;
              dot.destroy();
              arrivedAtHub++;
              if (arrivedAtHub === this.branches.length) {
                this.animateBranchTrunk();
              }
            }
          });
        }
      });
      return dot;
    });
  }

  // Tahap 2: dari Switch/AP, data yang sudah terkumpul lanjut sebagai SATU titik kuning
  // lewat Router sampai ke Server (jalur backbone bersama).
  animateBranchTrunk() {
    if (!this.simRunning) return;
    this.branchTrunkDot = this.add.circle(this.branchTrunkPath[0].x, this.branchTrunkPath[0].y, 6, 0xffff00);
    this.animateBranchTrunkStep(0);
  }

  animateBranchTrunkStep(index) {
    if (!this.simRunning) return;
    if (index >= this.branchTrunkPath.length - 1) {
      this.branchTrunkDot?.destroy();
      this.branchTrunkDot = null;
      this.animateBranchToDisplays();
      return;
    }
    this.tweens.add({
      targets: this.branchTrunkDot,
      x: this.branchTrunkPath[index + 1].x,
      y: this.branchTrunkPath[index + 1].y,
      duration: 500,
      onComplete: () => this.animateBranchTrunkStep(index + 1)
    });
  }

  // Tahap 3: dari Server, pecah BERSAMAAN ke tiap PC/Laptop yang tersambung, lalu
  // setiap PC/Laptop menampilkan pembacaan SEMUA cabang sekaligus.
  animateBranchToDisplays() {
    if (!this.simRunning) return;
    const server = this.branchTrunkPath[this.branchTrunkPath.length - 1];

    if (this.simDisplays.length === 0) {
      this.time.delayedCall(1200, () => {
        if (!this.simRunning) return;
        this.rollBranchReadings();
        this.animateBranchCycle();
      });
      return;
    }

    let completedCount = 0;
    this.branchDisplayDots = this.simDisplays.map(display => {
      const dot = this.add.circle(server.x, server.y, 6, 0xffff00);
      this.tweens.add({
        targets: dot,
        x: display.x,
        y: display.y,
        duration: 600,
        onComplete: () => {
          if (!this.simRunning) return;
          this.showBranchOutput(display);
          completedCount++;
          if (completedCount === this.simDisplays.length) {
            this.time.delayedCall(1500, () => {
              if (!this.simRunning) return;
              this.clearSimOutputs();
              this.clearBranchAnimDots();
              this.rollBranchReadings();
              this.animateBranchCycle();
            });
          }
        }
      });
      return dot;
    });
  }

  // Tampilkan pembacaan SEMUA cabang (Device ID + nilai + status), masing-masing
  // baris diwarnai sesuai statusnya sendiri (hijau/kuning/oranye/merah/putih).
  showBranchOutput(device) {
    this.branchReadings.forEach((reading, index) => {
      if (!reading) return;
      const text = this.add.text(device.x, device.y - 50 - index * 16, reading.label, {
        fontFamily: PIXEL_FONT, fontSize: '8px', color: reading.color,
        backgroundColor: '#000000', padding: { x: 5, y: 3 }, align: 'center'
      }).setOrigin(0.5);
      this.simOutputTexts.push(text);
    });
  }

  clearBranchAnimDots() {
    (this.branchDots || []).forEach(d => d.destroy());
    this.branchDots = [];
    this.branchTrunkDot?.destroy();
    this.branchTrunkDot = null;
    (this.branchDisplayDots || []).forEach(d => d.destroy());
    this.branchDisplayDots = [];
  }

}