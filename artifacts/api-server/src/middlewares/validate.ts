import { type Request, type Response, type NextFunction } from "express";

/* ─── Field descriptor ─────────────────────────────────────────────────── */

type FieldType = "string" | "number" | "boolean" | "email" | "uuid" | "url" | "phone-au" | "enum";

interface FieldRule {
  type: FieldType;
  required?: boolean;
  /** Allowed values when type === "enum" */
  enum?: string[];
  /** Minimum string length / numeric value */
  min?: number;
  /** Maximum string length / numeric value */
  max?: number;
  /** Custom regex the string must satisfy */
  pattern?: RegExp;
  /** Human-readable label for error messages (defaults to field name) */
  label?: string;
}

type Schema = Record<string, FieldRule>;

/* ─── Patterns ────────────────────────────────────────────────────────── */

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE    = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_RE     = /^https?:\/\/.+/i;
// Australian landline or mobile: +61 prefix or leading 0, 9-10 digits after
const PHONE_AU_RE = /^(\+?61|0)[2-9]\d{8}$/;

/* ─── Core validator ──────────────────────────────────────────────────── */

interface ValidationError {
  field: string;
  message: string;
}

function validateField(name: string, rule: FieldRule, raw: unknown): ValidationError | null {
  const label = rule.label ?? name;

  // Missing / undefined
  if (raw === undefined || raw === null || raw === "") {
    if (rule.required) return { field: name, message: `${label} is required` };
    return null; // optional — skip further checks
  }

  const value = raw;

  switch (rule.type) {
    case "string": {
      if (typeof value !== "string")
        return { field: name, message: `${label} must be a string` };
      if (rule.min !== undefined && value.length < rule.min)
        return { field: name, message: `${label} must be at least ${rule.min} characters` };
      if (rule.max !== undefined && value.length > rule.max)
        return { field: name, message: `${label} must be at most ${rule.max} characters` };
      if (rule.pattern && !rule.pattern.test(value))
        return { field: name, message: `${label} format is invalid` };
      break;
    }
    case "email": {
      if (typeof value !== "string" || !EMAIL_RE.test(value))
        return { field: name, message: `${label} must be a valid email address` };
      break;
    }
    case "uuid": {
      if (typeof value !== "string" || !UUID_RE.test(value))
        return { field: name, message: `${label} must be a valid UUID` };
      break;
    }
    case "url": {
      if (typeof value !== "string" || !URL_RE.test(value))
        return { field: name, message: `${label} must be a valid URL (http/https)` };
      break;
    }
    case "phone-au": {
      if (typeof value !== "string" || !PHONE_AU_RE.test(value.replace(/\s/g, "")))
        return { field: name, message: `${label} must be a valid Australian phone number` };
      break;
    }
    case "number": {
      const n = typeof value === "string" ? Number(value) : value;
      if (typeof n !== "number" || isNaN(n as number))
        return { field: name, message: `${label} must be a number` };
      if (rule.min !== undefined && (n as number) < rule.min)
        return { field: name, message: `${label} must be at least ${rule.min}` };
      if (rule.max !== undefined && (n as number) > rule.max)
        return { field: name, message: `${label} must be at most ${rule.max}` };
      break;
    }
    case "boolean": {
      if (value !== true && value !== false && value !== "true" && value !== "false")
        return { field: name, message: `${label} must be a boolean` };
      break;
    }
    case "enum": {
      if (!rule.enum?.includes(String(value)))
        return {
          field: name,
          message: `${label} must be one of: ${rule.enum?.join(", ") ?? ""}`,
        };
      break;
    }
  }

  return null;
}

function runValidation(data: Record<string, unknown>, schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [name, rule] of Object.entries(schema)) {
    const err = validateField(name, rule, data[name]);
    if (err) errors.push(err);
  }

  return errors;
}

/* ─── Middleware factories ────────────────────────────────────────────── */

/**
 * Express middleware factory.
 * Validates `req.body` against the provided schema.
 * Returns 400 + structured errors on failure, calls next() on success.
 *
 * @example
 * router.post("/staff", validateBody({ name: { type: "string", required: true, min: 2 } }), handler)
 */
export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body: Record<string, unknown> =
      typeof req.body === "object" && req.body !== null ? req.body : {};

    const errors = runValidation(body, schema);

    if (errors.length > 0) {
      res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
        requestId: req.headers["x-request-id"],
      });
      return;
    }

    next();
  };
}

/**
 * Express middleware factory.
 * Validates `req.query` (all values are strings from Express) against schema.
 * Returns 400 + structured errors on failure.
 */
export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const query = req.query as Record<string, unknown>;
    const errors = runValidation(query, schema);

    if (errors.length > 0) {
      res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
        requestId: req.headers["x-request-id"],
      });
      return;
    }

    next();
  };
}
