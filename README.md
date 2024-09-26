# next-apiroute
Wrapper for NextJS App Router API routes

This wrapper will perform standard basic validation and protection steps for your API routes to standardize your control flow

> Note: This library works only for Next API's using the App Router (v13+)

[![npm version](https://badge.fury.io/js/@ohm-vision%2Fnext-apiroute.svg)](https://badge.fury.io/js/@ohm-vision%2Fnext-apiroute)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/1kom)

## Installation
Run the following command
```
npm install @ohm-vision/next-apiroute
```

## Usage
Simply import the `ApiRoute` into your `route.ts` file and assign it to the standard `GET`, `POST`, `PUT`, `PATCH` or `DELETE` operations supported by NextJS

The library uses `yup` to validate the request objects before they hit your handler

### Important notes
* Each step checks if the request received an aborted signal and will shortcircuit with a `418_IM_A_TEAPOT` http status code
* If a `HttpError` type error is thrown (any object with a `statusCode` property), that value will be returned to the client
* If the request is aborted by the client, a `418_IM_A_TEAPOT` status is returned
* If a `ValidationError` object is thrown, a `400_BAD_REQUEST` status is returned along with the error in the body
* All other errors, result in a `500_INTERNAL_ERROR` status code and the details are logged

#### Order of execution
1. `readSession`
    1. If `validate.sessionSchema` is provided, validate the session object, logs and sets session to `null` if it fails
1. If `secure` is true, validate that the session is not `null` or return `401_UNAUTHORIZED`
1. If `validate.paramsSchema` is provided, validate the request `params` object, if fails, returns a `400_BAD_REQUEST` along with the accompanying `yup` `ValidationError` object in the body
1. If `validate.searchSchema` is provided, validate the `NextRequest.nextUrl.searchParams` object, if fails, returns a `400_BAD_REQUEST` along with the accompanying `yup` `ValidationError` object in body
1. `readBody`
    1. If `validate.bodySchema` is provided, validate the request body, if fails, returns a `400_BAD_REQUEST` along with the accompanying `yup` `ValidationError` object in the body
1. `isAuthorized`, if this returns false a `403_FORBIDDEN` response is returned
1. `isValid`, if this returns false a `400_BAD_REQUEST` response is returned
1. `handler`, fires business logic
    1. If the result is a `NextResponse` or `Response` object, it is passed back to the client (use this when passing back `Blob`, `redirects`, files or other special types of responses)
    1. If the result is null, an empty `200_OK` response is returned
    1. If the result is a string, the string is returned in the body along with a `200_OK` response
    1. Otherwise:
        1. The response object is converted to a `NextJS`-compatible object via `JSON.parse(JSON.stringify(obj))`,
        1. The response object is recursively stripped of all properties starting with an underscore (`_`)
        1. A `200_OK` status code is returned along with the mutated response body


### Props
The props below outline how you can configure each request

* name (string): gives a name to the API when logging
* secure (boolean): returns an `401_UNAUTHORIZED` http status code to the client if no session is found (defaults to true)
* log (ILogger): A logger interface for capturing messages in flight
* validate (object)
* * sessionSchema: A `yup` object schema used to validate the session
* * paramsSchema: A `yup` object schema used to validate the path params
* * searchSchema: A `yup` object schema used to validate the querystring
* * bodySchema: A `yup` object schema used to validate the request body
* readBody(req: `NextRequest`): The async function to read the request body, usually this will be `req => req.json()`
* readSession(req: `NextRequest`): The async function to decode and resolve the current user session
* isAuthorized(props: `DecodedProps`): Additional async authorization functions, maybe to verify the user is allowed to access the resource, returning `false` here will return a `FORBIDDEN` http status code
* isValid(props: `DecodedProps`): Additional async validation functions, maybe to check if the resource is valid - returning `false` here will return in a `400_BAD_REQUEST` http status code
* handler(props: `DecodedProps`): Async function for the actual business logic


### Example
```ts
import { ApiRoute } from "@ohm-vision/next-apiroute";
import { mixed, number, object, string, InferType, date, array } from "yup";

// @/models/sessions/session.model.ts
const permissions = [
    "read", "write"
] as const;
type Permission = typeof permissions[number];

const sessionSchema = object({
    userName: string().required().nullable(),
    expiry: date().max(new Date()).required().nullable(),
    permissions: array(mixed<Permission>().oneOf(permissions))
});

type Session = InferType<typeof sessionSchema>;

// @/models/blogs/search-blogs.dto.ts
const searchBlogsDtoSchema = object({
    search: string().nullable(),
    limit: number().min(1).max(10).nullable(),
});

// @/app/api/blogs/[type]/route.ts
const types = [
    "red", "orange", "yellow"
] as const;

type TypeParam = typeof types[number];

const name = "MyApi";

export const GET = ApiRoute({
    name: name,
    secure: false,
    log: console,
    readSession: async (req) => {
        // todo: plug into session resolver
        const session: Session = null;
        return session;
    },
    validate: {
        paramsSchema: object({
            type: mixed<TypeParam>().oneOf(types).required()
        }) ,
        searchSchema: searchBlogsDtoSchema,
        sessionSchema: sessionSchema,
    },
    handler: async ({ params: { type }, searchParams: { search, limit }}) => {
        const result = [];
        // todo: look up the blogs
        return result;
    }
});

export const POST = ApiRoute({
    name: name,
    secure: true,
    log: console,
    readSession: async (req) => {
        // todo: plug into session resolver
        const session: Session = null;
        return session;
    },
    readBody: req => req.json(),
    validate: {
        bodySchema: object({
            title: string().required().nullable(),
        }),
        paramsSchema: object({
            type: mixed<TypeParam>().oneOf(types).required()
        }),
        sessionSchema: sessionSchema,
    },
    // additional permission checking
    isAuthorized: async ({ session }) => session.permissions.includes("write"),
    // additional validation
    isValid: async ({ body, params }) => {
        // todo: additional validation
        return true;
    },
    handler: async ({
        body: { title }, params: { type }
    }) => {
        // todo: save to db
        return "works";
    }
});
```

## Contact Me
[Ohm Vision, Inc](https://ohmvision.com)
