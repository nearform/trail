export namespace trailSchema {
    export const params: any;
    export const search: any;
    export const enumerate: any;
    export const request: any;
    export { responseObject as response };
    export const searchResponse: any;
}
export namespace spec {
    const openapi: string;
    namespace info {
        const title: string;
        const description: string;
        namespace contact {
            const name: string;
            const url: string;
            const email: string;
        }
        namespace license {
            const name_1: string;
            export { name_1 as name };
            const url_1: string;
            export { url_1 as url };
        }
        const version: any;
    }
    const tags: {
        name: string;
        description: string;
    }[];
    namespace components {
        const models: {
            'trail.params.id': any;
            'trail.request': any;
            'trail.response': any;
        };
        const errors: {
            400: any;
            404: any;
            422: any;
            500: any;
        };
    }
    const paths: {};
}
declare const responseObject: any;
export {};
