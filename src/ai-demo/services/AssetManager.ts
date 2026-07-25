// src/ai-demo/services/AssetManager.ts
/**
 * AssetManager - Centralized Preloader & Memory Cache
 * Handles async caching of snapshots, audio blobs, branding logos, icons,
 * and font assets to ensure zero-stutter playback and rendering.
 */

export class AssetManager {
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static audioCache: Map<string, HTMLAudioElement> = new Map();
  private static pendingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Preloads an image URL or dataUrl into memory
   */
  public static async loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    if (this.pendingPromises.has(url)) {
      return this.pendingPromises.get(url)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        this.pendingPromises.delete(url);
        resolve(img);
      };
      img.onerror = (err) => {
        this.pendingPromises.delete(url);
        reject(err);
      };
      img.src = url;
    });

    this.pendingPromises.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieves a cached image if available
   */
  public static getCachedImage(url: string): HTMLImageElement | undefined {
    return this.imageCache.get(url);
  }

  /**
   * Preloads an audio track URL
   */
  public static async loadAudio(url: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }

    const audio = new Audio(url);
    this.audioCache.set(url, audio);
    return audio;
  }

  /**
   * Batch preloads a list of image URLs
   */
  public static async preloadBatchImages(urls: string[]): Promise<void> {
    const validUrls = urls.filter(Boolean);
    await Promise.allSettled(validUrls.map((u) => this.loadImage(u)));
  }

  /**
   * Clears all in-memory image and audio caches
   */
  public static clearCache(): void {
    this.imageCache.clear();
    this.audioCache.clear();
    this.pendingPromises.clear();
  }
}
