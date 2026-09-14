// ============================================================================
// fieldRules.js
// Satu-satunya sumber kebenaran (single source of truth) untuk:
//  - tipe input yang diizinkan tiap field konfigurasi (angka / huruf / IP / dst)
//  - validasi format tiap field
//  - perhitungan subnet/gateway/dns yang sesuai logika jaringan sungguhan
//
// Dipakai bareng oleh DeviceConfig.vue (validasi real-time saat mengetik)
// dan MainScene.js (validasi topologi saat tombol VALIDASI/PLAY ditekan),
// supaya aturannya tidak pernah berbeda/duplikat di dua tempat (sumber bug lama).
// ============================================================================

export const FIELD_TYPES = {
  IP: 'ip',
  SUBNET: 'subnet',
  GATEWAY: 'gateway',
  DNS: 'dns',
  HOSTNAME: 'hostname',
  SSID: 'ssid',
  PASSWORD: 'password',
  NUMBER: 'number',
  INTEGER: 'integer',
  TEXT: 'text'
};

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isValidIPv4Format(value) {
  return typeof value === 'string' && IPV4_REGEX.test(value);
}

// IP yang formatnya valid tapi tidak boleh dipakai sebagai alamat host sungguhan
// (network address, broadcast, loopback, link-local, multicast/reserved).
export function invalidHostIpReason(value) {
  const octets = value.split('.').map(Number);
  if (value === '0.0.0.0') return 'IP tidak boleh 0.0.0.0 (network address)';
  if (value === '255.255.255.255') return 'IP tidak boleh 255.255.255.255 (broadcast address)';
  if (octets[0] === 127) return 'IP tidak boleh di rentang loopback (127.x.x.x)';
  if (octets[0] === 169 && octets[1] === 254) return 'IP tidak boleh di rentang link-local (169.254.x.x)';
  if (octets[0] >= 224) return 'IP tidak boleh di rentang multicast/reserved (224-255.x.x.x)';
  if (octets[0] === 0) return 'Oktet pertama IP tidak boleh 0';
  return null;
}

// Subnet mask valid = bit 1 berurutan dari kiri lalu bit 0 (contoh: 255.255.255.0),
// bukan sembarang kombinasi 0-255 seperti IP biasa.
export function isValidSubnetMask(value) {
  if (!isValidIPv4Format(value)) return false;
  const octets = value.split('.').map(Number);
  const validOctetValues = [0, 128, 192, 224, 240, 248, 252, 254, 255];
  if (!octets.every(o => validOctetValues.includes(o))) return false;
  const bin = octets.map(o => o.toString(2).padStart(8, '0')).join('');
  if (!/^1*0*$/.test(bin)) return false;
  const ones = (bin.match(/1/g) || []).length;
  return ones >= 1 && ones <= 30; // hindari /0 (bukan subnet) dan /31,/32 (tidak relevan utk LAN sederhana)
}

function ipToInt(ip) {
  return ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

export function networkAddress(ip, mask) {
  return (ipToInt(ip) & ipToInt(mask)) >>> 0;
}

// Bandingkan network ID dua IP memakai subnet mask yang sesungguhnya (bitwise),
// bukan asumsi /24 yang keliru kalau ada yang pakai mask lain.
export function sameNetwork(ipA, maskA, ipB, maskB) {
  if (!isValidIPv4Format(ipA) || !isValidIPv4Format(ipB)) return true; // data belum lengkap, jangan tuduh salah
  const mask = isValidSubnetMask(maskA) ? maskA : (isValidSubnetMask(maskB) ? maskB : '255.255.255.0');
  return networkAddress(ipA, mask) === networkAddress(ipB, mask);
}

// ---------- SANITASI INPUT (dijalankan tiap kali user mengetik) ----------
export function sanitizeInput(field, rawValue) {
  switch (field.type) {
    case FIELD_TYPES.IP:
    case FIELD_TYPES.SUBNET:
    case FIELD_TYPES.GATEWAY:
    case FIELD_TYPES.DNS:
      // Hanya angka dan titik, sesuai format alamat IP.
      return rawValue.replace(/[^0-9.]/g, '').slice(0, 15);

    case FIELD_TYPES.INTEGER: {
      // Cuma bilangan bulat positif, tanpa titik/minus (mis. jumlah port).
      return rawValue.replace(/[^0-9]/g, '').slice(0, 4);
    }

    case FIELD_TYPES.NUMBER: {
      // Angka desimal, boleh minus di depan (mis. ambang sensor).
      let v = rawValue.replace(/[^0-9.-]/g, '');
      v = v[0] === '-' ? '-' + v.slice(1).replace(/-/g, '') : v.replace(/-/g, '');
      const parts = v.split('.');
      if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
      return v.slice(0, 10);
    }

    case FIELD_TYPES.HOSTNAME:
      // Cuma huruf, angka, garis bawah, dan strip — seperti aturan hostname/ID perangkat asli.
      return rawValue.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);

    case FIELD_TYPES.SSID:
      // Huruf, angka, spasi, dan simbol umum yang dipakai di SSID WiFi. Maks 32 karakter (standar 802.11).
      return rawValue.replace(/[^a-zA-Z0-9 _.-]/g, '').slice(0, 32);

    case FIELD_TYPES.PASSWORD:
      // WPA2-PSK: tanpa spasi, maks 63 karakter, boleh kombinasi huruf/angka/simbol.
      return rawValue.replace(/\s/g, '').slice(0, 63);

    case FIELD_TYPES.TEXT:
    default:
      return rawValue.slice(0, 40);
  }
}

// ---------- VALIDASI FORMAT PER-FIELD (tanpa konteks device lain) ----------
// Dipakai untuk feedback real-time di form konfigurasi.
export function fieldFormatError(field, value) {
  if (value === undefined || value === null || value === '') return null;

  switch (field.type) {
    case FIELD_TYPES.IP: {
      if (!isValidIPv4Format(value)) return 'Format harus IP Address, contoh: 192.168.1.10';
      return invalidHostIpReason(value);
    }
    case FIELD_TYPES.GATEWAY: {
      if (!isValidIPv4Format(value)) return 'Format harus IP Address, contoh: 192.168.1.1';
      return invalidHostIpReason(value);
    }
    case FIELD_TYPES.DNS: {
      if (!isValidIPv4Format(value)) return 'Format harus IP Address, contoh: 8.8.8.8';
      if (value === '0.0.0.0') return 'DNS tidak boleh 0.0.0.0';
      return null;
    }
    case FIELD_TYPES.SUBNET: {
      if (!isValidIPv4Format(value)) return 'Format harus Subnet Mask, contoh: 255.255.255.0';
      if (!isValidSubnetMask(value)) return `"${value}" bukan Subnet Mask yang valid. Contoh benar: 255.255.255.0`;
      return null;
    }
    case FIELD_TYPES.HOSTNAME: {
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{1,19}$/.test(value)) {
        return 'Gunakan huruf/angka/-/_, diawali huruf, panjang 2-20 karakter';
      }
      return null;
    }
    case FIELD_TYPES.SSID: {
      if (value.length < 1 || value.length > 32) return 'SSID harus 1-32 karakter';
      return null;
    }
    case FIELD_TYPES.PASSWORD: {
      if (value.length < 8 || value.length > 63) return 'Password WiFi (WPA2) harus 8-63 karakter';
      return null;
    }
    case FIELD_TYPES.INTEGER: {
      const n = Number(value);
      if (!Number.isInteger(n)) return 'Harus berupa bilangan bulat (tanpa koma)';
      if (field.min !== undefined && n < field.min) return `Nilai minimal ${field.min}`;
      if (field.max !== undefined && n > field.max) return `Nilai maksimal ${field.max}`;
      return null;
    }
    case FIELD_TYPES.NUMBER: {
      const n = Number(value);
      if (Number.isNaN(n)) return 'Harus berupa angka';
      if (field.min !== undefined && n < field.min) return `Nilai tidak realistis. Rentang: ${field.min} - ${field.max}`;
      if (field.max !== undefined && n > field.max) return `Nilai tidak realistis. Rentang: ${field.min} - ${field.max}`;
      return null;
    }
    default:
      return null;
  }
}

// Placeholder & inputmode per tipe field, dipakai komponen form supaya
// keyboard virtual (mobile) & contoh yang ditampilkan sesuai jenis datanya.
export function fieldPlaceholder(field) {
  switch (field.type) {
    case FIELD_TYPES.IP: return '192.168.1.10';
    case FIELD_TYPES.GATEWAY: return '192.168.1.1';
    case FIELD_TYPES.DNS: return '8.8.8.8';
    case FIELD_TYPES.SUBNET: return '255.255.255.0';
    case FIELD_TYPES.SSID: return 'Nama_WiFi';
    case FIELD_TYPES.PASSWORD: return 'Minimal 8 karakter';
    case FIELD_TYPES.HOSTNAME: return 'Contoh: SW-Lantai1';
    case FIELD_TYPES.INTEGER: return field.min !== undefined ? `${field.min} - ${field.max}` : '0';
    case FIELD_TYPES.NUMBER: return field.min !== undefined ? `${field.min} - ${field.max}` : '0';
    default: return field.label;
  }
}

export function fieldInputMode(field) {
  switch (field.type) {
    case FIELD_TYPES.IP:
    case FIELD_TYPES.GATEWAY:
    case FIELD_TYPES.DNS:
    case FIELD_TYPES.SUBNET:
    case FIELD_TYPES.NUMBER:
      return 'decimal';
    case FIELD_TYPES.INTEGER:
      return 'numeric';
    default:
      return 'text';
  }
}