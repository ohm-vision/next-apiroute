import type { NextRequest } from "next/server";
import { ResolvedSearchParams } from "./resolved-search-params.type";

export interface ApiRouteHandlerProps<TSession extends object = never, TParams extends object = never, TSearchParams extends object = ResolvedSearchParams, TBody = undefined> {
    /**
     * Original NextRequest
     */
    req: NextRequest;
    /**
     * Decoded user session
     */
    session: TSession;

    /**
     * Parsed body
     */
    body: TBody;

    /**
     * Original NextParams
     */
    params: TParams;
    /**
     * Decoded query, merged with req.query
     */
    searchParams: TSearchParams;
}
