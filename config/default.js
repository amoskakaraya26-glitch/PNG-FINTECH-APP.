"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Default configuration for PNG Fintech E-Wallet
exports.config = {
    app: {
        name: 'PNG Fintech E-Wallet',
        version: '1.0.0',
        port: 3000,
    },
    database: {
        host: 'localhost',
        port: 5432,
        name: 'png_wallet_db',
    },
    integrations: {
        savis: {
            baseUrl: 'https://api.savis.com',
            apiKey: process.env.SAVIS_API_KEY,
        },
        banks: {
            kina: {
                baseUrl: 'https://api.kina.com',
            },
            bsp: {
                baseUrl: 'https://api.bsp.com',
            },
        },
    },
    security: {
        jwtSecret: process.env.JWT_SECRET,
        encryptionKey: process.env.ENCRYPTION_KEY,
    },
};
//# sourceMappingURL=default.js.map