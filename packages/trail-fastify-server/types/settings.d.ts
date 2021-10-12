export interface IOptions {
    db?: {
        host?: any;
        port?: any;
        database?: any;
        user?: any;
        password?: any;
        poolSize?: any;
        timeout?: any;
    };
    http?: {
        host?: any;
        port?: any;
        corsOrigin?: any;
    };
    use?: {
        restAPI?: any;
        graphQL?: any;
    };
}

export function loadSettings(options: any): IOptions;
