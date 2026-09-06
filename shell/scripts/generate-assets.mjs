#!/usr/bin/env node

/**

 * Generates the binary assets Expo needs that cannot live in source control as text:

 *   assets/notification-icon.png  -> 96x96 white-on-transparent status bar icon (Android requirement)

 *   assets/adaptive-icon.png      -> 1024x1024 foreground layer built from icon.png (if present) or a drawn planet

 *   assets/splash.png             -> 1024x1024 splash artwork on #0f172a

 *   assets/sounds/ringtone.wav    -> 4s two-tone ring cadence (16-bit PCM, 22.05kHz)

 *

 * Usage: node scripts/generate-assets.mjs

 */

import { deflateSync } from "node:zlib";

import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";



const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const assets = join(root, "assets");

mkdirSync(join(assets, "sounds"), { recursive: true });



/* ----------------------------------------------------------- PNG writer */

const CRC_TABLE = new Uint32Array(256).map((_, n) => {

  let c = n;

  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

  return c >>> 0;

});

const crc32 = (buf) => {

  let c = 0xffffffff;

  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);

  return (c ^ 0xffffffff) >>> 0;

};

const chunk = (type, data) => {

  const len = Buffer.alloc(4);

  len.writeUInt32BE(data.length);

  const typeBuf = Buffer.from(type, "ascii");

  const crc = Buffer.alloc(4);

  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));

  return Buffer.concat([len, typeBuf, data, crc]);

};

function encodePng(width, height, rgba) {

  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {

    raw[y * (width * 4 + 1)] = 0;

    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);

  }

  const ihdr = Buffer.alloc(13);

  ihdr.writeUInt32BE(width, 0);

  ihdr.writeUInt32BE(height, 4);

  ihdr[8] = 8;

  ihdr[9] = 6;

  ihdr[10] = 0;

  ihdr[11] = 0;

  ihdr[12] = 0;

  return Buffer.concat([

    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),

    chunk("IHDR", ihdr),

    chunk("IDAT", deflateSync(raw, { level: 9 })),

    chunk("IEND", Buffer.alloc(0)),

  ]);

}



/* -------------------------------------------------------- planet raster */

function drawPlanet(size, { background, mono }) {

  const px = Buffer.alloc(size * size * 4);

  const cx = size / 2;

  const cy = size / 2;

  const planetR = size * 0.23;

  const ringA = size * 0.42;

  const ringB = size * 0.15;

  const ringWidth = size * 0.028;

  const tilt = (-22 * Math.PI) / 180;

  const cosT = Math.cos(tilt);

  const sinT = Math.sin(tilt);

  const moonAngle = (35 * Math.PI) / 180;

  const moonX = cx + Math.cos(moonAngle) * ringA * cosT - Math.sin(moonAngle) * ringB * sinT;

  const moonY = cy + Math.cos(moonAngle) * ringA * sinT + Math.sin(moonAngle) * ringB * cosT;

  const moonR = size * 0.035;



  const put = (i, r, g, b, a) => {

    const alpha = a / 255;

    const inv = 1 - alpha;

    px[i] = Math.round(r * alpha + px[i] * inv);

    px[i + 1] = Math.round(g * alpha + px[i + 1] * inv);

    px[i + 2] = Math.round(b * alpha + px[i + 2] * inv);

    px[i + 3] = Math.min(255, Math.round(px[i + 3] + a * (1 - px[i + 3] / 255)));

  };



  for (let y = 0; y < size; y += 1) {

    for (let x = 0; x < size; x += 1) {

      const i = (y * size + x) * 4;

      if (background) {

        px[i] = background[0];

        px[i + 1] = background[1];

        px[i + 2] = background[2];

        px[i + 3] = 255;

      }

      const dx = x + 0.5 - cx;

      const dy = y + 0.5 - cy;



      const rx = dx * cosT + dy * sinT;

      const ry = -dx * sinT + dy * cosT;

      const ringDist = Math.sqrt((rx * rx) / (ringA * ringA) + (ry * ry) / (ringB * ringB));

      const ringEdge = Math.abs(ringDist - 1) * Math.min(ringA, ringB);

      const behindPlanet = ry < 0;

      const insidePlanet = dx * dx + dy * dy < planetR * planetR;



      if (ringEdge < ringWidth && !(behindPlanet && insidePlanet)) {

        const a = Math.round(255 * Math.min(1, (ringWidth - ringEdge) / (size * 0.006)));

        if (mono) put(i, 255, 255, 255, a);

        else put(i, 241, 209, 138, a);

      }



      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < planetR + 1) {

        const a = Math.round(255 * Math.min(1, planetR + 1 - dist));

        if (mono) {

          put(i, 255, 255, 255, a);

        } else {

          const t = Math.min(1, Math.max(0, (dx + dy + planetR * 1.4) / (planetR * 2.8)));

          const r = Math.round(241 + (184 - 241) * t);

          const g = Math.round(209 + (134 - 209) * t);

          const b = Math.round(138 + (59 - 138) * t);

          put(i, r, g, b, a);

        }

      }



      const mdx = x + 0.5 - moonX;

      const mdy = y + 0.5 - moonY;

      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (mdist < moonR + 1 && !(ry < 0 && insidePlanet)) {

        const a = Math.round(255 * Math.min(1, moonR + 1 - mdist));

        if (mono) put(i, 255, 255, 255, a);

        else put(i, 241, 209, 138, a);

      }

    }

  }

  return px;

}



const NAVY = [0x0f, 0x17, 0x2a];



writeFileSync(join(assets, "notification-icon.png"), encodePng(96, 96, drawPlanet(96, { background: null, mono: true })));

console.log("✔ assets/notification-icon.png");



writeFileSync(join(assets, "splash.png"), encodePng(1024, 1024, drawPlanet(1024, { background: NAVY, mono: false })));

console.log("✔ assets/splash.png");



if (existsSync(join(assets, "icon.png"))) {

  copyFileSync(join(assets, "icon.png"), join(assets, "adaptive-icon.png"));

  console.log("✔ assets/adaptive-icon.png (from icon.png)");

} else {

  writeFileSync(join(assets, "icon.png"), encodePng(1024, 1024, drawPlanet(1024, { background: NAVY, mono: false })));

  writeFileSync(join(assets, "adaptive-icon.png"), encodePng(1024, 1024, drawPlanet(1024, { background: null, mono: false })));

  console.log("✔ assets/icon.png + assets/adaptive-icon.png (drawn)");

}



/* -------------------------------------------------------------- ringtone */

function buildRingtone() {

  const sampleRate = 22050;

  const seconds = 4;

  const total = sampleRate * seconds;

  const data = Buffer.alloc(total * 2);

  for (let n = 0; n < total; n += 1) {

    const t = n / sampleRate;

    const cycle = t % 4;

    let env = 0;

    if (cycle < 1.2) env = 1;

    else if (cycle >= 1.4 && cycle < 2.6) env = 1;

    if (env > 0) {

      const local = cycle < 1.2 ? cycle : cycle - 1.4;

      const attack = Math.min(1, local / 0.02);

      const release = Math.min(1, (1.2 - local) / 0.05);

      env = Math.min(attack, release);

    }

    const tremolo = 0.75 + 0.25 * Math.sin(2 * Math.PI * 20 * t);

    const sample = env * tremolo * (0.45 * Math.sin(2 * Math.PI * 440 * t) + 0.45 * Math.sin(2 * Math.PI * 480 * t));

    data.writeInt16LE(Math.round(sample * 0.8 * 32767), n * 2);

  }

  const header = Buffer.alloc(44);

  header.write("RIFF", 0);

  header.writeUInt32LE(36 + data.length, 4);

  header.write("WAVE", 8);

  header.write("fmt ", 12);

  header.writeUInt32LE(16, 16);

  header.writeUInt16LE(1, 20);

  header.writeUInt16LE(1, 22);

  header.writeUInt32LE(sampleRate, 24);

  header.writeUInt32LE(sampleRate * 2, 28);

  header.writeUInt16LE(2, 32);

  header.writeUInt16LE(16, 34);

  header.write("data", 36);

  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);

}



writeFileSync(join(assets, "sounds", "ringtone.wav"), buildRingtone());

console.log("✔ assets/sounds/ringtone.wav");
