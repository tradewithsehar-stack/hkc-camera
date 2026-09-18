/**
 * ============================================================================
 * HKC CAMERA - Core Application Logic (v2.0.0 Reels & Pro Video Upgrade)
 * Mobile-First • Vanilla JavaScript • Native Browser APIs
 * Optimized for Vivo Y31 Pro (Chrome Android) & Windows Desktop PC
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Application State
  // --------------------------------------------------------------------------
  const AUTH_CREDENTIALS = {
    username: 'sehar',
    password: 'admiinsehar'
  };

  const DB_CONFIG = {
    name: 'HKC_Camera_DB',
    version: 1,
    store: 'photos'
  };

  const APP_STATE = {
    isLoggedIn: false,
    currentTab: 'camera', // 'camera' | 'gallery' | 'settings'
    cameraMode: 'video',  // 'video' (Default for Reels) | 'photo' | 'pro' | 'portrait' | 'timelapse' | 'slowmo'
    stream: null,
    activeTrack: null,
    facingMode: 'environment', // 'environment' | 'user'
    
    // Aspect Ratio & Orientation
    aspectRatio: '9:16', // Primary Reels ratio: 9:16
    orientationSetting: 'portrait', // 'portrait' | 'landscape' | 'auto'
    activeOrientation: 'portrait',  // 'portrait' | 'landscape'
    
    // Hardware & Stream Settings
    targetResolution: 1080, // 720, 1080, 2160
    targetFps: 30,          // 23, 24, 25, 30, 50, 60
    currentZoom: 1.0,
    isTorchOn: false,
    isNightMode: false,
    isGridOn: false,
    timerSeconds: 0,
    timerRunning: false,
    timerInterval: null,
    isSoundOn: true,
    photoQuality: 0.95,
    mirrorFront: true,
    activeFilter: 'original',
    
    // Video Recording State
    isRecordingVideo: false,
    mediaRecorder: null,
    recordedChunks: [],
    videoStartTime: null,
    videoTimerInterval: null,
    recordingMimeType: 'video/webm',
    lastRecordedVideoBlob: null,
    lastRecordedRecord: null,
    
    // Low Light Assist
    lowLightDismissed: false,
    lumaCheckInterval: null,
    
    // Media & Gallery
    mediaList: [],
    activeGalleryFilter: 'all', // 'all' | 'photo' | 'video'
    activeViewerIndex: -1,
    activeViewerUrl: null,
    activeThumbUrls: new Map(), // mediaId -> objectUrl
    isSelectMode: false,
    selectedMediaIds: new Set(),
    
    // Viewer Gesture & Transform State
    viewerZoom: 1,
    viewerPanX: 0,
    viewerPanY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    initialPinchDistance: 0,
    initialPinchScale: 1,
    lastTapTime: 0
  };

  // --------------------------------------------------------------------------
  // 2. DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    // Screens & Shell
    loginScreen: document.getElementById('login-screen'),
    appContainer: document.getElementById('app-container'),
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    togglePasswordBtn: document.getElementById('toggle-password-btn'),
    eyeIcon: document.getElementById('eye-icon'),
    eyeOffIcon: document.getElementById('eye-off-icon'),
    rememberLogin: document.getElementById('remember-login'),
    loginError: document.getElementById('login-error'),
    loginErrorText: document.getElementById('login-error-text'),

    // Desktop Nav
    desktopNavBtns: document.querySelectorAll('.desktop-nav-btn'),
    desktopThemeToggle: document.getElementById('desktop-theme-toggle'),
    desktopLogoutBtn: document.getElementById('desktop-logout-btn'),
    desktopGalleryCount: document.getElementById('desktop-gallery-count'),
    iconSun: document.querySelector('.icon-sun'),
    iconMoon: document.querySelector('.icon-moon'),

    // Mobile Bottom Nav
    mobileBottomNav: document.querySelector('.mobile-bottom-nav'),
    mobileNavBtns: document.querySelectorAll('.mobile-nav-btn'),
    mobileGalleryCount: document.getElementById('mobile-gallery-count'),

    // Camera Zone 1: Top Controls
    tabCamera: document.getElementById('tab-camera'),
    cameraVideo: document.getElementById('camera-video'),
    cameraStage: document.getElementById('camera-stage'),
    aspectFrameMask: document.getElementById('aspect-frame-mask'),
    btnFlash: document.getElementById('btn-flash'),
    flashOffIcon: document.getElementById('flash-off-icon'),
    flashOnIcon: document.getElementById('flash-on-icon'),
    btnNightMode: document.getElementById('btn-night-mode'),
    nightBadge: document.getElementById('night-badge'),
    cameraStatusPill: document.getElementById('camera-status-pill'),
    statusRatioText: document.getElementById('status-ratio-text'),
    cameraResBadge: document.getElementById('camera-res-badge'),
    cameraFpsBadge: document.getElementById('camera-fps-badge'),
    btnGridToggle: document.getElementById('btn-grid-toggle'),
    btnSettingsQuick: document.getElementById('btn-settings-quick'),
    btnMoreToggle: document.getElementById('btn-more-toggle'),

    // Camera Zone 2: Overlays & HUDs
    cameraGrid: document.getElementById('camera-grid'),
    proHud: document.getElementById('pro-hud'),
    hudIso: document.getElementById('hud-iso'),
    hudShutter: document.getElementById('hud-shutter'),
    hudEv: document.getElementById('hud-ev'),
    hudWb: document.getElementById('hud-wb'),
    hudFocus: document.getElementById('hud-focus'),
    hudZoom: document.getElementById('hud-zoom'),
    portraitVignette: document.getElementById('portrait-vignette'),
    videoHud: document.getElementById('video-hud'),
    videoTimer: document.getElementById('video-timer'),
    videoHudSpecs: document.getElementById('video-hud-specs'),
    uploadStatusChip: document.getElementById('upload-status-chip'),
    uploadStatusText: document.getElementById('upload-status-text'),
    focusReticle: document.getElementById('focus-reticle'),
    activeFilterLabel: document.getElementById('active-filter-label'),
    lowLightAlert: document.getElementById('low-light-alert'),
    btnApplyNightAssist: document.getElementById('btn-apply-night-assist'),
    btnDismissNightAssist: document.getElementById('btn-dismiss-night-assist'),
    timerCountdown: document.getElementById('timer-countdown'),
    timerCountdownNumber: document.getElementById('timer-countdown-number'),
    screenFlash: document.getElementById('screen-flash'),
    cameraFallback: document.getElementById('camera-fallback'),
    btnCameraRetry: document.getElementById('btn-camera-retry'),
    btnCameraSimulator: document.getElementById('btn-camera-simulator'),

    // Camera Zone 3: Quick Controls & Modes
    zoomControlBar: document.getElementById('zoom-control-bar'),
    zoomChips: document.querySelectorAll('.zoom-chip'),
    zoomTypeBadge: document.getElementById('zoom-type-badge'),
    presetPills: document.querySelectorAll('.preset-pill'),
    modeItems: document.querySelectorAll('.mode-item'),

    // Camera Zone 4: Shutter Console
    btnShutter: document.getElementById('btn-shutter'),
    btnFlipCamera: document.getElementById('btn-flip-camera'),
    flipIcon: document.getElementById('flip-icon'),
    btnLastPhoto: document.getElementById('btn-last-photo'),
    thumbImgContainer: document.getElementById('thumb-img-container'),

    // Bottom Sheets
    aspectRatioSheet: document.getElementById('aspect-ratio-sheet'),
    aspectBtns: document.querySelectorAll('.aspect-btn'),
    proDrawer: document.getElementById('pro-drawer'),
    proEvSlider: document.getElementById('pro-ev-slider'),
    proEvLabel: document.getElementById('pro-ev-label'),
    proIsoStatus: document.getElementById('pro-iso-status'),
    proIsoChips: document.querySelectorAll('#pro-iso-chips .pro-chip'),
    proWbStatus: document.getElementById('pro-wb-status'),
    proWbChips: document.querySelectorAll('#pro-wb-chips .pro-chip'),
    proAfSegmentBtns: document.querySelectorAll('#pro-af-segmented .segment-btn'),
    proAeSegmentBtns: document.querySelectorAll('#pro-ae-segmented .segment-btn'),
    proTvStatus: document.getElementById('pro-tv-status'),
    proTvChips: document.querySelectorAll('#pro-tv-chips .pro-chip'),
    videoSettingsSheet: document.getElementById('video-settings-sheet'),
    qualityCards: document.querySelectorAll('.quality-card'),
    status720p: document.getElementById('status-720p'),
    status1080p: document.getElementById('status-1080p'),
    status4k: document.getElementById('status-4k'),
    fpsCards: document.querySelectorAll('.fps-card'),
    filtersSheet: document.getElementById('filters-sheet'),
    filterCards: document.querySelectorAll('.filter-card'),
    cameraMoreSheet: document.getElementById('camera-more-sheet'),
    moreTileAspect: document.getElementById('more-tile-aspect'),
    moreTileRes: document.getElementById('more-tile-res'),
    moreTileFilters: document.getElementById('more-tile-filters'),
    moreTilePro: document.getElementById('more-tile-pro'),
    moreTileTimer: document.getElementById('more-tile-timer'),
    moreTileCloud: document.getElementById('more-tile-cloud'),
    moreTileOrientation: document.getElementById('more-tile-orientation'),
    moreAspectVal: document.getElementById('more-aspect-val'),
    moreResVal: document.getElementById('more-res-val'),
    moreFilterVal: document.getElementById('more-filter-val'),
    moreTimerVal: document.getElementById('more-timer-val'),
    moreOrientationVal: document.getElementById('more-orientation-val'),
    moreCloudVal: document.getElementById('more-cloud-val'),

    // Gallery Screen Elements
    tabGallery: document.getElementById('tab-gallery'),
    galleryGrid: document.getElementById('gallery-grid'),
    galleryEmpty: document.getElementById('gallery-empty'),
    btnEmptyGotoCamera: document.getElementById('btn-empty-goto-camera'),
    galleryCountBadge: document.getElementById('gallery-count-badge'),
    galleryFilterTabBtns: document.querySelectorAll('.filter-tab-btn'),
    btnSyncRefresh: document.getElementById('btn-sync-refresh'),
    btnSelectMode: document.getElementById('btn-select-mode'),
    selectModeText: document.getElementById('select-mode-text'),
    multiSelectBar: document.getElementById('multi-select-bar'),
    selectedCountText: document.getElementById('selected-count-text'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnDownloadSelected: document.getElementById('btn-download-selected'),
    btnDeleteSelected: document.getElementById('btn-delete-selected'),
    btnCancelSelection: document.getElementById('btn-cancel-selection'),

    // Settings Screen Elements
    tabSettings: document.getElementById('tab-settings'),
    themeSegmentedBtns: document.querySelectorAll('#theme-segmented .segment-btn'),
    orientationSegmentedBtns: document.querySelectorAll('#orientation-segmented .segment-btn'),
    defaultCameraBtns: document.querySelectorAll('#default-camera-segmented .segment-btn'),
    timerSegmentedBtns: document.querySelectorAll('#timer-segmented .segment-btn'),
    qualitySegmentedBtns: document.querySelectorAll('#quality-segmented .segment-btn'),
    settingMirrorFront: document.getElementById('setting-mirror-front'),
    settingGridDefault: document.getElementById('setting-grid-default'),
    settingSound: document.getElementById('setting-sound'),
    storageUsageText: document.getElementById('storage-usage-text'),
    storageCounterText: document.getElementById('storage-counter-text'),
    btnClearVault: document.getElementById('btn-clear-vault'),
    btnLogout: document.getElementById('btn-logout'),

    // Instant Photo Preview Modal
    capturePreviewModal: document.getElementById('capture-preview-modal'),
    capturePreviewImg: document.getElementById('capture-preview-img'),
    btnPreviewClose: document.getElementById('btn-preview-close'),
    btnPreviewRetake: document.getElementById('btn-preview-retake'),
    btnPreviewShare: document.getElementById('btn-preview-share'),
    btnPreviewDownload: document.getElementById('btn-preview-download'),
    previewMetaRes: document.getElementById('preview-meta-res'),
    previewMetaFmt: document.getElementById('preview-meta-fmt'),
    previewMetaSize: document.getElementById('preview-meta-size'),
    previewMetaFilename: document.getElementById('preview-meta-filename'),

    // Instant Video Preview Modal
    videoPreviewModal: document.getElementById('video-preview-modal'),
    videoPreviewPlayer: document.getElementById('video-preview-player'),
    btnVideoPreviewClose: document.getElementById('btn-video-preview-close'),
    btnVideoRetake: document.getElementById('btn-video-retake'),
    btnVideoShare: document.getElementById('btn-video-share'),
    btnVideoDownload: document.getElementById('btn-video-download'),
    videoMetaRes: document.getElementById('video-meta-res'),
    videoMetaDur: document.getElementById('video-meta-dur'),
    videoMetaFps: document.getElementById('video-meta-fps'),
    videoMetaSize: document.getElementById('video-meta-size'),

    // Fullscreen Media Viewer Modal
    fullscreenViewerModal: document.getElementById('fullscreen-viewer-modal'),
    btnViewerClose: document.getElementById('btn-viewer-close'),
    viewerIndexIndicator: document.getElementById('viewer-index-indicator'),
    viewerFilenameText: document.getElementById('viewer-filename-text'),
    btnViewerFullscreen: document.getElementById('btn-viewer-fullscreen'),
    btnViewerDelete: document.getElementById('btn-viewer-delete'),
    viewerStage: document.getElementById('viewer-stage'),
    viewerPanContainer: document.getElementById('viewer-pan-container'),
    viewerOriginalImg: document.getElementById('viewer-original-img'),
    viewerVideoPlayer: document.getElementById('viewer-video-player'),
    viewerPhotoZoomControls: document.getElementById('viewer-photo-zoom-controls'),
    btnViewerPrev: document.getElementById('btn-viewer-prev'),
    btnViewerNext: document.getElementById('btn-viewer-next'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    zoomLevelLabel: document.getElementById('zoom-level-label'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    viewerMetaRes: document.getElementById('viewer-meta-res'),
    viewerMetaSize: document.getElementById('viewer-meta-size'),
    btnViewerShare: document.getElementById('btn-viewer-share'),
    btnViewerDownload: document.getElementById('btn-viewer-download'),

    // Confirm Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmModalTitle: document.getElementById('confirm-modal-title'),
    confirmModalDesc: document.getElementById('confirm-modal-desc'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // Canvases & Toasts
    captureCanvas: document.getElementById('capture-canvas'),
    thumbCanvas: document.getElementById('thumb-canvas'),
    toastContainer: document.getElementById('toast-container')
  };

  // --------------------------------------------------------------------------
  // 3. Unified Media Sequential Naming Manager (HKCCAMERA_0001)
  // --------------------------------------------------------------------------
  const NamingManager = {
    COUNTER_KEY: 'hkc_media_counter',

    getNextFilename(extension) {
      let current = parseInt(localStorage.getItem(this.COUNTER_KEY) || '1', 10);
      if (isNaN(current) || current < 1) current = 1;

      const padNum = String(current).padStart(4, '0');
      const filename = `HKCCAMERA_${padNum}.${extension}`;

      // Increment for next media
      localStorage.setItem(this.COUNTER_KEY, String(current + 1));
      this.updateUiCounter();

      return filename;
    },

    getCurrentCounterDisplay() {
      let current = parseInt(localStorage.getItem(this.COUNTER_KEY) || '1', 10);
      if (isNaN(current) || current < 1) current = 1;
      return `HKCCAMERA_${String(current).padStart(4, '0')}`;
    },

    updateUiCounter() {
      if (DOM.storageCounterText) {
        DOM.storageCounterText.textContent = this.getCurrentCounterDisplay();
      }
    }
  };

  // --------------------------------------------------------------------------
  // 4. Audio Synthesis Service (Web Audio API - Zero External Files)
  // --------------------------------------------------------------------------
  const AudioService = {
    audioCtx: null,

    init() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    },

    playShutterSound() {
      if (!APP_STATE.isSoundOn) return;
      try {
        this.init();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;

        // Mirror flap
        const osc1 = this.audioCtx.createOscillator();
        const gain1 = this.audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(140, now + 0.04);
        gain1.gain.setValueAtTime(0.45, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc1.connect(gain1);
        gain1.connect(this.audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.05);

        // Curtain noise
        const bufferSize = this.audioCtx.sampleRate * 0.08;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now + 0.02);
        filter.Q.setValueAtTime(2.5, now + 0.02);

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.01, now);
        noiseGain.gain.setValueAtTime(0.35, now + 0.025);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioCtx.destination);

        noise.start(now + 0.02);
        noise.stop(now + 0.095);
      } catch (_) {}
    },

    playTimerBeep(isFinal = false) {
      if (!APP_STATE.isSoundOn) return;
      try {
        this.init();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFinal ? 1200 : 800, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.2 : 0.08));

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + (isFinal ? 0.22 : 0.09));
      } catch (_) {}
    }
  };

  // --------------------------------------------------------------------------
  // 5. IndexedDB Storage Service (Photos & Videos)
  // --------------------------------------------------------------------------
  const DB = {
    dbInstance: null,

    init() {
      return new Promise((resolve, reject) => {
        if (this.dbInstance) return resolve(this.dbInstance);

        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(DB_CONFIG.store)) {
            const store = db.createObjectStore(DB_CONFIG.store, { keyPath: 'id', autoIncrement: true });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.dbInstance = event.target.result;
          resolve(this.dbInstance);
        };

        request.onerror = (event) => reject(event.target.error);
      });
    },

    async saveMedia(record) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readwrite');
        const store = tx.objectStore(DB_CONFIG.store);
        const req = store.add(record);

        req.onsuccess = () => {
          record.id = req.result;
          resolve(record);
        };

        req.onerror = (e) => {
          const err = e.target.error;
          if (err && err.name === 'QuotaExceededError') {
            showToast('Storage is full. Download your media and delete older files to continue.', 'danger', 6000);
          }
          reject(err);
        };
      });
    },

    async getAllMedia() {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readonly');
        const store = tx.objectStore(DB_CONFIG.store);
        const req = store.getAll();

        req.onsuccess = () => {
          const items = (req.result || []).sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async deleteMedia(id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readwrite');
        const store = tx.objectStore(DB_CONFIG.store);
        const req = store.delete(id);

        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async deleteMultiple(ids) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readwrite');
        const store = tx.objectStore(DB_CONFIG.store);
        ids.forEach(id => store.delete(id));

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    },

    async clearAll() {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readwrite');
        const store = tx.objectStore(DB_CONFIG.store);
        const req = store.clear();

        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async updateMedia(record) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const tx = db.transaction([DB_CONFIG.store], 'readwrite');
        const store = tx.objectStore(DB_CONFIG.store);
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async calculateTotalVaultSize() {
      try {
        const items = await this.getAllMedia();
        let totalBytes = 0;
        items.forEach(p => {
          totalBytes += (p.fileSize || (p.blob && p.blob.size) || 0);
          if (p.thumbnail && p.thumbnail.size) totalBytes += p.thumbnail.size;
        });
        return { count: items.length, bytes: totalBytes };
      } catch (_) {
        return { count: 0, bytes: 0 };
      }
    }
  };

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  }

  // --------------------------------------------------------------------------
  // Central Cloud Storage & Cross-Device Sync Engine
  // --------------------------------------------------------------------------
  const RemoteStorageEngine = {
    async getNextFilename(ext = 'jpg') {
      try {
        const res = await fetch(`/api/counter/next?ext=${encodeURIComponent(ext)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.filename) return data.filename;
        }
      } catch (_) {}
      // Offline fallback to local continuous counter
      return NamingManager.getNextFilename(ext);
    },

    async uploadMedia(record) {
      this.showUploadStatus('UPLOADING TO CLOUD...', 'uploading');

      try {
        // Prepare base64 thumbnail if available
        let thumbBase64 = '';
        if (record.thumbnail) {
          thumbBase64 = await blobToBase64(record.thumbnail);
        }

        const headers = {
          'x-filename': record.filename,
          'x-type': record.type || 'photo',
          'x-mime-type': record.mimeType,
          'x-width': String(record.width || 1920),
          'x-height': String(record.height || 1080),
          'x-fps': String(record.fps || 30),
          'x-duration': String(record.duration || ''),
          'x-aspect-ratio': String(record.aspectRatio || '9:16'),
          'x-thumbnail-base64': thumbBase64.replace(/^data:[^;]+;base64,/, '')
        };

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: record.blob
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.item) {
            this.showUploadStatus('✓ SAVED TO HKC CAMERA', 'success');
            // Mark record as synced in local IndexedDB
            record.syncStatus = 'synced';
            record.url = result.item.url;
            record.thumbnailUrl = result.item.thumbnailUrl;
            await DB.updateMedia(record);
            
            // Refresh gallery immediately without reloading
            await this.fetchCentralMedia();
            return result.item;
          }
        }
        throw new Error('Upload response not OK');
      } catch (err) {
        console.warn('Central cloud upload failed, queuing for offline sync:', err);
        record.syncStatus = 'pending';
        await DB.updateMedia(record);
        this.showUploadStatus('UPLOAD PENDING (OFFLINE)', 'pending');
        showToast('Saved in offline vault. Will auto-sync when online.', 'warn', 3500);
        await GalleryEngine.renderGallery();
        return null;
      }
    },

    async fetchCentralMedia() {
      try {
        const res = await fetch('/api/media');
        if (res.ok) {
          const centralList = await res.json();
          const localMedia = await DB.getAllMedia();
          const pendingItems = localMedia.filter(m => m.syncStatus === 'pending');

          // Merge: pending offline items first, then central items (avoid duplicates)
          const seen = new Set(pendingItems.map(p => p.filename));
          const merged = [...pendingItems];

          for (const item of centralList) {
            if (!seen.has(item.filename)) {
              seen.add(item.filename);
              merged.push(item);
            }
          }

          APP_STATE.mediaList = merged;
          GalleryEngine.renderGallery();
          GalleryEngine.refreshGalleryCount();
          return merged;
        }
      } catch (_) {
        // Offline: load from IndexedDB
        const localItems = await DB.getAllMedia();
        APP_STATE.mediaList = localItems;
        GalleryEngine.renderGallery();
        GalleryEngine.refreshGalleryCount();
        return localItems;
      }
    },

    async syncPendingQueue() {
      if (!navigator.onLine) return;
      try {
        const localMedia = await DB.getAllMedia();
        const pending = localMedia.filter(m => m.syncStatus === 'pending' && m.blob);
        if (pending.length === 0) return;

        showToast(`Auto-syncing ${pending.length} offline capture(s)...`, 'info', 2000);
        for (const item of pending) {
          await this.uploadMedia(item);
        }
        showToast('All captures synced to central cloud vault!', 'success', 2500);
      } catch (_) {}
    },

    async deleteMedia(id) {
      try {
        await fetch(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (_) {}
      await DB.deleteMedia(id);
      await this.fetchCentralMedia();
    },

    showUploadStatus(text, state = 'uploading') {
      if (!DOM.uploadStatusChip) return;
      DOM.uploadStatusText.textContent = text;
      DOM.uploadStatusChip.className = `upload-status-chip status-${state}`;
      DOM.uploadStatusChip.classList.remove('hidden');

      if (state === 'success' || state === 'pending') {
        setTimeout(() => {
          DOM.uploadStatusChip.classList.add('hidden');
        }, 3200);
      }
    }
  };

  // --------------------------------------------------------------------------
  // 6. Toast Notification System
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 180ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  // --------------------------------------------------------------------------
  // 7. Camera Engine & Capability Detection (Zero Faking)
  // --------------------------------------------------------------------------
  const CameraEngine = {
    async startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showCameraError('UNSUPPORTED BROWSER', 'Camera API is not supported in this browser. Please use Chrome on Android or Windows.');
        return;
      }

      this.stopCamera();
      DOM.cameraFallback.classList.add('hidden');

      // Request ideal parameters without blindly forcing unsupported constraints
      const targetW = APP_STATE.targetResolution === 2160 ? 3840 : (APP_STATE.targetResolution === 720 ? 1280 : 1920);
      const targetH = APP_STATE.targetResolution === 2160 ? 2160 : (APP_STATE.targetResolution === 720 ? 720 : 1080);

      const constraintOptions = [
        {
          audio: true,
          video: {
            facingMode: { ideal: APP_STATE.facingMode },
            width: { ideal: targetW },
            height: { ideal: targetH },
            frameRate: { ideal: APP_STATE.targetFps }
          }
        },
        {
          audio: true,
          video: {
            facingMode: { ideal: APP_STATE.facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        {
          audio: true,
          video: {
            facingMode: { ideal: APP_STATE.facingMode }
          }
        },
        {
          audio: true,
          video: true
        }
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        this.handleCameraFailure(lastError);
        return;
      }

      APP_STATE.stream = stream;
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        APP_STATE.activeTrack = videoTracks[0];
      }

      DOM.cameraVideo.srcObject = stream;
      DOM.cameraVideo.onloadedmetadata = () => {
        DOM.cameraVideo.play().catch(() => {});
        this.detectCapabilities();
        this.applyMirrorStyle();
        this.startLowLightMonitor();
      };
    },

    stopCamera() {
      this.stopLowLightMonitor();
      if (APP_STATE.stream) {
        APP_STATE.stream.getTracks().forEach(track => track.stop());
        APP_STATE.stream = null;
        APP_STATE.activeTrack = null;
      }
      DOM.cameraVideo.srcObject = null;
      APP_STATE.isTorchOn = false;
      this.updateFlashUi();
    },

    // Real Capability Detection & UI Updates
    detectCapabilities() {
      if (!APP_STATE.activeTrack) return;
      const capabilities = APP_STATE.activeTrack.getCapabilities ? APP_STATE.activeTrack.getCapabilities() : {};
      const settings = APP_STATE.activeTrack.getSettings ? APP_STATE.activeTrack.getSettings() : {};

      // 1. Resolution
      const vw = DOM.cameraVideo.videoWidth || settings.width || 1920;
      const vh = DOM.cameraVideo.videoHeight || settings.height || 1080;
      const maxDim = Math.max(vw, vh);

      if (maxDim >= 3800) {
        DOM.cameraResBadge.textContent = '4K UHD';
        DOM.status4k.textContent = 'Supported';
        DOM.status4k.className = 'q-status status-active';
      } else if (maxDim >= 1800) {
        DOM.cameraResBadge.textContent = '1080P FHD';
        DOM.status4k.textContent = 'Not supported by this sensor';
        DOM.status4k.className = 'q-status';
      } else {
        DOM.cameraResBadge.textContent = '720P HD';
        DOM.status4k.textContent = 'Not supported';
        DOM.status4k.className = 'q-status';
      }

      // 2. FPS
      const actualFps = settings.frameRate ? Math.round(settings.frameRate) : APP_STATE.targetFps;
      DOM.cameraFpsBadge.textContent = `${actualFps} FPS`;
      DOM.videoHudSpecs.textContent = `${DOM.cameraResBadge.textContent} • ${actualFps} FPS`;

      // 3. Pro Readouts
      DOM.hudIso.textContent = settings.iso ? `ISO ${settings.iso}` : (capabilities.iso ? 'AUTO' : 'AUTO / Fixed');
      DOM.hudShutter.textContent = settings.exposureTime ? `1/${Math.round(1 / settings.exposureTime)}` : '1/120';
      DOM.hudEv.textContent = (settings.exposureCompensation !== undefined) ? `${settings.exposureCompensation > 0 ? '+' : ''}${settings.exposureCompensation.toFixed(1)}` : '0.0';
      DOM.hudWb.textContent = settings.whiteBalanceMode ? settings.whiteBalanceMode.toUpperCase() : 'AUTO';
      DOM.hudFocus.textContent = settings.focusMode ? settings.focusMode.toUpperCase() : 'AF-C';
      DOM.hudZoom.textContent = `${APP_STATE.currentZoom.toFixed(1)}×`;

      // 4. Torch availability
      if (capabilities.torch) {
        DOM.btnFlash.removeAttribute('disabled');
      } else {
        DOM.btnFlash.title = 'Torch not supported by this camera';
      }
    },

    async toggleFlash() {
      if (!APP_STATE.activeTrack) {
        showToast('Camera stream is not active', 'warn');
        return;
      }

      const capabilities = APP_STATE.activeTrack.getCapabilities ? APP_STATE.activeTrack.getCapabilities() : {};
      if (!capabilities.torch) {
        showToast('Torch not supported by this camera/browser.', 'warn', 3500);
        return;
      }

      try {
        const nextState = !APP_STATE.isTorchOn;
        await APP_STATE.activeTrack.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        APP_STATE.isTorchOn = nextState;
        this.updateFlashUi();
        showToast(nextState ? 'Torch ON' : 'Torch OFF', 'info', 1500);
      } catch (err) {
        showToast('Failed to toggle hardware torch', 'danger');
      }
    },

    updateFlashUi() {
      if (APP_STATE.isTorchOn) {
        DOM.flashOffIcon.classList.add('hidden');
        DOM.flashOnIcon.classList.remove('hidden');
        DOM.btnFlash.classList.add('active');
      } else {
        DOM.flashOffIcon.classList.remove('hidden');
        DOM.flashOnIcon.classList.add('hidden');
        DOM.btnFlash.classList.remove('active');
      }
    },

    async switchCamera() {
      DOM.flipIcon.style.transform = 'rotate(180deg)';
      setTimeout(() => { DOM.flipIcon.style.transform = 'none'; }, 350);

      APP_STATE.facingMode = (APP_STATE.facingMode === 'environment') ? 'user' : 'environment';
      await this.startCamera();
      showToast(APP_STATE.facingMode === 'environment' ? 'Rear Camera (Reels)' : 'Front Camera Active', 'info', 1500);
    },

    applyMirrorStyle() {
      const isFront = (APP_STATE.facingMode === 'user');
      if (isFront && APP_STATE.mirrorFront) {
        DOM.cameraVideo.classList.add('mirrored');
      } else {
        DOM.cameraVideo.classList.remove('mirrored');
      }
    },

    async setZoom(level) {
      APP_STATE.currentZoom = parseFloat(level);
      DOM.zoomChips.forEach(c => {
        c.classList.toggle('active', parseFloat(c.dataset.zoom) === APP_STATE.currentZoom);
      });
      DOM.hudZoom.textContent = `${APP_STATE.currentZoom.toFixed(1)}×`;

      if (!APP_STATE.activeTrack) return;
      const capabilities = APP_STATE.activeTrack.getCapabilities ? APP_STATE.activeTrack.getCapabilities() : {};

      if (capabilities.zoom && capabilities.zoom.max >= APP_STATE.currentZoom) {
        // Hardware optical/sensor zoom
        if (DOM.zoomTypeBadge) DOM.zoomTypeBadge.textContent = 'OPTICAL';
        try {
          await APP_STATE.activeTrack.applyConstraints({
            advanced: [{ zoom: APP_STATE.currentZoom }]
          });
        } catch (_) {}
      } else {
        // Digital zoom fallback (smooth CSS zoom on viewfinder)
        if (DOM.zoomTypeBadge) DOM.zoomTypeBadge.textContent = 'DIGITAL';
        DOM.cameraVideo.style.transform = `${DOM.cameraVideo.classList.contains('mirrored') ? 'scaleX(-1) ' : ''}scale(${APP_STATE.currentZoom})`;
      }
    },

    async applyExposure(evValue) {
      if (!APP_STATE.activeTrack) return;
      const capabilities = APP_STATE.activeTrack.getCapabilities ? APP_STATE.activeTrack.getCapabilities() : {};

      if (capabilities.exposureCompensation) {
        try {
          await APP_STATE.activeTrack.applyConstraints({
            advanced: [{ exposureCompensation: evValue }]
          });
          DOM.hudEv.textContent = `${evValue > 0 ? '+' : ''}${evValue.toFixed(1)}`;
        } catch (_) {}
      } else {
        DOM.hudEv.textContent = `${evValue > 0 ? '+' : ''}${evValue.toFixed(1)}*`;
      }
    },

    // Ambient Low-Light Monitor
    startLowLightMonitor() {
      if (this.lumaCheckInterval) clearInterval(this.lumaCheckInterval);
      this.lumaCheckInterval = setInterval(() => {
        if (!APP_STATE.isLoggedIn || APP_STATE.currentTab !== 'camera' || APP_STATE.lowLightDismissed) return;
        const video = DOM.cameraVideo;
        if (!video.videoWidth || video.paused) return;

        try {
          const canvas = DOM.thumbCanvas;
          canvas.width = 16;
          canvas.height = 16;
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
          ctx.drawImage(video, 0, 0, 16, 16);
          const imgData = ctx.getImageData(0, 0, 16, 16).data;
          let totalLuma = 0;
          for (let i = 0; i < imgData.length; i += 4) {
            // Perceived luminance formula: 0.299R + 0.587G + 0.114B
            totalLuma += (0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
          }
          const avgLuma = totalLuma / 256;

          if (avgLuma < 38) {
            DOM.lowLightAlert.classList.remove('hidden');
          } else {
            DOM.lowLightAlert.classList.add('hidden');
          }
        } catch (_) {}
      }, 3000);
    },

    stopLowLightMonitor() {
      if (this.lumaCheckInterval) {
        clearInterval(this.lumaCheckInterval);
        this.lumaCheckInterval = null;
      }
    },

    handleCameraFailure(err) {
      console.error('Camera initialization failure:', err);
      let title = 'CAMERA ACCESS REQUIRED';
      let message = 'Please allow camera access in your browser settings and try again.';

      if (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          title = 'PERMISSION DENIED';
          message = 'Camera permission was denied. Tap the lock or tune icon in Chrome address bar to allow camera access.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          title = 'NO CAMERA FOUND';
          message = 'No camera sensor was detected on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          title = 'CAMERA IN USE';
          message = 'The camera is currently in use by another application or tab. Please close other camera apps and retry.';
        }
      }

      document.getElementById('fallback-title').textContent = title;
      document.getElementById('fallback-message').textContent = message;
      DOM.cameraFallback.classList.remove('hidden');
    },

    startSimulatorStream() {
      this.stopCamera();
      DOM.cameraFallback.classList.add('hidden');

      // Create simulator 1080p canvas with live animation
      const simCanvas = document.createElement('canvas');
      simCanvas.width = 1920;
      simCanvas.height = 1080;
      const ctx = simCanvas.getContext('2d');

      const startTime = Date.now();
      const particles = Array.from({ length: 26 }, () => ({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        radius: 35 + Math.random() * 75,
        speedX: (Math.random() - 0.5) * 2.2,
        speedY: (Math.random() - 0.5) * 2.2,
        hue: Math.random() * 360,
        alpha: 0.18 + Math.random() * 0.28
      }));

      function renderFrame() {
        if (!APP_STATE.stream) return;

        // Background cinematic dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
        bgGrad.addColorStop(0, '#0c0f17');
        bgGrad.addColorStop(0.5, '#121926');
        bgGrad.addColorStop(1, '#090b10');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1920, 1080);

        // Animated bokeh particles
        particles.forEach(p => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < -100) p.x = 2020;
          if (p.x > 2020) p.x = -100;
          if (p.y < -100) p.y = 1180;
          if (p.y > 1180) p.y = -100;

          const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          radGrad.addColorStop(0, `hsla(${p.hue}, 85%, 65%, ${p.alpha})`);
          radGrad.addColorStop(1, `hsla(${p.hue}, 85%, 65%, 0)`);
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Studio center grid / reticle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(960, 0); ctx.lineTo(960, 1080);
        ctx.moveTo(0, 540); ctx.lineTo(1920, 540);
        ctx.stroke();

        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.strokeRect(960 - 150, 540 - 150, 300, 300);

        // Center studio labels
        ctx.font = 'bold 36px "Inter", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('HKC CAMERA • 1080P FHD STUDIO FEED', 960, 500);

        ctx.font = '22px "JetBrains Mono", monospace';
        ctx.fillStyle = '#D4AF37';
        const nowSec = ((Date.now() - startTime) / 1000).toFixed(1);
        ctx.fillText(`TIMECODE: ${nowSec}s  |  FPS: 30  |  REELS 9:16 READY`, 960, 550);

        ctx.font = '16px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('Vivo Y31 Pro Chrome Simulation Active', 960, 590);

        requestAnimationFrame(renderFrame);
      }

      // Generate video track
      const videoStream = simCanvas.captureStream(30);
      const videoTrack = videoStream.getVideoTracks()[0];

      // Generate silent audio track so MediaRecorder doesn't fail on audio
      let audioTrack = null;
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        audioTrack = dest.stream.getAudioTracks()[0];
      } catch (_) {}

      const combinedTracks = [videoTrack];
      if (audioTrack) combinedTracks.push(audioTrack);
      const stream = new MediaStream(combinedTracks);

      APP_STATE.stream = stream;
      APP_STATE.activeTrack = videoTrack;

      DOM.cameraVideo.srcObject = stream;
      renderFrame();

      DOM.cameraVideo.onloadedmetadata = () => {
        DOM.cameraVideo.play().catch(() => {});
        this.detectCapabilities();
        this.applyMirrorStyle();
        DOM.cameraResBadge.textContent = '1080P FHD';
        DOM.cameraFpsBadge.textContent = '30 FPS';
        DOM.videoHudSpecs.textContent = '1080P FHD • 30 FPS';
      };

      showToast('Simulated 1080p Studio Feed Active', 'info', 2500);
    }
  };

  // --------------------------------------------------------------------------
  // 8. Aspect Ratio Framing System
  // --------------------------------------------------------------------------
  const AspectRatioManager = {
    setRatio(ratioStr) {
      APP_STATE.aspectRatio = ratioStr;
      if (DOM.statusRatioText) DOM.statusRatioText.textContent = ratioStr;
      if (DOM.moreAspectVal) DOM.moreAspectVal.textContent = ratioStr;
      if (DOM.aspectRatioLabel) DOM.aspectRatioLabel.textContent = ratioStr;

      // Update mask class
      if (DOM.aspectFrameMask) {
        DOM.aspectFrameMask.className = `aspect-frame-mask aspect-${ratioStr.replace(':', '-')}`;
      }

      // Update active state in bottom sheet
      if (DOM.aspectBtns) {
        DOM.aspectBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.ratio === ratioStr);
        });
      }

      showToast(`Aspect Ratio: ${ratioStr}`, 'info', 1200);
    }
  };

  // --------------------------------------------------------------------------
  // 8B. Camera Orientation Engine (Portrait / Landscape / Auto)
  // --------------------------------------------------------------------------
  const OrientationManager = {
    init() {
      const saved = localStorage.getItem('hkc_orientation') || 'portrait';
      this.setOrientation(saved, false);

      // Physical device rotation via Screen Orientation API
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.addEventListener('change', () => {
          if (APP_STATE.orientationSetting === 'auto') {
            this.handleAutoRotate();
          }
        });
      }

      // Orientation media query listener
      const mql = window.matchMedia('(orientation: landscape)');
      if (mql.addEventListener) {
        mql.addEventListener('change', () => {
          if (APP_STATE.orientationSetting === 'auto') {
            this.handleAutoRotate();
          }
        });
      }

      // Resize listener fallback
      window.addEventListener('resize', () => {
        if (APP_STATE.orientationSetting === 'auto') {
          this.handleAutoRotate();
        }
      });
    },

    setOrientation(setting, showNotification = true) {
      APP_STATE.orientationSetting = setting;
      localStorage.setItem('hkc_orientation', setting);

      // Update More sheet badge
      if (DOM.moreOrientationVal) {
        DOM.moreOrientationVal.textContent = setting.toUpperCase();
      }

      // Update Settings tab segmented control
      if (DOM.orientationSegmentedBtns) {
        DOM.orientationSegmentedBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === setting);
        });
      }

      let effective = 'portrait';
      if (setting === 'portrait') {
        effective = 'portrait';
      } else if (setting === 'landscape') {
        effective = 'landscape';
      } else if (setting === 'auto') {
        effective = this.detectPhysicalOrientation();
      }

      this.applyEffectiveOrientation(effective);

      if (showNotification) {
        showToast(`Camera Orientation: ${setting.toUpperCase()}`, 'info', 1200);
      }
    },

    detectPhysicalOrientation() {
      if (window.screen && window.screen.orientation && window.screen.orientation.type) {
        return window.screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
      }
      return (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';
    },

    handleAutoRotate() {
      const detected = this.detectPhysicalOrientation();
      if (detected !== APP_STATE.activeOrientation) {
        this.applyEffectiveOrientation(detected);
      }
    },

    applyEffectiveOrientation(orientation) {
      APP_STATE.activeOrientation = orientation;
      const tabCam = DOM.tabCamera;
      if (!tabCam) return;

      if (orientation === 'landscape') {
        tabCam.classList.add('orientation-landscape');
        tabCam.classList.remove('orientation-portrait');
        // If current ratio is 9:16 vertical, switch to 16:9 landscape default
        if (APP_STATE.aspectRatio === '9:16') {
          AspectRatioManager.setRatio('16:9');
        }
      } else {
        tabCam.classList.add('orientation-portrait');
        tabCam.classList.remove('orientation-landscape');
        // If current ratio is 16:9 horizontal, switch to 9:16 portrait default
        if (APP_STATE.aspectRatio === '16:9') {
          AspectRatioManager.setRatio('9:16');
        }
      }
    },

    cycleOrientation() {
      const cycle = ['portrait', 'landscape', 'auto'];
      const curIdx = cycle.indexOf(APP_STATE.orientationSetting);
      const next = cycle[(curIdx + 1) % cycle.length];
      this.setOrientation(next);
    }
  };

  // --------------------------------------------------------------------------
  // 9. Video Recording Engine (Native MediaStream with MediaRecorder)
  // --------------------------------------------------------------------------
  const VideoEngine = {
    startRecording() {
      if (!APP_STATE.stream) {
        showToast('Camera feed unavailable', 'warn');
        return;
      }

      if (APP_STATE.isRecordingVideo) return;

      APP_STATE.recordedChunks = [];

      // Detect best supported modern MIME type
      const mimeCandidates = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];

      let selectedMime = 'video/webm';
      for (const mime of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      APP_STATE.recordingMimeType = selectedMime;

      try {
        APP_STATE.mediaRecorder = new MediaRecorder(APP_STATE.stream, {
          mimeType: selectedMime,
          videoBitsPerSecond: 8000000 // 8 Mbps high quality
        });

        APP_STATE.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            APP_STATE.recordedChunks.push(e.data);
          }
        };

        APP_STATE.mediaRecorder.onstop = () => this.handleRecordingFinished();

        // 1000ms chunk timeslice for memory stability
        APP_STATE.mediaRecorder.start(1000);

        APP_STATE.isRecordingVideo = true;
        APP_STATE.videoStartTime = Date.now();

        // Visual recording UI
        DOM.videoHud.classList.remove('hidden');
        DOM.btnShutter.classList.add('recording');
        DOM.videoTimer.textContent = '00:00';

        APP_STATE.videoTimerInterval = setInterval(() => {
          const elapsedSec = Math.floor((Date.now() - APP_STATE.videoStartTime) / 1000);
          const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const s = String(elapsedSec % 60).padStart(2, '0');
          DOM.videoTimer.textContent = `${m}:${s}`;
        }, 500);

        showToast('Reels recording started', 'info', 1500);
      } catch (err) {
        console.error('MediaRecorder start error:', err);
        showToast('Failed to start recording: ' + err.message, 'danger');
      }
    },

    stopRecording() {
      if (APP_STATE.mediaRecorder && APP_STATE.isRecordingVideo) {
        APP_STATE.mediaRecorder.stop();
        APP_STATE.isRecordingVideo = false;
        clearInterval(APP_STATE.videoTimerInterval);
        DOM.videoHud.classList.add('hidden');
        DOM.btnShutter.classList.remove('recording');
      }
    },

    async handleRecordingFinished() {
      const elapsedSec = Math.max(1, Math.floor((Date.now() - APP_STATE.videoStartTime) / 1000));
      const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const s = String(elapsedSec % 60).padStart(2, '0');
      const formattedDuration = `${m}:${s}`;

      // Combine original recorded chunks into single Blob without re-encoding
      const finalBlob = new Blob(APP_STATE.recordedChunks, { type: APP_STATE.recordingMimeType });
      APP_STATE.lastRecordedVideoBlob = finalBlob;

      // Determine correct extension matching actual format
      const ext = APP_STATE.recordingMimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = await RemoteStorageEngine.getNextFilename(ext);

      const vw = DOM.cameraVideo.videoWidth || 1920;
      const vh = DOM.cameraVideo.videoHeight || 1080;

      // Generate single lightweight video thumbnail from video frame
      const thumbBlob = await this.generateVideoThumbnail(vw, vh);

      const record = {
        blob: finalBlob,
        thumbnail: thumbBlob,
        filename: filename,
        timestamp: Date.now(),
        duration: formattedDuration,
        width: vw,
        height: vh,
        fps: APP_STATE.targetFps,
        mimeType: APP_STATE.recordingMimeType,
        fileSize: finalBlob.size,
        type: 'video',
        aspectRatio: APP_STATE.aspectRatio,
        syncStatus: 'pending'
      };

      // Save into IndexedDB
      const savedRecord = await DB.saveMedia(record);
      APP_STATE.lastRecordedRecord = savedRecord;

      // Automatic background upload to Central Storage (capture != download)
      RemoteStorageEngine.uploadMedia(savedRecord);

      // Update camera last photo/video thumbnail button
      if (thumbBlob) {
        const thumbUrl = URL.createObjectURL(thumbBlob);
        DOM.thumbImgContainer.innerHTML = `<img src="${thumbUrl}" alt="Latest video" />`;
      }

      // Open Instant Video Review Modal
      VideoPreviewModal.open(savedRecord);

      // Refresh gallery counters
      GalleryEngine.refreshGalleryCount();
    },

    async generateVideoThumbnail(w, h) {
      try {
        const canvas = DOM.thumbCanvas;
        const maxDim = 480;
        let tw = w;
        let th = h;
        if (w > h) {
          if (w > maxDim) { th = Math.round((h * maxDim) / w); tw = maxDim; }
        } else {
          if (h > maxDim) { tw = Math.round((w * maxDim) / h); th = maxDim; }
        }

        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(DOM.cameraVideo, 0, 0, tw, th);

        return new Promise(resolve => {
          canvas.toBlob(b => resolve(b), 'image/jpeg', 0.82);
        });
      } catch (_) {
        return null;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 10. Instant Video Review Modal
  // --------------------------------------------------------------------------
  const VideoPreviewModal = {
    currentRecord: null,
    currentUrl: null,

    open(record) {
      this.currentRecord = record;
      if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = URL.createObjectURL(record.blob);

      DOM.videoPreviewPlayer.src = this.currentUrl;
      DOM.videoPreviewPlayer.load();

      // Readout
      DOM.videoMetaRes.textContent = `${record.width} × ${record.height}`;
      DOM.videoMetaDur.textContent = record.duration;
      DOM.videoMetaFps.textContent = `${record.fps} FPS`;
      DOM.videoMetaSize.textContent = (record.fileSize / (1024 * 1024)).toFixed(2) + ' MB';

      DOM.videoPreviewModal.classList.remove('hidden');
    },

    close() {
      DOM.videoPreviewModal.classList.add('hidden');
      DOM.videoPreviewPlayer.pause();
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl);
        this.currentUrl = null;
      }
      this.currentRecord = null;
    },

    download() {
      if (!this.currentRecord) return;
      downloadBlob(this.currentRecord.blob, this.currentRecord.filename);
      showToast('Downloading original recorded video...', 'success');
    },

    async share() {
      if (!this.currentRecord) return;
      await shareBlob(this.currentRecord.blob, this.currentRecord.filename);
    }
  };

  // --------------------------------------------------------------------------
  // 11. Photo Capture Engine (High-Resolution Native Canvas)
  // --------------------------------------------------------------------------
  const CaptureEngine = {
    async handleShutterPress() {
      if (APP_STATE.cameraMode === 'video' || APP_STATE.cameraMode === 'slowmo' || APP_STATE.cameraMode === 'timelapse') {
        if (APP_STATE.isRecordingVideo) {
          VideoEngine.stopRecording();
        } else {
          VideoEngine.startRecording();
        }
        return;
      }

      if (APP_STATE.timerRunning) return;

      if (APP_STATE.timerSeconds > 0) {
        this.startTimerCountdown(() => this.executePhotoCapture());
      } else {
        this.executePhotoCapture();
      }
    },

    startTimerCountdown(onComplete) {
      APP_STATE.timerRunning = true;
      let count = APP_STATE.timerSeconds;
      DOM.timerCountdownNumber.textContent = count;
      DOM.timerCountdown.classList.remove('hidden');
      AudioService.playTimerBeep(false);

      APP_STATE.timerInterval = setInterval(() => {
        count--;
        if (count > 0) {
          DOM.timerCountdownNumber.textContent = count;
          AudioService.playTimerBeep(false);
        } else {
          clearInterval(APP_STATE.timerInterval);
          APP_STATE.timerRunning = false;
          DOM.timerCountdown.classList.add('hidden');
          AudioService.playTimerBeep(true);
          onComplete();
        }
      }, 1000);
    },

    async executePhotoCapture() {
      const video = DOM.cameraVideo;
      const nativeWidth = video.videoWidth;
      const nativeHeight = video.videoHeight;

      if (!nativeWidth || !nativeHeight) {
        showToast('Camera frame not ready yet', 'warn');
        return;
      }

      AudioService.playShutterSound();
      if (navigator.vibrate) {
        try { navigator.vibrate(40); } catch (_) {}
      }

      DOM.screenFlash.classList.add('flash');
      setTimeout(() => DOM.screenFlash.classList.remove('flash'), 100);

      try {
        const canvas = DOM.captureCanvas;
        canvas.width = nativeWidth;
        canvas.height = nativeHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        const isFront = (APP_STATE.facingMode === 'user');
        if (isFront && APP_STATE.mirrorFront) {
          ctx.translate(nativeWidth, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, nativeWidth, nativeHeight);

        const quality = APP_STATE.photoQuality || 0.95;
        const originalBlob = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', quality));

        // Generate thumbnail
        const thumbBlob = await this.generateThumbnail(canvas, nativeWidth, nativeHeight);

        // Continuous atomic sequential filename from Central Storage with fallback
        const filename = await RemoteStorageEngine.getNextFilename('jpg');

        const record = {
          blob: originalBlob,
          thumbnail: thumbBlob,
          filename: filename,
          timestamp: Date.now(),
          width: nativeWidth,
          height: nativeHeight,
          mimeType: 'image/jpeg',
          fileSize: originalBlob.size,
          type: 'photo',
          aspectRatio: APP_STATE.aspectRatio,
          mode: APP_STATE.cameraMode,
          syncStatus: 'pending'
        };

        const savedRecord = await DB.saveMedia(record);

        // Automatic background upload to Central Storage (capture != download)
        RemoteStorageEngine.uploadMedia(savedRecord);

        if (thumbBlob) {
          const url = URL.createObjectURL(thumbBlob);
          DOM.thumbImgContainer.innerHTML = `<img src="${url}" alt="Latest photo" />`;
        }

        PhotoPreviewModal.open(savedRecord);
        GalleryEngine.refreshGalleryCount();
      } catch (err) {
        console.error('Photo capture error:', err);
        showToast('Capture error: ' + err.message, 'danger');
      }
    },

    async generateThumbnail(sourceCanvas, width, height) {
      const maxDim = 540;
      let thumbW = width;
      let thumbH = height;

      if (width > height) {
        if (width > maxDim) { thumbH = Math.round((height * maxDim) / width); thumbW = maxDim; }
      } else {
        if (height > maxDim) { thumbW = Math.round((width * maxDim) / height); thumbH = maxDim; }
      }

      const thumbCanvas = DOM.thumbCanvas;
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const tCtx = thumbCanvas.getContext('2d', { alpha: false });
      tCtx.drawImage(sourceCanvas, 0, 0, thumbW, thumbH);

      return new Promise(resolve => thumbCanvas.toBlob(b => resolve(b), 'image/jpeg', 0.85));
    }
  };

  // --------------------------------------------------------------------------
  // 12. Instant Photo Preview Modal
  // --------------------------------------------------------------------------
  const PhotoPreviewModal = {
    currentRecord: null,
    currentUrl: null,

    open(record) {
      this.currentRecord = record;
      if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = URL.createObjectURL(record.blob);
      DOM.capturePreviewImg.src = this.currentUrl;

      DOM.previewMetaRes.textContent = `${record.width} × ${record.height}`;
      DOM.previewMetaFmt.textContent = 'JPEG';
      DOM.previewMetaSize.textContent = (record.fileSize / (1024 * 1024)).toFixed(2) + ' MB';
      DOM.previewMetaFilename.textContent = record.filename;

      DOM.capturePreviewModal.classList.remove('hidden');
    },

    close() {
      DOM.capturePreviewModal.classList.add('hidden');
      if (this.currentUrl) {
        URL.revokeObjectURL(this.currentUrl);
        this.currentUrl = null;
      }
      this.currentRecord = null;
    },

    download() {
      if (!this.currentRecord) return;
      downloadBlob(this.currentRecord.blob, this.currentRecord.filename);
      showToast('Downloading original photo...', 'success');
    },

    async share() {
      if (!this.currentRecord) return;
      await shareBlob(this.currentRecord.blob, this.currentRecord.filename);
    }
  };

  // --------------------------------------------------------------------------
  // 13. Gallery Engine (Photos & Videos Filtering, Thumbnails, Multi-Select)
  // --------------------------------------------------------------------------
  const GalleryEngine = {
    async renderGallery() {
      APP_STATE.activeThumbUrls.forEach(url => URL.revokeObjectURL(url));
      APP_STATE.activeThumbUrls.clear();

      const allItems = APP_STATE.mediaList && APP_STATE.mediaList.length > 0 
        ? APP_STATE.mediaList 
        : await DB.getAllMedia();
      APP_STATE.mediaList = allItems;
      this.updateCounters(allItems.length);

      let filteredItems = allItems;
      if (APP_STATE.activeGalleryFilter === 'photo') {
        filteredItems = allItems.filter(i => i.type === 'photo');
      } else if (APP_STATE.activeGalleryFilter === 'video') {
        filteredItems = allItems.filter(i => i.type === 'video');
      }

      if (filteredItems.length === 0) {
        DOM.galleryGrid.innerHTML = '';
        DOM.galleryEmpty.classList.remove('hidden');
        return;
      }

      DOM.galleryEmpty.classList.add('hidden');
      const fragment = document.createDocumentFragment();

      filteredItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `gallery-card ${APP_STATE.selectedMediaIds.has(item.id) ? 'selected' : ''}`;
        card.dataset.id = item.id;
        card.dataset.index = index;

        let thumbUrl = '';
        if (item.thumbnailUrl) {
          thumbUrl = item.thumbnailUrl;
        } else if (item.thumbnail || item.blob) {
          thumbUrl = URL.createObjectURL(item.thumbnail || item.blob);
          APP_STATE.activeThumbUrls.set(item.id, thumbUrl);
        } else if (item.url) {
          thumbUrl = item.url;
        }

        const isVideo = item.type === 'video';
        const sizeMb = ((item.fileSize || 0) / (1024 * 1024)).toFixed(1) + 'M';

        card.innerHTML = `
          <img class="gallery-card-img" src="${thumbUrl}" alt="${escapeHtml(item.filename)}" loading="lazy" />
          ${isVideo ? `<div class="video-play-indicator">▶ ${item.duration || 'VIDEO'}</div>` : ''}
          <div class="gallery-card-badge">${item.width || 1920}×${item.height || 1080} &bull; ${sizeMb}</div>
          ${APP_STATE.isSelectMode ? '<div class="gallery-card-check">✓</div>' : ''}
          <div class="gallery-card-actions">
            <button type="button" class="card-action-btn view-btn" title="View Fullscreen" data-action="view">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button type="button" class="card-action-btn dl-btn" title="Download Original" data-action="download">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button type="button" class="card-action-btn delete-btn" title="Delete" data-action="delete">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        `;

        card.addEventListener('click', (e) => {
          const actionBtn = e.target.closest('.card-action-btn');
          if (actionBtn) {
            e.stopPropagation();
            const action = actionBtn.dataset.action;
            if (action === 'view') FullscreenViewer.openAtIndex(index, filteredItems);
            else if (action === 'download') downloadMediaItem(item);
            else if (action === 'delete') promptSingleDelete(item.id);
            return;
          }

          if (APP_STATE.isSelectMode) {
            this.toggleSelectItem(item.id, card);
          } else {
            FullscreenViewer.openAtIndex(index, filteredItems);
          }
        });

        fragment.appendChild(card);
      });

      DOM.galleryGrid.innerHTML = '';
      DOM.galleryGrid.appendChild(fragment);
    },

    updateCounters(count) {
      if (DOM.galleryCountBadge) DOM.galleryCountBadge.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
      if (DOM.mobileGalleryCount) DOM.mobileGalleryCount.textContent = count;
      if (DOM.desktopGalleryCount) DOM.desktopGalleryCount.textContent = count;
    },

    async refreshGalleryCount() {
      const count = APP_STATE.mediaList ? APP_STATE.mediaList.length : (await DB.getAllMedia()).length;
      this.updateCounters(count);
    },

    toggleSelectMode() {
      APP_STATE.isSelectMode = !APP_STATE.isSelectMode;
      APP_STATE.selectedMediaIds.clear();

      DOM.multiSelectBar.classList.toggle('hidden', !APP_STATE.isSelectMode);
      DOM.selectModeText.textContent = APP_STATE.isSelectMode ? 'Done' : 'Select';
      this.updateMultiSelectUi();
      this.renderGallery();
    },

    toggleSelectItem(id, cardEl) {
      if (APP_STATE.selectedMediaIds.has(id)) {
        APP_STATE.selectedMediaIds.delete(id);
        cardEl.classList.remove('selected');
      } else {
        APP_STATE.selectedMediaIds.add(id);
        cardEl.classList.add('selected');
      }
      this.updateMultiSelectUi();
    },

    selectAll() {
      APP_STATE.mediaList.forEach(m => APP_STATE.selectedMediaIds.add(m.id));
      document.querySelectorAll('.gallery-card').forEach(c => c.classList.add('selected'));
      this.updateMultiSelectUi();
    },

    updateMultiSelectUi() {
      const count = APP_STATE.selectedMediaIds.size;
      DOM.selectedCountText.textContent = `${count} selected`;
      DOM.btnDownloadSelected.disabled = (count === 0);
      DOM.btnDeleteSelected.disabled = (count === 0);
    },

    async downloadSelected() {
      const count = APP_STATE.selectedMediaIds.size;
      if (count === 0) return;

      showToast(`Downloading ${count} files...`, 'info');
      for (const id of APP_STATE.selectedMediaIds) {
        const item = APP_STATE.mediaList.find(m => m.id === id);
        if (item) {
          downloadMediaItem(item);
          await new Promise(r => setTimeout(r, 250));
        }
      }
    },

    promptDeleteSelected() {
      const count = APP_STATE.selectedMediaIds.size;
      if (count === 0) return;

      DOM.confirmModalTitle.textContent = `Delete ${count} selected items?`;
      DOM.confirmModalDesc.textContent = 'This action will permanently delete these files from the central cloud vault and local vault.';
      DOM.btnConfirmDelete.onclick = async () => {
        for (const id of APP_STATE.selectedMediaIds) {
          await RemoteStorageEngine.deleteMedia(id);
        }
        APP_STATE.selectedMediaIds.clear();
        DOM.confirmModal.classList.add('hidden');
        showToast('Selected media deleted', 'success');
        updateStorageUi();
      };
      DOM.confirmModal.classList.remove('hidden');
    }
  };

  function promptSingleDelete(id) {
    DOM.confirmModalTitle.textContent = 'Delete this item?';
    DOM.confirmModalDesc.textContent = 'This will permanently remove the file from the central cloud vault and local vault.';
    DOM.btnConfirmDelete.onclick = async () => {
      await RemoteStorageEngine.deleteMedia(id);
      DOM.confirmModal.classList.add('hidden');
      showToast('Media deleted', 'success');
      updateStorageUi();
    };
    DOM.confirmModal.classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // 14. Fullscreen Media Viewer (Both Photos & Videos)
  // --------------------------------------------------------------------------
  const FullscreenViewer = {
    activeList: [],

    async openAtIndex(index, list = APP_STATE.mediaList) {
      if (index < 0 || index >= list.length) return;
      this.activeList = list;
      APP_STATE.activeViewerIndex = index;

      const item = list[index];

      if (APP_STATE.activeViewerUrl && !APP_STATE.activeViewerUrl.startsWith('/')) {
        URL.revokeObjectURL(APP_STATE.activeViewerUrl);
      }

      if (item.blob) {
        APP_STATE.activeViewerUrl = URL.createObjectURL(item.blob);
      } else {
        APP_STATE.activeViewerUrl = item.url || '';
      }

      DOM.viewerIndexIndicator.textContent = `${index + 1} / ${list.length}`;
      DOM.viewerFilenameText.textContent = item.filename;
      DOM.viewerMetaRes.textContent = `${item.width || 1920} × ${item.height || 1080}`;
      DOM.viewerMetaSize.textContent = (((item.fileSize || 0)) / (1024 * 1024)).toFixed(2) + ' MB';

      if (item.type === 'video') {
        DOM.viewerOriginalImg.classList.add('hidden');
        DOM.viewerVideoPlayer.classList.remove('hidden');
        DOM.viewerPhotoZoomControls.classList.add('hidden');

        DOM.viewerVideoPlayer.src = APP_STATE.activeViewerUrl;
        DOM.viewerVideoPlayer.load();
        DOM.viewerVideoPlayer.play().catch(() => {});
      } else {
        DOM.viewerVideoPlayer.pause();
        DOM.viewerVideoPlayer.classList.add('hidden');
        DOM.viewerOriginalImg.classList.remove('hidden');
        DOM.viewerPhotoZoomControls.classList.remove('hidden');

        DOM.viewerOriginalImg.src = APP_STATE.activeViewerUrl;
        this.resetZoom();
      }

      DOM.fullscreenViewerModal.classList.remove('hidden');
    },

    close() {
      DOM.fullscreenViewerModal.classList.add('hidden');
      DOM.viewerVideoPlayer.pause();
      if (APP_STATE.activeViewerUrl && !APP_STATE.activeViewerUrl.startsWith('/')) {
        URL.revokeObjectURL(APP_STATE.activeViewerUrl);
        APP_STATE.activeViewerUrl = null;
      }
      APP_STATE.activeViewerIndex = -1;
      this.resetZoom();
    },

    next() {
      if (this.activeList.length <= 1) return;
      const nextIdx = (APP_STATE.activeViewerIndex + 1) % this.activeList.length;
      this.openAtIndex(nextIdx, this.activeList);
    },

    prev() {
      if (this.activeList.length <= 1) return;
      const prevIdx = (APP_STATE.activeViewerIndex - 1 + this.activeList.length) % this.activeList.length;
      this.openAtIndex(prevIdx, this.activeList);
    },

    resetZoom() {
      APP_STATE.viewerZoom = 1;
      APP_STATE.viewerPanX = 0;
      APP_STATE.viewerPanY = 0;
      this.applyTransform();
    },

    setZoom(scale) {
      APP_STATE.viewerZoom = Math.max(1, Math.min(scale, 4));
      if (APP_STATE.viewerZoom === 1) {
        APP_STATE.viewerPanX = 0;
        APP_STATE.viewerPanY = 0;
      }
      this.applyTransform();
    },

    applyTransform() {
      DOM.viewerPanContainer.style.transform = `translate3d(${APP_STATE.viewerPanX}px, ${APP_STATE.viewerPanY}px, 0) scale(${APP_STATE.viewerZoom})`;
      DOM.zoomLevelLabel.textContent = `${Math.round(APP_STATE.viewerZoom * 100)}%`;
    },

    downloadActive() {
      if (APP_STATE.activeViewerIndex < 0) return;
      const item = this.activeList[APP_STATE.activeViewerIndex];
      downloadMediaItem(item);
      showToast('Downloading original media...', 'success');
    },

    async shareActive() {
      if (APP_STATE.activeViewerIndex < 0) return;
      const item = this.activeList[APP_STATE.activeViewerIndex];
      if (item.blob) {
        await shareBlob(item.blob, item.filename);
      } else {
        showToast('Direct file sharing is supported for local captures. Use Download for central items.', 'info');
      }
    },

    deleteActive() {
      if (APP_STATE.activeViewerIndex < 0) return;
      const item = this.activeList[APP_STATE.activeViewerIndex];
      promptSingleDelete(item.id);
    }
  };

  // --------------------------------------------------------------------------
  // 15. Helper Utilities: Download & Web Share
  // --------------------------------------------------------------------------
  function downloadMediaItem(item) {
    if (!item) return;
    if (item.blob) {
      downloadBlob(item.blob, item.filename);
    } else if (item.url) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = item.url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 1000);
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  async function shareBlob(blob, filename) {
    if (!navigator.share) {
      showToast('Sharing is not supported in this browser. Use Download instead.', 'warn', 4000);
      return;
    }

    try {
      const file = new File([blob], filename, { type: blob.type });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        showToast('Sharing files is not supported on this device. Use Download instead.', 'warn', 4000);
        return;
      }

      await navigator.share({
        files: [file],
        title: 'HKC Camera Media',
        text: 'Media captured with HKC Camera Studio'
      });
      showToast('Shared successfully', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Sharing cancelled', 'info');
      }
    }
  }

  // --------------------------------------------------------------------------
  // 16. Settings & Theme Management
  // --------------------------------------------------------------------------
  const SettingsManager = {
    init() {
      const savedTheme = localStorage.getItem('hkc_theme') || 'dark';
      this.applyTheme(savedTheme);

      APP_STATE.mirrorFront = localStorage.getItem('hkc_mirror_front') !== 'false';
      DOM.settingMirrorFront.checked = APP_STATE.mirrorFront;

      APP_STATE.isGridOn = localStorage.getItem('hkc_grid_default') === 'true';
      DOM.settingGridDefault.checked = APP_STATE.isGridOn;
      DOM.cameraGrid.classList.toggle('hidden', !APP_STATE.isGridOn);
      DOM.btnGridToggle.classList.toggle('active', APP_STATE.isGridOn);

      APP_STATE.isSoundOn = localStorage.getItem('hkc_sound') !== 'false';
      DOM.settingSound.checked = APP_STATE.isSoundOn;

      const savedQuality = parseFloat(localStorage.getItem('hkc_photo_quality') || '0.95');
      APP_STATE.photoQuality = savedQuality;
      this.updateSegmentedActive(DOM.qualitySegmentedBtns, String(savedQuality));

      const savedTimer = parseInt(localStorage.getItem('hkc_timer') || '0', 10);
      APP_STATE.timerSeconds = savedTimer;
      this.updateTimerUi();

      OrientationManager.init();

      NamingManager.updateUiCounter();
    },

    applyTheme(theme) {
      let resolved = theme;
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }

      document.documentElement.setAttribute('data-theme', resolved);
      localStorage.setItem('hkc_theme', theme);

      if (resolved === 'light') {
        DOM.iconMoon.classList.add('hidden');
        DOM.iconSun.classList.remove('hidden');
      } else {
        DOM.iconMoon.classList.remove('hidden');
        DOM.iconSun.classList.add('hidden');
      }

      this.updateSegmentedActive(DOM.themeSegmentedBtns, theme);
    },

    updateSegmentedActive(btnNodeList, value) {
      btnNodeList.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === value);
      });
    },

    updateTimerUi() {
      if (DOM.moreTimerVal) {
        DOM.moreTimerVal.textContent = APP_STATE.timerSeconds > 0 ? `${APP_STATE.timerSeconds}s` : 'OFF';
      }
      if (DOM.timerBadge) {
        DOM.timerBadge.textContent = APP_STATE.timerSeconds > 0 ? `${APP_STATE.timerSeconds}s` : 'OFF';
        DOM.timerBadge.classList.toggle('hidden', APP_STATE.timerSeconds === 0);
      }
      if (DOM.btnTimerToggle) {
        DOM.btnTimerToggle.classList.toggle('active', APP_STATE.timerSeconds > 0);
      }
    }
  };

  async function updateStorageUi() {
    try {
      const stats = await DB.calculateTotalVaultSize();
      const mb = (stats.bytes / (1024 * 1024)).toFixed(2);
      DOM.storageUsageText.textContent = `${stats.count} files stored (${mb} MB used)`;
    } catch (_) {
      DOM.storageUsageText.textContent = 'Storage calculation unavailable';
    }
  }

  // --------------------------------------------------------------------------
  // 17. Authentication & Navigation
  // --------------------------------------------------------------------------
  const AuthManager = {
    init() {
      const remembered = localStorage.getItem('hkc_logged_in') === 'true';
      if (remembered) this.loginSuccess();
      else this.showLogin();
    },

    showLogin() {
      APP_STATE.isLoggedIn = false;
      DOM.loginScreen.classList.remove('hidden');
      DOM.appContainer.classList.add('hidden');
      CameraEngine.stopCamera();
    },

    loginSuccess() {
      APP_STATE.isLoggedIn = true;
      DOM.loginScreen.classList.add('hidden');
      DOM.appContainer.classList.remove('hidden');

      switchTab('camera');
      CameraEngine.startCamera();
      GalleryEngine.refreshGalleryCount();
      updateStorageUi();
    },

    logout() {
      localStorage.removeItem('hkc_logged_in');
      this.showLogin();
      showToast('Logged out of studio', 'info');
    }
  };

  function switchTab(targetTab) {
    APP_STATE.currentTab = targetTab;

    DOM.desktopNavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === targetTab));
    DOM.mobileNavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === targetTab));

    document.querySelectorAll('.app-tab').forEach(tab => tab.classList.remove('active'));

    if (targetTab === 'camera') {
      DOM.tabCamera.classList.add('active');
      if (!APP_STATE.stream) CameraEngine.startCamera();
    } else if (targetTab === 'gallery') {
      DOM.tabGallery.classList.add('active');
      CameraEngine.stopCamera();
      GalleryEngine.renderGallery();
    } else if (targetTab === 'settings') {
      DOM.tabSettings.classList.add('active');
      CameraEngine.stopCamera();
      updateStorageUi();
      NamingManager.updateUiCounter();
    }
  }

  function switchCameraMode(newMode) {
    APP_STATE.cameraMode = newMode;

    DOM.modeItems.forEach(item => {
      const isCurrent = (item.dataset.mode === newMode);
      item.classList.toggle('active', isCurrent);
      item.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    // Shutter styling
    DOM.btnShutter.className = `shutter-btn mode-${newMode}-shutter`;

    // Overlays
    DOM.proHud.classList.toggle('hidden', newMode !== 'pro');
    DOM.portraitVignette.classList.toggle('hidden', newMode !== 'portrait');

    if (newMode === 'pro') {
      DOM.proDrawer.classList.remove('hidden');
    }

    // If leaving video mode while recording, stop recording safely
    if (newMode !== 'video' && newMode !== 'slowmo' && newMode !== 'timelapse' && APP_STATE.isRecordingVideo) {
      VideoEngine.stopRecording();
    }
  }

  function applyPreset(presetName) {
    DOM.presetPills.forEach(p => p.classList.toggle('active', p.dataset.preset === presetName));

    if (presetName === 'reels') {
      // Reels Priority: 9:16 vertical, 1080p, 30 FPS, Video mode
      AspectRatioManager.setRatio('9:16');
      APP_STATE.targetResolution = 1080;
      APP_STATE.targetFps = 30;
      switchCameraMode('video');
      showToast('Preset: REELS (9:16 • 1080p • 30 FPS)', 'info');
    } else if (presetName === 'cinematic') {
      AspectRatioManager.setRatio('16:9');
      APP_STATE.targetFps = 24;
      applyFilter('cinema');
      switchCameraMode('video');
      showToast('Preset: CINEMATIC (16:9 • 24 FPS • Cinema Filter)', 'info');
    } else if (presetName === 'night') {
      APP_STATE.isNightMode = true;
      DOM.nightBadge.classList.remove('hidden');
      DOM.btnNightMode.classList.add('active');
      APP_STATE.targetFps = 30;
      switchCameraMode('video');
      showToast('Preset: NIGHT (30 FPS • Low-Light Ready)', 'info');
    } else if (presetName === 'portrait') {
      AspectRatioManager.setRatio('4:5');
      switchCameraMode('portrait');
      showToast('Preset: PORTRAIT (4:5 Depth Vignette)', 'info');
    } else if (presetName === 'pro') {
      switchCameraMode('pro');
      DOM.proDrawer.classList.remove('hidden');
    } else if (presetName === 'standard') {
      AspectRatioManager.setRatio('3:4');
      CameraEngine.setZoom(1.0);
      applyFilter('original');
      switchCameraMode('photo');
      showToast('Preset: STANDARD AUTO', 'info');
    }
  }

  function applyFilter(filterKey) {
    APP_STATE.activeFilter = filterKey;
    DOM.filterCards.forEach(c => c.classList.toggle('active', c.dataset.filter === filterKey));

    // Remove old filter classes from camera video
    DOM.cameraVideo.className = DOM.cameraVideo.className.replace(/\bfilter-\S+/g, '').trim();

    if (filterKey !== 'original') {
      DOM.cameraVideo.classList.add(`filter-${filterKey}`);
      DOM.activeFilterLabel.classList.remove('hidden');
      DOM.activeFilterLabel.querySelector('span').textContent = filterKey.toUpperCase().replace('-', ' ');
    } else {
      DOM.activeFilterLabel.classList.add('hidden');
    }
  }

  // --------------------------------------------------------------------------
  // 18. Event Listeners Wire-Up
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Login Submission
    DOM.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = DOM.loginUsername.value.trim();
      const p = DOM.loginPassword.value.trim();

      if (u === AUTH_CREDENTIALS.username && p === AUTH_CREDENTIALS.password) {
        DOM.loginError.classList.add('hidden');
        if (DOM.rememberLogin.checked) localStorage.setItem('hkc_logged_in', 'true');
        AuthManager.loginSuccess();
      } else {
        DOM.loginError.classList.remove('hidden');
        DOM.loginErrorText.textContent = 'Invalid username or password';
        DOM.loginPassword.value = '';
        DOM.loginPassword.focus();
      }
    });

    // Toggle Password Visibility
    DOM.togglePasswordBtn.addEventListener('click', () => {
      const isPassword = (DOM.loginPassword.type === 'password');
      DOM.loginPassword.type = isPassword ? 'text' : 'password';
      DOM.eyeIcon.classList.toggle('hidden', isPassword);
      DOM.eyeOffIcon.classList.toggle('hidden', !isPassword);
    });

    // Theme toggles
    document.querySelectorAll('.theme-quick-switch .theme-btn').forEach(btn => {
      btn.addEventListener('click', () => SettingsManager.applyTheme(btn.dataset.themeVal));
    });

    DOM.desktopThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      SettingsManager.applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Logout
    DOM.desktopLogoutBtn.addEventListener('click', () => AuthManager.logout());
    DOM.btnLogout.addEventListener('click', () => AuthManager.logout());

    // Tabs
    DOM.desktopNavBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    DOM.mobileNavBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // Camera Top Controls
    DOM.btnFlash.addEventListener('click', () => CameraEngine.toggleFlash());

    DOM.btnNightMode.addEventListener('click', () => {
      APP_STATE.isNightMode = !APP_STATE.isNightMode;
      DOM.nightBadge.classList.toggle('hidden', !APP_STATE.isNightMode);
      DOM.btnNightMode.classList.toggle('active', APP_STATE.isNightMode);
      showToast(APP_STATE.isNightMode ? 'Night Reels Mode ON' : 'Night Mode OFF', 'info', 1500);
    });

    function closeAllBottomSheets() {
      if (DOM.aspectRatioSheet) DOM.aspectRatioSheet.classList.add('hidden');
      if (DOM.videoSettingsSheet) DOM.videoSettingsSheet.classList.add('hidden');
      if (DOM.filtersSheet) DOM.filtersSheet.classList.add('hidden');
      if (DOM.proDrawer) DOM.proDrawer.classList.add('hidden');
      if (DOM.cameraMoreSheet) DOM.cameraMoreSheet.classList.add('hidden');
    }

    // Quick Settings Trigger
    if (DOM.btnSettingsQuick) {
      DOM.btnSettingsQuick.addEventListener('click', () => switchTab('settings'));
    }

    // Status Pill -> Quick Resolution / Spec Sheet
    if (DOM.cameraStatusPill) {
      DOM.cameraStatusPill.addEventListener('click', () => {
        const isHidden = DOM.videoSettingsSheet.classList.contains('hidden');
        closeAllBottomSheets();
        if (isHidden) DOM.videoSettingsSheet.classList.remove('hidden');
      });
    }

    // More Sheet (•••) Trigger
    if (DOM.btnMoreToggle) {
      DOM.btnMoreToggle.addEventListener('click', () => {
        const isHidden = DOM.cameraMoreSheet.classList.contains('hidden');
        closeAllBottomSheets();
        if (isHidden) DOM.cameraMoreSheet.classList.remove('hidden');
      });
    }

    // More Sheet Tiles Wire-Up
    if (DOM.moreTileAspect) {
      DOM.moreTileAspect.addEventListener('click', () => {
        closeAllBottomSheets();
        DOM.aspectRatioSheet.classList.remove('hidden');
      });
    }

    if (DOM.moreTileRes) {
      DOM.moreTileRes.addEventListener('click', () => {
        closeAllBottomSheets();
        DOM.videoSettingsSheet.classList.remove('hidden');
      });
    }

    if (DOM.moreTileFilters) {
      DOM.moreTileFilters.addEventListener('click', () => {
        closeAllBottomSheets();
        DOM.filtersSheet.classList.remove('hidden');
      });
    }

    if (DOM.moreTilePro) {
      DOM.moreTilePro.addEventListener('click', () => {
        closeAllBottomSheets();
        DOM.proDrawer.classList.remove('hidden');
      });
    }

    if (DOM.moreTileTimer) {
      DOM.moreTileTimer.addEventListener('click', () => {
        const cycle = [0, 3, 5, 10];
        const nextIdx = (cycle.indexOf(APP_STATE.timerSeconds) + 1) % cycle.length;
        APP_STATE.timerSeconds = cycle[nextIdx];
        SettingsManager.updateTimerUi();
        showToast(APP_STATE.timerSeconds > 0 ? `Timer: ${APP_STATE.timerSeconds}s` : 'Timer: Off', 'info', 1200);
      });
    }

    if (DOM.moreTileCloud) {
      DOM.moreTileCloud.addEventListener('click', async () => {
        closeAllBottomSheets();
        showToast('Syncing with Central Cloud Vault...', 'info', 1500);
        await RemoteStorageEngine.fetchCentralMedia();
        await RemoteStorageEngine.syncPendingQueue();
        showToast('Cloud vault synchronized!', 'success', 1500);
      });
    }

    if (DOM.moreTileOrientation) {
      DOM.moreTileOrientation.addEventListener('click', () => {
        OrientationManager.cycleOrientation();
      });
    }

    // Aspect Ratio Buttons
    DOM.aspectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        AspectRatioManager.setRatio(btn.dataset.ratio);
        DOM.aspectRatioSheet.classList.add('hidden');
      });
    });

    // Quality / Resolution Cards
    DOM.qualityCards.forEach(card => {
      card.addEventListener('click', () => {
        const res = parseInt(card.dataset.res, 10);
        APP_STATE.targetResolution = res;
        DOM.qualityCards.forEach(c => c.classList.toggle('active', c === card));
        if (DOM.moreResVal) DOM.moreResVal.textContent = `${res}P`;
        CameraEngine.startCamera();
        DOM.videoSettingsSheet.classList.add('hidden');
        showToast(`Target resolution set to ${res}p`, 'info');
      });
    });

    // Frame Rate Cards
    DOM.fpsCards.forEach(card => {
      card.addEventListener('click', () => {
        const fps = parseInt(card.dataset.fps, 10);
        APP_STATE.targetFps = fps;
        DOM.fpsCards.forEach(c => c.classList.toggle('active', c === card));
        DOM.cameraFpsBadge.textContent = `${fps} FPS`;
        CameraEngine.startCamera();
        DOM.videoSettingsSheet.classList.add('hidden');
        showToast(`Target frame rate: ${fps} FPS`, 'info');
      });
    });

    // Cinematic Filter Cards
    DOM.filterCards.forEach(card => {
      card.addEventListener('click', () => {
        applyFilter(card.dataset.filter);
        DOM.filtersSheet.classList.add('hidden');
      });
    });

    // EV Slider
    DOM.proEvSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      DOM.proEvLabel.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)} EV`;
      CameraEngine.applyExposure(val);
    });

    // Pro ISO Chips
    DOM.proIsoChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.proIsoChips.forEach(c => c.classList.toggle('active', c === chip));
        DOM.proIsoStatus.textContent = chip.dataset.val.toUpperCase();
        DOM.hudIso.textContent = chip.dataset.val === 'auto' ? 'AUTO' : `ISO ${chip.dataset.val}`;
      });
    });

    // Pro WB Chips
    DOM.proWbChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.proWbChips.forEach(c => c.classList.toggle('active', c === chip));
        DOM.proWbStatus.textContent = chip.dataset.val.toUpperCase();
        DOM.hudWb.textContent = chip.dataset.val.toUpperCase();
      });
    });

    // Pro AF / AE Segmented
    DOM.proAfSegmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.proAfSegmentBtns.forEach(b => b.classList.toggle('active', b === btn));
        DOM.hudFocus.textContent = btn.dataset.val.toUpperCase();
      });
    });

    DOM.proAeSegmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.proAeSegmentBtns.forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Pro TV / Shutter Chips
    DOM.proTvChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.proTvChips.forEach(c => c.classList.toggle('active', c === chip));
        DOM.proTvStatus.textContent = chip.dataset.val;
        DOM.hudShutter.textContent = chip.dataset.val;
      });
    });

    // Close buttons on bottom sheets
    document.querySelectorAll('.sheet-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.close;
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) el.classList.add('hidden');
        }
      });
    });

    // Grid Toggle
    DOM.btnGridToggle.addEventListener('click', () => {
      APP_STATE.isGridOn = !APP_STATE.isGridOn;
      DOM.cameraGrid.classList.toggle('hidden', !APP_STATE.isGridOn);
      DOM.btnGridToggle.classList.toggle('active', APP_STATE.isGridOn);
      showToast(APP_STATE.isGridOn ? 'Grid 3×3 Enabled' : 'Grid Disabled', 'info', 1200);
    });

    // Presets Ribbon
    DOM.presetPills.forEach(pill => {
      pill.addEventListener('click', () => applyPreset(pill.dataset.preset));
    });

    // Mode Selector Ribbon
    DOM.modeItems.forEach(item => {
      item.addEventListener('click', () => switchCameraMode(item.dataset.mode));
    });

    // Shutter / Record Button
    DOM.btnShutter.addEventListener('click', () => CaptureEngine.handleShutterPress());

    // Switch Camera
    DOM.btnFlipCamera.addEventListener('click', () => CameraEngine.switchCamera());

    // Camera Error / Fallback Card Actions
    if (DOM.btnCameraRetry) {
      DOM.btnCameraRetry.addEventListener('click', () => CameraEngine.startCamera());
    }
    if (DOM.btnCameraSimulator) {
      DOM.btnCameraSimulator.addEventListener('click', () => CameraEngine.startSimulatorStream());
    }

    // Dismiss bottom sheets when tapping camera stage
    DOM.cameraStage.addEventListener('click', (e) => {
      if (e.target.closest('.zoom-control-bar') || e.target.closest('.low-light-alert-card') || e.target.closest('.camera-fallback-card')) {
        return;
      }
      closeAllBottomSheets();
    });

    // Last Photo Thumbnail Button
    DOM.btnLastPhoto.addEventListener('click', async () => {
      const items = await DB.getAllMedia();
      if (items.length > 0) {
        FullscreenViewer.openAtIndex(0, items);
      } else {
        switchTab('gallery');
      }
    });

    // Floating Zoom Chips
    DOM.zoomChips.forEach(chip => {
      chip.addEventListener('click', () => {
        CameraEngine.setZoom(chip.dataset.zoom);
      });
    });

    // Low Light Assist Actions
    DOM.btnApplyNightAssist.addEventListener('click', () => {
      DOM.lowLightAlert.classList.add('hidden');
      APP_STATE.lowLightDismissed = true;
      CameraEngine.toggleFlash();
      CameraEngine.applyExposure(0.7);
      showToast('Low-Light optimizations applied', 'success');
    });

    DOM.btnDismissNightAssist.addEventListener('click', () => {
      DOM.lowLightAlert.classList.add('hidden');
      APP_STATE.lowLightDismissed = true;
    });

    // Photo Preview Modal Actions
    DOM.btnPreviewClose.addEventListener('click', () => PhotoPreviewModal.close());
    DOM.btnPreviewRetake.addEventListener('click', () => PhotoPreviewModal.close());
    DOM.btnPreviewDownload.addEventListener('click', () => PhotoPreviewModal.download());
    DOM.btnPreviewShare.addEventListener('click', () => PhotoPreviewModal.share());

    // Video Preview Modal Actions
    DOM.btnVideoPreviewClose.addEventListener('click', () => VideoPreviewModal.close());
    DOM.btnVideoRetake.addEventListener('click', () => VideoPreviewModal.close());
    DOM.btnVideoDownload.addEventListener('click', () => VideoPreviewModal.download());
    DOM.btnVideoShare.addEventListener('click', () => VideoPreviewModal.share());

    // Gallery Filter Tabs
    DOM.galleryFilterTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.galleryFilterTabBtns.forEach(b => b.classList.toggle('active', b === btn));
        APP_STATE.activeGalleryFilter = btn.dataset.filterType;
        GalleryEngine.renderGallery();
      });
    });

    // Gallery Selection Mode
    DOM.btnSelectMode.addEventListener('click', () => GalleryEngine.toggleSelectMode());
    DOM.btnSelectAll.addEventListener('click', () => GalleryEngine.selectAll());
    DOM.btnDownloadSelected.addEventListener('click', () => GalleryEngine.downloadSelected());
    DOM.btnDeleteSelected.addEventListener('click', () => GalleryEngine.promptDeleteSelected());
    DOM.btnCancelSelection.addEventListener('click', () => GalleryEngine.toggleSelectMode());
    DOM.btnEmptyGotoCamera.addEventListener('click', () => switchTab('camera'));

    // Fullscreen Viewer Controls
    DOM.btnViewerClose.addEventListener('click', () => FullscreenViewer.close());
    DOM.btnViewerPrev.addEventListener('click', () => FullscreenViewer.prev());
    DOM.btnViewerNext.addEventListener('click', () => FullscreenViewer.next());
    DOM.btnZoomIn.addEventListener('click', () => FullscreenViewer.setZoom(APP_STATE.viewerZoom + 0.5));
    DOM.btnZoomOut.addEventListener('click', () => FullscreenViewer.setZoom(APP_STATE.viewerZoom - 0.5));
    DOM.btnZoomReset.addEventListener('click', () => FullscreenViewer.resetZoom());
    DOM.btnViewerDownload.addEventListener('click', () => FullscreenViewer.downloadActive());
    DOM.btnViewerShare.addEventListener('click', () => FullscreenViewer.shareActive());
    DOM.btnViewerDelete.addEventListener('click', () => FullscreenViewer.deleteActive());

    DOM.btnViewerFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    });

    // Confirm Modal Cancel
    DOM.btnConfirmCancel.addEventListener('click', () => DOM.confirmModal.classList.add('hidden'));

    // Settings
    DOM.themeSegmentedBtns.forEach(btn => btn.addEventListener('click', () => SettingsManager.applyTheme(btn.dataset.val)));
    DOM.orientationSegmentedBtns.forEach(btn => btn.addEventListener('click', () => OrientationManager.setOrientation(btn.dataset.val)));
    DOM.settingMirrorFront.addEventListener('change', (e) => {
      APP_STATE.mirrorFront = e.target.checked;
      localStorage.setItem('hkc_mirror_front', String(APP_STATE.mirrorFront));
      CameraEngine.applyMirrorStyle();
    });
    DOM.settingGridDefault.addEventListener('change', (e) => {
      APP_STATE.isGridOn = e.target.checked;
      localStorage.setItem('hkc_grid_default', String(APP_STATE.isGridOn));
      DOM.cameraGrid.classList.toggle('hidden', !APP_STATE.isGridOn);
      DOM.btnGridToggle.classList.toggle('active', APP_STATE.isGridOn);
    });
    DOM.settingSound.addEventListener('change', (e) => {
      APP_STATE.isSoundOn = e.target.checked;
      localStorage.setItem('hkc_sound', String(APP_STATE.isSoundOn));
    });

    DOM.btnClearVault.addEventListener('click', () => {
      DOM.confirmModalTitle.textContent = 'Clear All Media in Vault?';
      DOM.confirmModalDesc.textContent = 'This action will permanently delete all photos and videos stored in this browser vault.';
      DOM.btnConfirmDelete.onclick = async () => {
        await DB.clearAll();
        DOM.confirmModal.classList.add('hidden');
        showToast('Vault cleared completely', 'info');
        GalleryEngine.renderGallery();
        updateStorageUi();
      };
      DOM.confirmModal.classList.remove('hidden');
    });

    // Setup Touch & Keyboard Gestures for Viewer
    setupViewerGestures();

    // Gallery Sync / Refresh Button
    if (DOM.btnSyncRefresh) {
      DOM.btnSyncRefresh.addEventListener('click', async () => {
        DOM.btnSyncRefresh.classList.add('spinning');
        showToast('Refreshing Central Vault...', 'info', 1200);
        await RemoteStorageEngine.fetchCentralMedia();
        await RemoteStorageEngine.syncPendingQueue();
        DOM.btnSyncRefresh.classList.remove('spinning');
        showToast('Vault refreshed!', 'success', 1200);
      });
    }

    // Auto-sync on network reconnect & window focus
    window.addEventListener('online', () => {
      showToast('Online: Synchronizing Central Cloud Vault...', 'info', 2000);
      RemoteStorageEngine.syncPendingQueue();
    });

    window.addEventListener('focus', () => {
      if (APP_STATE.isLoggedIn) {
        RemoteStorageEngine.fetchCentralMedia();
      }
    });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (APP_STATE.currentTab === 'camera') CameraEngine.stopCamera();
      } else {
        if (APP_STATE.isLoggedIn && APP_STATE.currentTab === 'camera') CameraEngine.startCamera();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 19. Gesture & Keyboard Handlers
  // --------------------------------------------------------------------------
  function setupViewerGestures() {
    const stage = DOM.viewerStage;

    // Double-tap zoom on photo
    stage.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch' && !DOM.viewerOriginalImg.classList.contains('hidden')) {
        const now = Date.now();
        if (now - APP_STATE.lastTapTime < 300) {
          if (APP_STATE.viewerZoom > 1.2) FullscreenViewer.resetZoom();
          else FullscreenViewer.setZoom(2.5);
        }
        APP_STATE.lastTapTime = now;
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2 && !DOM.viewerOriginalImg.classList.contains('hidden')) {
        APP_STATE.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        APP_STATE.initialPinchScale = APP_STATE.viewerZoom;
      } else if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        APP_STATE.dragStartX = touchStartX - APP_STATE.viewerPanX;
        APP_STATE.dragStartY = touchStartY - APP_STATE.viewerPanY;
        APP_STATE.isDragging = true;
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && !DOM.viewerOriginalImg.classList.contains('hidden')) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (APP_STATE.initialPinchDistance > 0) {
          const factor = currentDist / APP_STATE.initialPinchDistance;
          FullscreenViewer.setZoom(APP_STATE.initialPinchScale * factor);
        }
      } else if (e.touches.length === 1 && APP_STATE.isDragging && !DOM.viewerOriginalImg.classList.contains('hidden')) {
        if (APP_STATE.viewerZoom > 1) {
          APP_STATE.viewerPanX = e.touches[0].clientX - APP_STATE.dragStartX;
          APP_STATE.viewerPanY = e.touches[0].clientY - APP_STATE.dragStartY;
          FullscreenViewer.applyTransform();
        }
      }
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        APP_STATE.isDragging = false;
        if (APP_STATE.viewerZoom === 1 && e.changedTouches.length > 0) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;
          if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
            if (diffX < 0) FullscreenViewer.next();
            else FullscreenViewer.prev();
          }
        }
      }
    }, { passive: true });

    // Desktop Mouse Wheel
    stage.addEventListener('wheel', (e) => {
      if (!DOM.viewerOriginalImg.classList.contains('hidden')) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        FullscreenViewer.setZoom(APP_STATE.viewerZoom + delta);
      }
    }, { passive: false });

    // Keyboard Shortcuts (Space for video play/pause, Esc to close, Arrows)
    window.addEventListener('keydown', (e) => {
      if (DOM.fullscreenViewerModal.classList.contains('hidden')) return;

      if (e.key === ' ' || e.code === 'Space') {
        if (!DOM.viewerVideoPlayer.classList.contains('hidden')) {
          e.preventDefault();
          if (DOM.viewerVideoPlayer.paused) DOM.viewerVideoPlayer.play();
          else DOM.viewerVideoPlayer.pause();
        }
      } else if (e.key === 'ArrowLeft') {
        FullscreenViewer.prev();
      } else if (e.key === 'ArrowRight') {
        FullscreenViewer.next();
      } else if (e.key === 'Escape') {
        FullscreenViewer.close();
      } else if (e.key === '+' || e.key === '=') {
        FullscreenViewer.setZoom(APP_STATE.viewerZoom + 0.25);
      } else if (e.key === '-' || e.key === '_') {
        FullscreenViewer.setZoom(APP_STATE.viewerZoom - 0.25);
      } else if (e.key === '0') {
        FullscreenViewer.resetZoom();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 20. Application Bootstrapper
  // --------------------------------------------------------------------------
  async function initApp() {
    try {
      await DB.init();
    } catch (_) {}

    SettingsManager.init();
    setupEventListeners();
    AuthManager.init();

    // Set default Reels preset on boot
    applyPreset('reels');

    // Fetch and sync central cloud vault
    RemoteStorageEngine.fetchCentralMedia();
    RemoteStorageEngine.syncPendingQueue();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
