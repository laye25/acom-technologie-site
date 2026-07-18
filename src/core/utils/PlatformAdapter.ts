export interface OSInfo {
  platform: string;
  release: string;
  arch: string;
  cpus: number;
  totalMemGb: number;
}

export interface PlatformAdapter {
  isBrowser(): boolean;
  isNode(): boolean;
  join(...parts: string[]): string;
  mkdirSync(dirPath: string, options?: { recursive?: boolean }): void;
  writeFileSync(filePath: string, content: string | Uint8Array, encoding?: string): void;
  readFileSync(filePath: string, encoding?: string): string;
  existsSync(filePath: string): boolean;
  getOSInfo(): OSInfo;
  getNodeVersion(): string;
}

// Detective mechanism to determine the current platform at runtime
const isNodeEnv = typeof process !== 'undefined' && process.release && process.release.name === 'node';

// We use eval('require') to hide the require call from Vite/Webpack so it doesn't try to bundle Node.js modules for the browser.
const getFs = () => isNodeEnv ? eval('require')('fs') : null;
const getPath = () => isNodeEnv ? eval('require')('path') : null;
const getOs = () => isNodeEnv ? eval('require')('os') : null;

class NodePlatformAdapter implements PlatformAdapter {
  isBrowser(): boolean {
    return false;
  }

  isNode(): boolean {
    return true;
  }

  join(...parts: string[]): string {
    const path = getPath();
    if (path) return path.join(...parts);
    return parts.join('/').replace(/\/+/g, '/');
  }

  mkdirSync(dirPath: string, options?: { recursive?: boolean }): void {
    const fs = getFs();
    if (fs && fs.mkdirSync) {
      fs.mkdirSync(dirPath, options);
    }
  }

  writeFileSync(filePath: string, content: string | Uint8Array, encoding: string = 'utf8'): void {
    const fs = getFs();
    if (fs && fs.writeFileSync) {
      fs.writeFileSync(filePath, content, encoding as any);
    }
  }

  readFileSync(filePath: string, encoding: string = 'utf8'): string {
    const fs = getFs();
    if (fs && fs.readFileSync) {
      const res = fs.readFileSync(filePath, encoding as any);
      return typeof res === 'string' ? res : res.toString();
    }
    return '';
  }

  existsSync(filePath: string): boolean {
    const fs = getFs();
    if (fs && fs.existsSync) {
      return fs.existsSync(filePath);
    }
    return false;
  }

  getOSInfo(): OSInfo {
    try {
      const os = getOs();
      if (os) {
        return {
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemGb: os.totalmem() / 1024 / 1024 / 1024
        };
      }
      throw new Error("No OS module");
    } catch {
      return {
        platform: 'node-unknown',
        release: 'unknown',
        arch: 'unknown',
        cpus: 1,
        totalMemGb: 8
      };
    }
  }

  getNodeVersion(): string {
    return typeof process !== 'undefined' ? process.version : 'unknown';
  }
}

class BrowserPlatformAdapter implements PlatformAdapter {
  private virtualFS = new Map<string, string | Uint8Array>();

  isBrowser(): boolean {
    return true;
  }

  isNode(): boolean {
    return false;
  }

  join(...parts: string[]): string {
    return parts.join('/').replace(/\/+/g, '/');
  }

  mkdirSync(dirPath: string, options?: { recursive?: boolean }): void {
    // No-op in browser
    console.debug(`[Browser FS] mkdirSync: ${dirPath}`);
  }

  writeFileSync(filePath: string, content: string | Uint8Array, encoding?: string): void {
    this.virtualFS.set(filePath, content);
    console.debug(`[Browser FS] writeFileSync: ${filePath} (size: ${content.length})`);
  }

  readFileSync(filePath: string, encoding?: string): string {
    const val = this.virtualFS.get(filePath);
    if (typeof val === 'string') return val;
    if (val instanceof Uint8Array) {
      return new TextDecoder().decode(val);
    }
    return '';
  }

  existsSync(filePath: string): boolean {
    return this.virtualFS.has(filePath);
  }

  getOSInfo(): OSInfo {
    return {
      platform: 'browser',
      release: 'navigator',
      arch: typeof navigator !== 'undefined' ? navigator.userAgent : 'web',
      cpus: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4,
      totalMemGb: 4
    };
  }

  getNodeVersion(): string {
    return 'browser';
  }
}

const detectAdapter = (): PlatformAdapter => {
  if (isNodeEnv) {
    return new NodePlatformAdapter();
  }
  return new BrowserPlatformAdapter();
};

export const Platform = detectAdapter();
