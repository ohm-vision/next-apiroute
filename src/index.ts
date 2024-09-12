import { NextRequest, NextResponse } from "next/server";
import { AnySchema, CastOptions, InferType, ValidateOptions, ValidationError } from "yup";
import { randomUUID } from "crypto";

import { ApiRouteProps } from "./interfaces/api-route-props.interface";
import { ApiRouteHandlerProps } from "./interfaces/api-route-handler-props.interface";
import { HttpBadRequestError, HttpForbiddenError, HttpUnauthorizedError, isHttpError } from "./interfaces/http-error.interface";
import { ResolvedSearchParams } from "./interfaces/resolved-search-params.type";
import { HttpStatusCode } from "./enums/http-status-code.util";

import { convertModelToNext, santizeJsonToClient, searchParamsToJson, throwIfAborted } from "./utils/next.util";
import { validateSchema } from "./utils/yup.util";

export let DEFAULT_VALIDATION_OPTIONS: ValidateOptions = {
    stripUnknown: true, recursive: true, abortEarly: false
};

export let DEFAULT_CAST_OPTIONS: CastOptions = {
    stripUnknown: true,
};

export function ApiRoute<
    TSessionSchema extends AnySchema<object> = never,
    TParamsSchema extends AnySchema<object> = never,
    TSearchSchema extends AnySchema<object> = AnySchema<ResolvedSearchParams>,
    TBodySchema extends AnySchema = never,

    TSession extends object = InferType<TSessionSchema>,
    TParams extends object = InferType<TParamsSchema>,
    TSearch extends object = InferType<TSearchSchema>,
    TBody = InferType<TBodySchema>,
    >({
    name = "NextApiRoute",
    secure = true,
    validate = {},
    log,
    readBody = noop,
    readSession = noop,
    isAuthorized = isValidDefault,
    isValid = isValidDefault,
    handler,
}: ApiRouteProps<TSessionSchema, TParamsSchema, TSearchSchema, TBodySchema, TSession, TParams, TSearch, TBody>) {
    const { sessionSchema, paramsSchema, searchSchema, bodySchema } = validate;

    async function RouteHandler(req: NextRequest, { params }: {
        params: TParams;
    }) {
        const startAt = new Date().getTime();
        const correlationId = randomUUID();

        function logInfo(...args: any[]) {
            log?.info(name, "~", correlationId, "~", ...args);
        }
        function logWarn(...args: any[]) {
            log?.warn(name, "~", correlationId, "~", ...args);
        }
        function logError(...args: any[]) {
            log?.error(name, "~", correlationId, "~", ...args);
        }
        function logDebug(...args: any[]) {
            log?.debug(name, "~", correlationId, "~", ...args);
        }

        logInfo(`= ${req.method}: ${req.nextUrl.pathname} ~ params =`, params);

        let res: Response;
        let error: Error;
        try {
            let session = await readSession(req);

            if (session && sessionSchema) {
                const result = validateSchema(session, sessionSchema, DEFAULT_VALIDATION_OPTIONS);

                if (result instanceof ValidationError) {
                    session = null;
                    logDebug("INVALID_SESSION", result);
                }
            }

            throwIfAborted(req);

            if (secure) {
                if (session == null) {
                    throw new HttpUnauthorizedError("NO_SESSION");
                }
            }

            if (paramsSchema) {
                const result = validateSchema(params, paramsSchema, DEFAULT_VALIDATION_OPTIONS);

                if (result instanceof ValidationError) {
                    result.path = "params";
                    throw result;
                }
            }

            throwIfAborted(req);

            const query = searchParamsToJson(req);

            if (searchSchema) {
                const result = validateSchema(query, searchSchema, DEFAULT_VALIDATION_OPTIONS);

                if (result instanceof ValidationError) {
                    result.path = "searchParams";
                    throw result;
                }
            }

            throwIfAborted(req);

            const body = await readBody(req);

            if (bodySchema) {
                const result = validateSchema(body, bodySchema, DEFAULT_VALIDATION_OPTIONS);

                if (result instanceof ValidationError) {
                    result.path = "body";
                    throw result;
                }
            }

            throwIfAborted(req);

            const props: ApiRouteHandlerProps<TSession, TParams, TSearch, TBody> = {
                req,
                body: bodySchema?.cast(body, DEFAULT_CAST_OPTIONS) || body,
                session: sessionSchema?.cast(session, DEFAULT_CAST_OPTIONS) || session as any,
                params: paramsSchema?.cast(params, DEFAULT_CAST_OPTIONS) || params as any,
                searchParams: searchSchema?.cast(query, DEFAULT_CAST_OPTIONS) || query as any,
            };

            const authorized = await isAuthorized(props);
            if (!authorized) {
                throw new HttpForbiddenError();
            }

            throwIfAborted(req);

            const valid = await isValid(props);
            if (!valid) {
                throw new HttpBadRequestError();
            }

            throwIfAborted(req);

            const result = await handler(props);

            throwIfAborted(req);

            if (result instanceof NextResponse) {
                res = result;
            } else if (result instanceof Response) {
                res = result;
            } else if (result === null) {
                res = NextResponse.json(null, { status: HttpStatusCode.OK_200 });
            } else if (typeof result === "string") {
                res = new NextResponse(result, { status: HttpStatusCode.OK_200 });
            } else {
                let json = convertModelToNext(result);
                json = santizeJsonToClient(json);
                res = NextResponse.json(json, { status: HttpStatusCode.OK_200 });
            }
        } catch (e: unknown) {
            error = e as any;
            if (isHttpError(error) && error.statusCode === HttpStatusCode.IM_A_TEAPOT_418) {
                error = null; // not a real error
                res = new NextResponse(null, { status: HttpStatusCode.IM_A_TEAPOT_418 });
            }
            else if (req.signal.aborted) {
                res = new NextResponse(null, { status: HttpStatusCode.IM_A_TEAPOT_418 });
            } else if (isHttpError(error)) {
                res = new NextResponse(error.bodyInit, { status: error.statusCode || HttpStatusCode.INTERNAL_ERROR_500 });
            } else if (e instanceof ValidationError) {
                res = NextResponse.json(convertModelToNext(e), { status: HttpStatusCode.BAD_REQUEST_400, statusText: e.path && `INVALID_${e.path.toUpperCase()}` });
            } else {
                res = new NextResponse(null, { status: HttpStatusCode.INTERNAL_ERROR_500 });
            }
        } finally {
            const runtimeMs = new Date().getTime() - startAt;
    
            if (error == null) {
                logInfo("statusCode =", res.status, ", runtimeMs =", runtimeMs);
            } else {
                logError({
                    error: error,
                    statusCode: res.status,
                    runtimeMs: runtimeMs
                });
            }

            return res;
        }
    }

    return RouteHandler;
}

function noop(): any {}

function isValidDefault() {
    return true;
}
