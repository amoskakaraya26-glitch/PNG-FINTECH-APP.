import axios from 'axios';
import { config } from '../../config/default';

export interface SevisPassUser {
  id: string;
  phone: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  verified: boolean;
}

export interface SevisPassTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class SevisPassService {
  private clientId = config.integrations.sevispass.clientId;
  private clientSecret = config.integrations.sevispass.clientSecret;
  private authUrl = config.integrations.sevispass.authUrl;
  private apiUrl = config.integrations.sevispass.apiUrl;
  private redirectUri = config.integrations.sevispass.redirectUri;
  private useMock = process.env.SEVISPASS_USE_MOCK === 'true';

  private hasRealConfig(): boolean {
    const values = [
      this.clientId,
      this.clientSecret,
      this.authUrl,
      this.apiUrl,
      this.redirectUri,
    ];

    if (values.some((value) => !value || !value.trim())) {
      return false;
    }

    const placeholders = [
      'your_sevispass_client_id',
      'your_sevispass_client_secret',
      'https://auth.sevispass.png',
      'https://api.sevispass.png',
    ];

    return (
      !placeholders.includes(this.clientId) &&
      !placeholders.includes(this.clientSecret) &&
      !placeholders.includes(this.authUrl) &&
      !placeholders.includes(this.apiUrl)
    );
  }

  getLoginUrl(state: string): string {
    if (this.useMock) {
      return `${this.redirectUri}?code=mock-auth-code&state=${encodeURIComponent(
        state
      )}`;
    }

    if (!this.hasRealConfig()) {
      throw new Error('SevisPass real credentials are not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email phone national_id',
      state,
    });

    return `${this.authUrl}/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(
    code: string
  ): Promise<SevisPassTokenResponse> {
    if (this.useMock) {
      return {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    if (!this.hasRealConfig()) {
      throw new Error('SevisPass real credentials are not configured');
    }

    try {
      const response = await axios.post(`${this.authUrl}/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw new Error('Failed to authenticate with SevisPass');
    }
  }

  async getUserInfo(accessToken: string): Promise<SevisPassUser> {
    if (this.useMock) {
      return {
        id: `sevispass-user-${Date.now()}`,
        phone: '+675999999999',
        fullName: 'John Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-15',
        gender: 'M',
        nationalId: 'PNG123456789',
        verified: true,
      };
    }

    if (!this.hasRealConfig()) {
      throw new Error('SevisPass real credentials are not configured');
    }

    try {
      const response = await axios.get(`${this.apiUrl}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        id: response.data.sub,
        phone: response.data.phone_number,
        fullName: response.data.name,
        email: response.data.email,
        dateOfBirth: response.data.birthdate,
        gender: response.data.gender,
        nationalId: response.data.national_id,
        verified:
          response.data.email_verified &&
          response.data.phone_number_verified,
      };
    } catch (error) {
      console.error('Failed to get user info from SevisPass:', error);
      throw new Error('Failed to retrieve user information');
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<SevisPassTokenResponse> {
    if (this.useMock) {
      return {
        accessToken: `mock-access-token-${Date.now()}`,
        refreshToken: `mock-refresh-token-${Date.now()}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    }

    if (!this.hasRealConfig()) {
      throw new Error('SevisPass real credentials are not configured');
    }

    try {
      const response = await axios.post(`${this.authUrl}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    if (!this.useMock && this.hasRealConfig()) {
      try {
        await axios.post(`${this.authUrl}/oauth/revoke`, {
          token: accessToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        });
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }
  }

  async verifyIdentity(accessToken: string): Promise<boolean> {
    try {
      const userInfo = await this.getUserInfo(accessToken);
      return userInfo.verified;
    } catch (error) {
      console.error('Failed to verify identity:', error);
      return false;
    }
  }
}

export default new SevisPassService();