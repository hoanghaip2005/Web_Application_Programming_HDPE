function isPlainObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeErrorDetails(value, seen = new WeakSet(), depth = 0) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (depth >= 6) {
    return "[MaxDepth]";
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (Array.isArray(value)) {
    seen.add(value);
    const result = value
      .map((item) => sanitizeErrorDetails(item, seen, depth + 1))
      .filter((item) => item !== null);
    seen.delete(value);
    return result;
  }

  if (!isPlainObject(value)) {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message
      };
    }

    const constructorName = value.constructor?.name || "Object";
    return `[${constructorName}]`;
  }

  seen.add(value);
  const result = {};

  Object.entries(value).forEach(([key, nestedValue]) => {
    const sanitizedValue = sanitizeErrorDetails(nestedValue, seen, depth + 1);
    if (sanitizedValue !== null) {
      result[key] = sanitizedValue;
    }
  });

  seen.delete(value);
  return Object.keys(result).length ? result : null;
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: sanitizeErrorDetails(error.details)
  });
}
