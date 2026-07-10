export declare const config: {
    app: {
        name: string;
        version: string;
        port: number;
    };
    database: {
        host: string;
        port: number;
        name: string;
    };
    integrations: {
        savis: {
            baseUrl: string;
            apiKey: string | undefined;
        };
        banks: {
            kina: {
                baseUrl: string;
            };
            bsp: {
                baseUrl: string;
            };
        };
    };
    security: {
        jwtSecret: string | undefined;
        encryptionKey: string | undefined;
    };
};
//# sourceMappingURL=default.d.ts.map