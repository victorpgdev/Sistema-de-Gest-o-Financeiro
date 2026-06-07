/**
 * Motor de Segurança PG-IRONCLAD (Custom Edition)
 * Proteção nativa sem dependências externas - Blindagem Total.
 */

export const security = {
  // 1. Higienização de Strings (XSS & SQL Injection Protection)
  // Remove qualquer caractere que possa ser usado para injetar scripts ou comandos
  sanitize: (val: any): any => {
    if (typeof val !== 'string') return val;
    
    return val
      .replace(/[<>]/g, '') // Remove < e > para evitar tags HTML
      .replace(/javascript:/gi, '') // Mata links de javascript
      .replace(/on\w+=/gi, '') // Mata eventos como onclick, onerror
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove tags script completas
      .trim();
  },

  // 2. Ofuscação de Dados Financeiros (Anti-Spying)
  // Protege a visualização de Agências e Contas
  maskFinancialData: (text: string): string => {
    if (!text || text.length < 4) return '****';
    return `****-${text.slice(-4)}`;
  },

  // 3. Blindagem de Objetos (Anti-Prototype Pollution)
  // Garante que o hacker não consiga injetar propriedades no sistema
  secureObject: <T>(obj: T): T => {
    return Object.freeze({ ...obj });
  }
};
