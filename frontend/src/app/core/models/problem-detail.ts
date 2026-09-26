/** RFC 7807 error body, mirrors the `ProblemDetail` schema in openapi.json. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  /** Field name → message; present on validation and business-rule errors. */
  errors?: Record<string, string>;
}

export function asProblemDetail(body: unknown): ProblemDetail | null {
  return body && typeof body === 'object' ? (body as ProblemDetail) : null;
}
