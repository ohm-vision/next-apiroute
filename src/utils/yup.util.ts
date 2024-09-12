import { AnySchema, ValidateOptions, ValidationError } from "yup";

export function validateSchema(value: any, schema: AnySchema, options?: ValidateOptions): true | ValidationError {
    try {
        if (schema) {
            schema.validateSync(value, options);
        }

        return true;
    } catch (e) {
        if (e instanceof ValidationError) return e;

        throw e;
    }
}