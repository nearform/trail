export const typeDefs: string;
export function makeResolvers(opts: any): {
    Query: {
        trail(_: any, { id }: {
            id: any;
        }): any;
        trails(_: any, args: any): any;
        enumerateTrails(_: any, args: any): any;
    };
    Mutation: {
        insertTrail(_: any, trail: any): Promise<any>;
        updateTrail(_: any, { id, ...trail }: {
            [x: string]: any;
            id: any;
        }): Promise<any>;
        deleteTrail(_: any, { id }: {
            id: any;
        }): any;
    };
    Date: GraphQLScalarType;
    StringWithAttrs: GraphQLScalarType;
    JSON: GraphQLScalarType;
    SortOrder: {
        ID_ASC: string;
        WHEN_ASC: string;
        WHO_ASC: string;
        WHAT_ASC: string;
        SUBJECT_ASC: string;
        ID_DESC: string;
        WHEN_DESC: string;
        WHO_DESC: string;
        WHAT_DESC: string;
        SUBJECT_DESC: string;
    };
    TrailType: {
        WHO: string;
        WHAT: string;
        SUBJECT: string;
    };
};
import { GraphQLScalarType } from "graphql";
