# HKC CAMERA 📸

> **Professional Camera Studio, 9:16 Vertical Video Reels & Photography Vault**  
> Mobile-First Progressive Web App (PWA) built with Vanilla JavaScript, HTML5 & CSS3.

[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-black?style=flat&logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-blue?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Overview

**HKC CAMERA** is a camera studio application designed for mobile devices (optimized for Android Chrome, Vivo Y31 Pro, and Desktop). It operates as an offline-first Progressive Web App (PWA) that captures high-framerate 9:16 vertical reels video and high-resolution photos, storing them securely in an on-device IndexedDB vault.

The project is structured to deploy smoothly on **Vercel** with zero-configuration static hosting and serverless functions, or run locally via a standalone Node.js server.

---

## ✨ Features

- **📱 9:16 Vertical Video Reels**: Native MediaRecorder streaming with real-time audio/video track synchronization.
- **📸 High-Resolution Photography**: Native canvas frame capture with customizable aspect ratios and quality settings.
- **🎛️ Pro Controls**: Resolution picker (720p, 1080p, 4K), FPS selection (24, 30, 60 fps), optical/digital zoom slider, torch/flashlight toggle, grid overlay, and low-light detection.
- **🎨 Real-Time Filters**: Live CSS/WebGL shader-inspired filters (Original, Vivid, Noir, Chrome, Warm, Cool, Cyberpunk).
- **🔒 Private Media Vault**: Integrated gallery with batch selection, full-screen interactive gesture viewer (pinch-to-zoom, pan), and download/export capabilities.
- **⚡ Offline-First PWA**: Service Worker caching strategy for fast offline loading and home-screen installability.
- **🚀 Flexible Deployment**: 
  - **Vercel**: Deploy as a static PWA with automated SSL, global CDN, and serverless API endpoints.
  - **Local Node.js**: Built-in HTTP streaming server (`server.mjs`) with byte-range video streaming and atomic sequential file naming.

---

## 🚀 Deployment to Vercel

HKC CAMERA is optimized for Vercel deployment with included `vercel.json` and `/api/status.js`.

### Method 1: Import via Vercel Dashboard (Recommended)

1. Sign in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** &rarr; **Project**.
3. Import the repository: `tradewithsehar-stack/hkc-camera`.
4. Leave **Framework Preset** as **Other** (or automatic).
5. Leave **Root Directory** as `./`.
6. Click **Deploy**.

> **Note on Camera Permissions**: Modern web browsers require a secure HTTPS context for camera and microphone access (`navigator.mediaDevices.getUserMedia`). Vercel provides automatic SSL/HTTPS for all domains, ensuring camera hardware permissions work seamlessly on mobile and desktop.

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from the project directory
vercel
```

---

## 💻 Local Development & Self-Hosting

You can also run the camera studio locally on your network using the built-in Node server:

### Prerequisites
- [Node.js](https://nodejs.org) v18.0.0 or later.

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tradewithsehar-stack/hkc-camera.git
cd hkc-camera

# 2. Start the local server
npm start
# or: node server.mjs
```

The application will start at `http://localhost:8080`.

### Mobile Testing over Local Network
To test on a mobile phone (e.g. Android / Vivo Y31 Pro) connected to the same Wi-Fi network:
1. Find your computer's local IP address (`ipconfig` on Windows or `ifconfig` on macOS/Linux).
2. Open Chrome on your mobile device and navigate to `http://<YOUR_LOCAL_IP>:8080`.
3. *(Optional for HTTP on Android)*: In Chrome, go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, add your `http://<YOUR_LOCAL_IP>:8080`, and restart Chrome to grant camera permissions.

---

## 📁 Project Structure

```
hkc-camera/
├── api/
│   └── status.js            # Vercel Serverless Function (API health check)
├── backend/
│   └── data/                # Local metadata (counter.json, media-index.json)
├── icons/                   # App icons & SVG assets for PWA manifest
│   ├── camera-icon.svg
│   ├── favicon.png
│   ├── icon-192.png
│   └── icon-512.png
├── media/                   # Local media storage for Node.js server
│   ├── photos/              # Captured photos
│   ├── thumbnails/          # Generated photo/video thumbnails
│   └── videos/              # Captured video reels
├── build.js                 # Static asset build script
├── index.html               # Main HTML5 application shell & UI
├── manifest.json            # PWA Web App Manifest
├── package.json             # NPM package scripts & configuration
├── README.md                # Documentation & deployment guide
├── script.js                # Core camera, IndexedDB, and gallery logic
├── server.mjs               # Standalone Node.js HTTP server & Vercel entrypoint
├── style.css                # Custom CSS styling & responsive mobile UI
├── sw.js                    # Service Worker for offline PWA caching
└── vercel.json              # Vercel configuration (headers, PWA caching, policies)
```

---

## 🔐 Default Access Credentials

The default credentials configured in `script.js` are:

- **Username**: `sehar`
- **Password**: `admiinsehar`

*(You can customize these credentials in `script.js` under `AUTH_CREDENTIALS`)*.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
