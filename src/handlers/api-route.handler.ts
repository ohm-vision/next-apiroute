import type { ApiRouteHandlerProps } from "../interfaces/api-route-handler-props.interface";
import { ResolvedSearchParams } from "../interfaces/resolved-search-params.type";

export type ApiRouteHandler<
    TSession extends object = never,
    TParams extends object = never,
    TSearchParams extends object = ResolvedSearchParams,
    TBody = undefined,
    TReturnType = any
    > = (props: ApiRouteHandlerProps<TSession, TParams, TSearchParams, TBody>) => Promise<TReturnType> | TReturnType;
