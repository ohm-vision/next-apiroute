import { NextRequest } from "next/server";
import { ApiRouteHandler } from "../handlers/api-route.handler";
import type { AnySchema, InferType } from "yup";
import { ResolvedSearchParams } from "./resolved-search-params.type";
import { ILogger } from "./logger.interface";


export interface ApiRouteProps<
    TSessionSchema extends AnySchema<object> = never,
    TParamsSchema extends AnySchema<object> = never,
    TSearchSchema extends AnySchema<object> = AnySchema<ResolvedSearchParams>,
    TBodySchema extends AnySchema = never,

    TSession extends object = InferType<TSessionSchema>,
    TParams extends object = InferType<TParamsSchema>,
    TSearch extends object = InferType<TSearchSchema>,
    TBody = InferType<TBodySchema>,
    > {
    /**
     * The name of the route (for logging)
     */
    name?: string;
    /**
     * This method requires authentication
     */
    secure?: boolean;

    /**
     * A logger for the router - defaults to the `console` instance
     */
    log?: ILogger;

    validate?: {
        sessionSchema?: TSessionSchema;
        paramsSchema?: TParamsSchema;
        searchSchema?: TSearchSchema;
        bodySchema?: TBodySchema;
    };

    readBody?: (req: NextRequest) => Promise<TBody>;

    readSession?: (req: NextRequest) => Promise<TSession>;

    /**
     * 
     * @returns true if the user is authorized, or false if not
     */
    isAuthorized?: ApiRouteHandler<TSession, TParams, TSearch, TBody, boolean>;
    /**
     * 
     * @returns true if the user is authorized, or false if not
     */
    isValid?: ApiRouteHandler<TSession, TParams, TSearch, TBody, boolean>;
    /**
     * Primary handler for routes assuming all authorization passes
     */
    handler: ApiRouteHandler<TSession, TParams, TSearch, TBody>;
}