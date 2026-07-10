export const config = {
  app: {
    port: 3000,
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'png_wallet_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: '24h',
  },
  integrations: {
    savis: {
      apiKey: process.env.SAVIS_API_KEY || 'your_savis_api_key',
      baseUrl: process.env.SAVIS_BASE_URL || 'https://api.savis.com',
    },
    sevispass: {
      clientId: process.env.SEVISPASS_CLIENT_ID || 'your_sevispass_client_id',
      clientSecret: process.env.SEVISPASS_CLIENT_SECRET || 'your_sevispass_client_secret',
      authUrl: process.env.SEVISPASS_AUTH_URL || 'https://auth.sevispass.png',
      apiUrl: process.env.SEVISPASS_API_URL || 'https://api.sevispass.png',
      redirectUri: process.env.SEVISPASS_REDIRECT_URI || 'http://localhost:3000/api/auth/sevispass/callback',
    },
    banks: {
      kina: {
        apiUrl: 'https://api.kina.com',
        apiKey: process.env.KINA_API_KEY || 'your_kina_api_key',
      },
      bsp: {
        apiUrl: 'https://api.bsp.com',
        apiKey: process.env.BSP_API_KEY || 'your_bsp_api_key',
      },
    },
  },
};