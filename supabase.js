/**
 * ============================================================================
 * HKC CAMERA - Supabase Cloud Synchronization Client Module
 * Real-time Cross-Device Media Synchronization via PostgreSQL + Storage
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Storage keys for persisting Supabase connection
  const STORAGE_KEY_URL = 'hkc_supabase_url';
  const STORAGE_KEY_KEY = 'hkc_supabase_anon_key';
  const STORAGE_BUCKET = 'hkc-media';

  // Default / Preconfigured Fallback (can be populated or overridden by user in Settings)
  const DEFAULT_CONFIG = {
    url: (window.HKC_CONFIG && window.HKC_CONFIG.SUPABASE_URL) || '',
    key: (window.HKC_CONFIG && window.HKC_CONFIG.SUPABASE_ANON_KEY) || ''
  };

  class HKCSupabaseClient {
    constructor() {
      this.client = null;
      this.currentUser = null;
      this.activeSubscription = null;
      this.isInitialized = false;
      this._subscribers = new Set();
    }

    /**
     * Get stored credentials or defaults
     */
    getConfig() {
      const url = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.url || '';
      const key = localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_CONFIG.key || '';
      return { url: url.trim(), key: key.trim() };
    }

    /**
     * Check if valid configuration exists
     */
    isConfigured() {
      const { url, key } = this.getConfig();
      return Boolean(url && key && url.startsWith('http'));
    }

    /**
     * Save configuration and initialize client
     */
    async saveConfig(url, key) {
      if (!url || !key) {
        throw new Error('Supabase URL and Anon Key are required.');
      }
      url = url.trim();
      key = key.trim();
      if (!url.startsWith('https://') && !url.startsWith('http://')) {
        throw new Error('Supabase URL must start with https://');
      }

      localStorage.setItem(STORAGE_KEY_URL, url);
      localStorage.setItem(STORAGE_KEY_KEY, key);

      return await this.init(true);
    }

    /**
     * Clear configuration and disconnect
     */
    disconnect() {
      if (this.activeSubscription) {
        this.activeSubscription.unsubscribe();
        this.activeSubscription = null;
      }
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
      this.client = null;
      this.currentUser = null;
      this.isInitialized = false;
      this._notifyChange({ status: 'disconnected', user: null });
    }

    /**
     * Initialize client with stored or default credentials
     */
    async init(force = false) {
      if (this.isInitialized && !force && this.client) {
        return this.client;
      }

      const { url, key } = this.getConfig();
      if (!url || !key) {
        this.isInitialized = true;
        this.client = null;
        return null;
      }

      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('Supabase JS library not loaded yet.');
        return null;
      }

      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'hkc_supabase_auth_token'
          }
        });

        // Check active session
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        }

        if (session && session.user) {
          this.currentUser = session.user;
        } else {
          // Attempt anonymous or guest session fallback if configured, or keep as guest
          this.currentUser = null;
        }

        // Listen for auth state changes
        this.client.auth.onAuthStateChange((event, newSession) => {
          this.currentUser = newSession?.user || null;
          this._notifyChange({ status: 'auth_change', event, user: this.currentUser });
        });

        this.isInitialized = true;
        this._notifyChange({ status: 'connected', user: this.currentUser });
        return this.client;
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        this.client = null;
        this.isInitialized = true;
        throw err;
      }
    }

    /**
     * Current user helper
     */
    getUser() {
      return this.currentUser;
    }

    /**
     * User ID helper (returns auth user id or device fallback id)
     */
    getUserId() {
      if (this.currentUser && this.currentUser.id) {
        return this.currentUser.id;
      }
      let deviceId = localStorage.getItem('hkc_device_user_id');
      if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
        localStorage.setItem('hkc_device_user_id', deviceId);
      }
      return deviceId;
    }

    /**
     * Sign Up with Email & Password
     */
    async signUp(email, password) {
      const client = await this.init();
      if (!client) throw new Error('Supabase client not configured.');
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      return data;
    }

    /**
     * Sign In with Email & Password
     */
    async signIn(email, password) {
      const client = await this.init();
      if (!client) throw new Error('Supabase client not configured.');
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      return data;
    }

    /**
     * Sign Out
     */
    async signOut() {
      if (!this.client) return;
      await this.client.auth.signOut();
      this.currentUser = null;
    }

    /**
     * Upload Blob to Supabase Storage bucket `hkc-media`
     * Supports progress callback
     */
    async uploadStorageFile(blob, path, mimeType, onProgress) {
      const client = await this.init();
      if (!client) throw new Error('Supabase client not configured.');

      const bucket = client.storage.from(STORAGE_BUCKET);

      // Convert blob to ArrayBuffer or File
      const fileOptions = {
        contentType: mimeType || 'application/octet-stream',
        upsert: true
      };

      if (onProgress) {
        onProgress(15);
      }

      const { data, error } = await bucket.upload(path, blob, fileOptions);

      if (onProgress) {
        onProgress(85);
      }

      if (error) {
        // If bucket doesn't exist, provide a descriptive hint
        if (error.message && error.message.toLowerCase().includes('bucket not found')) {
          throw new Error('Supabase bucket "hkc-media" not found. Please run supabase_schema.sql in your Supabase SQL editor.');
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = bucket.getPublicUrl(path);

      if (onProgress) {
        onProgress(100);
      }

      return {
        path: data.path,
        publicUrl: publicUrl
      };
    }

    /**
     * Insert media metadata record into PostgreSQL `public.media` table
     */
    async insertMediaRecord(record) {
      const client = await this.init();
      if (!client) throw new Error('Supabase client not configured.');

      const userId = (this.currentUser && this.currentUser.id) ? this.currentUser.id : this.getUserId();

      const row = {
        id: record.id || ('media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)),
        user_id: userId,
        storage_path: record.storagePath,
        thumbnail_path: record.thumbnailPath || null,
        media_type: record.type || 'photo',
        file_name: record.filename,
        mime_type: record.mimeType || (record.type === 'video' ? 'video/webm' : 'image/jpeg'),
        file_size: record.fileSize || 0,
        width: record.width || 1920,
        height: record.height || 1080,
        duration: record.duration || null,
        aspect_ratio: record.aspectRatio || '9:16',
        created_at: new Date(record.timestamp || Date.now()).toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('media')
        .upsert(row)
        .select()
        .single();

      if (error) {
        if (error.message && error.message.toLowerCase().includes('relation "public.media" does not exist')) {
          throw new Error('Database table "media" does not exist. Please execute supabase_schema.sql in your Supabase SQL Editor.');
        }
        throw error;
      }

      return data;
    }

    /**
     * Fetch media records from Supabase PostgreSQL
     */
    async fetchMediaRecords(limit = 100) {
      const client = await this.init();
      if (!client) return [];

      let query = client
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // If user is authenticated, RLS will handle filtering automatically;
      // if anonymous device ID is used without RLS block, filter by user_id
      if (this.currentUser && this.currentUser.id) {
        query = query.eq('user_id', this.currentUser.id);
      } else {
        const deviceUserId = this.getUserId();
        query = query.eq('user_id', deviceUserId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase fetchMedia error:', error.message);
        return [];
      }

      // Format records with full public URLs
      const bucket = client.storage.from(STORAGE_BUCKET);
      return (data || []).map(item => {
        const mediaUrl = bucket.getPublicUrl(item.storage_path).data.publicUrl;
        const thumbUrl = item.thumbnail_path
          ? bucket.getPublicUrl(item.thumbnail_path).data.publicUrl
          : mediaUrl;

        return {
          id: item.id,
          filename: item.file_name,
          type: item.media_type,
          url: mediaUrl,
          thumbnailUrl: thumbUrl,
          storagePath: item.storage_path,
          thumbnailPath: item.thumbnail_path,
          mimeType: item.mime_type,
          fileSize: item.file_size,
          width: item.width,
          height: item.height,
          duration: item.duration,
          aspect_ratio: item.aspect_ratio,
          timestamp: new Date(item.created_at).getTime(),
          cloudSynced: true,
          syncStatus: 'synced'
        };
      });
    }

    /**
     * Delete media record and associated storage files
     */
    async deleteMediaRecord(record) {
      const client = await this.init();
      if (!client) throw new Error('Supabase client not configured.');

      // 1. Delete storage files
      const bucket = client.storage.from(STORAGE_BUCKET);
      const filesToDelete = [];
      if (record.storagePath) filesToDelete.push(record.storagePath);
      if (record.thumbnailPath) filesToDelete.push(record.thumbnailPath);

      if (filesToDelete.length > 0) {
        try {
          await bucket.remove(filesToDelete);
        } catch (e) {
          console.warn('Storage file deletion error:', e);
        }
      }

      // 2. Delete database record
      const { error } = await client
        .from('media')
        .delete()
        .eq('id', record.id);

      if (error) throw error;
      return true;
    }

    /**
     * Real-time subscription to `public.media` table changes
     * Enables instant cross-device updates without manual polling
     */
    subscribeToChanges(onChangeCallback) {
      if (!this.client) return null;

      if (this.activeSubscription) {
        this.activeSubscription.unsubscribe();
        this.activeSubscription = null;
      }

      try {
        const channel = this.client
          .channel('hkc_media_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'media' },
            (payload) => {
              if (typeof onChangeCallback === 'function') {
                onChangeCallback(payload);
              }
            }
          )
          .subscribe();

        this.activeSubscription = channel;
        return channel;
      } catch (err) {
        console.warn('Supabase realtime subscription failed:', err);
        return null;
      }
    }

    /**
     * Event listener for config or auth changes
     */
    onStateChange(cb) {
      this._subscribers.add(cb);
      return () => this._subscribers.delete(cb);
    }

    _notifyChange(payload) {
      this._subscribers.forEach(cb => {
        try { cb(payload); } catch (_) {}
      });
    }
  }

  // Expose singleton instance to window
  window.HKCSupabase = new HKCSupabaseClient();

})(window);
