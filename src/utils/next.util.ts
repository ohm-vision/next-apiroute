import { NextRequest } from "next/server";
import { HttpImATeapotError } from "../interfaces/http-error.interface";

export function searchParamsToJson({ nextUrl: { searchParams } }: NextRequest) {
    const json: Record<string, string | string[]> = {};

    Array
        .from(searchParams.keys())
        .forEach(key => {
            const values = searchParams.getAll(key);
    
            if (values.length === 1) {
                json[key] = values[0];
            }
            else if (values.length > 1) {
                json[key] = values;
            }
        });

    return json;
}

export function throwIfAborted({ signal: { aborted } }: NextRequest) {
    if (aborted) throw new HttpImATeapotError("ABORTED");
}

/**
 * NextJS has problems properly converting responses to JSON when there are complex types
 * This will use the standard JSON parse/stringify to get them to a simple object type
 * @param input 
 * @returns 
 */
export function convertModelToNext<TInput = any>(input: TInput): TInput {
    return JSON.parse(JSON.stringify(input));
}

/**
 * Takes a JSON object,
 * iterates through all properties, and
 * removes any property starting with "_"
 */
export function santizeJsonToClient(obj: any) {
    // null values
    if (obj == null) return obj;

    // non-object properties
    if (typeof obj !== "object") return obj;

    // special types which cannot iterate properties
    if (obj instanceof Date) return obj;

    if (Array.isArray(obj)) {
        obj.forEach((v, i) => {
            obj[i] = santizeJsonToClient(v);
        });
    } else {
        Object
            .entries(obj)
            .forEach(([k, v]) => {
                if (k.startsWith("_")) {
                    delete obj[k];
                } else {
                    obj[k] = santizeJsonToClient(v);
                }
            });
    }

    return obj;
}
