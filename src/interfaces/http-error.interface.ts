import { HttpStatusCode } from "../enums/http-status-code.util";

export function isHttpError(v: unknown) : v is HttpError {
    return !!v && typeof v === "object" && "statusCode" in v;
}

export class HttpError extends Error {
    constructor(
        message: string,
        readonly statusCode: HttpStatusCode | number,
        readonly bodyInit?: BodyInit,
    ) {
        super(message);
    }
}

export class HttpUnauthorizedError extends HttpError {
    constructor(
        message: string = "UNAUTHORIZED",
    ) {
        super(message, HttpStatusCode.UNAUTHORIZED_401);
    }
}

export class HttpForbiddenError extends HttpError {
    constructor(
        message: string = "FORBIDDEN",
    ) {
        super(message, HttpStatusCode.FORBIDDEN_403);
    }
}

export class HttpBadRequestError extends HttpError {
    constructor(
        message: string = "BAD_REQUEST",
        bodyInit?: BodyInit,
    ) {
        super(message, HttpStatusCode.BAD_REQUEST_400, bodyInit);
    }
}

export class HttpImATeapotError extends HttpError {
    constructor(
        message: string = "IM_A_TEAPOT"
    ) {
        super(message, HttpStatusCode.IM_A_TEAPOT_418);
    }
}
