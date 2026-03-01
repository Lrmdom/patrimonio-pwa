/**
 * Utilitários para Cloudflare R2
 * Centraliza acesso e validação de URLs
 */

import { APP_CONFIG } from '~/config/constants';

export class R2Utils {
  /**
   * Obtém URL completa para um asset no R2
   */
  static getAssetUrl(fileKey: string): string {
    if (!fileKey) {
      throw new Error('File key is required for R2 URL generation');
    }
    
    const baseUrl = APP_CONFIG.R2_URL;
    const cleanKey = fileKey.startsWith('/') ? fileKey.slice(1) : fileKey;
    
    return `${baseUrl}/${cleanKey}`;
  }

  /**
   * Valida se uma URL R2 é válida
   */
  static isValidR2Url(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.origin === APP_CONFIG.R2_URL;
    } catch {
      return false;
    }
  }

  /**
   * Obtém URL para áudio com fallback
   */
  static getAudioUrl(fileKey: string, fallbackUrl?: string): string {
    try {
      return this.getAssetUrl(fileKey);
    } catch (error) {
      console.warn('Failed to generate R2 URL, using fallback:', error);
      return fallbackUrl || '';
    }
  }

  /**
   * Verifica se o R2 está configurado
   */
  static isConfigured(): boolean {
    return !!APP_CONFIG.R2_URL && APP_CONFIG.R2_URL !== '';
  }

  /**
   * Obtém informações de configuração (debug)
   */
  static getConfigInfo() {
    return {
      baseUrl: APP_CONFIG.R2_URL,
      isConfigured: this.isConfigured(),
      isProduction: import.meta.env.PROD
    };
  }
}

// Export para uso fácil
export const getR2Url = R2Utils.getAssetUrl.bind(R2Utils);
export const isValidR2Url = R2Utils.isValidR2Url.bind(R2Utils);
