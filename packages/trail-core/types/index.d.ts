export class TrailsManager {
    constructor(opts: any);
    logger: any;
    dbPool: any;
    close(): Promise<any>;
    performDatabaseOperations(operations: any, useTransaction?: boolean): Promise<any>;
    search({ from, to, who, what, subject, page, pageSize, sort, exactMatch, caseInsensitive }?: {
        from: any;
        to: any;
        who: any;
        what: any;
        subject: any;
        page: any;
        pageSize: any;
        sort: any;
        exactMatch?: boolean;
        caseInsensitive?: boolean;
    }): Promise<{
        count: any;
        data: any;
    }>;
    enumerate({ from, to, type, page, pageSize, desc }?: {
        from: any;
        to: any;
        type: any;
        page: any;
        pageSize: any;
        desc: any;
    }): Promise<any>;
    insert(trail: any): Promise<any>;
    get(id: any): Promise<{
        id: any;
        when: any;
        who: {
            id: any;
            attributes: any;
        };
        what: {
            id: any;
            attributes: any;
        };
        subject: {
            id: any;
            attributes: any;
        };
        where: any;
        why: any;
        meta: any;
    }>;
    update(id: any, trail: any): Promise<boolean>;
    delete(id: any): Promise<boolean>;
    _sanitizeSorting(sortKey: any): {
        sortKey: string;
        sortAsc: boolean;
    };
    _sanitizePagination(page: any, pageSize: any): {
        page: any;
        pageSize: any;
    };
}
