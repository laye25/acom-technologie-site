// src/ai-demo/utils/sensitiveDataMasker.ts
// Utility to auto-detect and mask sensitive information for compliance & privacy

export class SensitiveDataMasker {
  private static sensitiveKeywords = [
    'pass', 'password', 'motdepasse', 'secret', 'token', 'key',
    'card', 'carte', 'bank', 'banque', 'iban', 'cvv', 'credit',
    'ssn', 'nir', 'medical', 'diagnostic', 'phone', 'telephone', 'mobile',
    'pin', 'solde', 'account'
  ];

  /**
   * Checks if an HTML input or element name/id/type is sensitive
   */
  public static isElementSensitive(element: HTMLElement): boolean {
    if (!element) return false;

    const input = element as HTMLInputElement;
    if (input.type === 'password' || input.type === 'hidden') return true;

    const id = (element.id || '').toLowerCase();
    const name = (element.getAttribute('name') || '').toLowerCase();
    const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();

    const combined = `${id} ${name} ${placeholder} ${ariaLabel}`;
    return this.sensitiveKeywords.some(keyword => combined.includes(keyword));
  }

  /**
   * Masks a string value if sensitive or if forceMask is true
   */
  public static maskValue(value: string, forceMask = false): string {
    if (!value) return '';
    if (forceMask) return '••••••••';

    // Mask passwords/tokens
    if (value.length > 20 && !value.includes(' ')) {
      return value.substring(0, 3) + '••••••••' + value.substring(value.length - 3);
    }

    // Mask Credit Card (16 digits)
    if (/^\d{16}$/.test(value.replace(/\s+/g, ''))) {
      return '•••• •••• •••• ' + value.slice(-4);
    }

    // Mask IBAN
    if (/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i.test(value.replace(/\s+/g, ''))) {
      return value.substring(0, 4) + ' •••• •••• ' + value.slice(-4);
    }

    // Mask Email (partially)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const [local, domain] = value.split('@');
      const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
      return `${maskedLocal}@${domain}`;
    }

    return value;
  }
}
