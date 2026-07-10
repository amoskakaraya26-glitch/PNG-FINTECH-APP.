import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { config } from '../../../config/default';
import { KYCVerification } from '../../common/types';

export class SavisService {
  private apiKey = config.integrations.savis.apiKey;
  private baseUrl = config.integrations.savis.baseUrl;
  private useMock = process.env.SAVIS_USE_MOCK === 'true';

  private useMockMode(): boolean {
    return this.useMock;
  }

  private hasRealConfig(): boolean {
    return Boolean(
      this.apiKey &&
      this.baseUrl &&
      this.apiKey !== 'your_savis_api_key' &&
      this.baseUrl !== 'https://api.savis.com'
    );
  }

  private ensureConfigured(): void {
    if (!this.useMockMode() && !this.hasRealConfig()) {
      throw new Error(
        'Savis is not configured for real credentials. Set SAVIS_API_KEY and SAVIS_BASE_URL in .env, or set SAVIS_USE_MOCK=true for testing.'
      );
    }
  }

  async initiateVerification(phone: string, name: string) {
    if (!phone || !name) {
      throw new Error('Missing phone or name');
    }

    if (this.useMockMode()) {
      return {
        sessionId: uuidv4(),
        redirectUrl: 'https://mock-savis.com/verify',
        qrCode: 'mock-qr-code',
      };
    }

    this.ensureConfigured();

    try {
      const response = await axios.post(`${this.baseUrl}/kyc/initiate`, {
        phone,
        name,
        sessionId: uuidv4(),
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      return {
        sessionId: response.data.sessionId,
        redirectUrl: response.data.redirectUrl,
        qrCode: response.data.qrCode,
      };
    } catch (error) {
      console.error('Savis initiation failed:', error);
      throw new Error('Failed to initiate Savis verification');
    }
  }

  async verifyCallback(sessionId: string, result: any): Promise<KYCVerification> {
    if (this.useMockMode()) {
      if (!sessionId || sessionId === 'invalid-session-id' || !result?.userId || result.status !== 'success') {
        throw new Error('Invalid callback session or result');
      }

      return {
        id: uuidv4(),
        userId: result.userId,
        savisId: sessionId,
        status: 'verified',
        verificationData: result,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Validate callback signature
    if (!this.validateCallbackSignature(sessionId, result)) {
      throw new Error('Invalid callback signature');
    }

    try {
      // Process the verification result
      const verification: KYCVerification = {
        id: uuidv4(),
        userId: result.userId,
        savisId: sessionId,
        status: result.status === 'success' ? 'verified' : 'rejected',
        verificationData: result,
        verifiedAt: result.status === 'success' ? new Date() : undefined,
        createdAt: new Date(),
      };

      return verification;
    } catch (error) {
      console.error('Savis callback verification failed:', error);
      throw new Error('Failed to process Savis callback');
    }
  }

  private validateCallbackSignature(_sessionId: string, _result: any): boolean {
    // Implement signature validation logic
    // For now, return true as placeholder
    return true;
  }
}