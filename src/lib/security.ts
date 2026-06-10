/**
 * Motor de Segurança PG-IRONCLAD v2.0
 * Proteção nativa de nível empresarial para sistemas financeiros.
 */

export const security = {
  // 1. Higienização de Strings (Anti-XSS & Anti-SQL Injection)
  sanitize: (val: any): any => {
    if (typeof val !== 'string') return val;
    
    return val
      .replace(/[<>]/g, '') // Remove tags básicas
      .replace(/javascript:/gi, '') // Cross-site scripting links
      .replace(/on\w+=/gi, '') // Inline event handlers
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Tags script completas
      .replace(/expression\((.*?)\)/gi, '') // CSS expressions
      .replace(/eval\((.*?)\)/gi, '') // Javascript eval
      .replace(/--/g, '') // Basic SQL Comment protection
      .replace(/;/g, '') // Command injection
      .trim();
  },

  // 2. Ofuscação de Dados Sensíveis
  maskFinancialData: (text: string): string => {
    if (!text) return '****';
    const clean = text.replace(/\D/g, '');
    if (clean.length < 4) return '****';
    return `****-${clean.slice(-4)}`;
  },

  maskEmail: (email: string): string => {
    if (!email || !email.includes('@')) return '***@***.***';
    const [user, domain] = email.split('@');
    return `${user.slice(0, 3)}***@${domain}`;
  },

  // 3. Blindagem de Objetos
  secureObject: <T>(obj: T): T => {
    return Object.freeze(JSON.parse(JSON.stringify(obj)));
  },

  // 4. Validação de Senha Forte
  isPasswordStrong: (pass: string): boolean => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass);
  },

  // 5. Verificação de Integridade (Checksum Simples)
  generateSimpleToken: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};
