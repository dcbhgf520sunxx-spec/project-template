export type ResponseContract<T> = (value: unknown) => value is T;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function objectContract<T>(
  fields: string[],
  nested: Record<string, ResponseContract<unknown>> = {}
): ResponseContract<T> {
  return (value: unknown): value is T => isObject(value)
    && fields.every((field) => Object.hasOwn(value, field))
    && Object.entries(nested).every(([field, contract]) => contract(value[field]));
}

export function arrayContract<T>(itemContract: ResponseContract<T>): ResponseContract<T[]> {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(itemContract);
}
