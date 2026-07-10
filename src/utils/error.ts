function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

export function getErrorCode(error: unknown): string {
  if (isErrnoException(error)) {
    return error.code ?? "UNKNOWN_ERROR";
  }

  return "UNKNOWN_ERROR";
}
