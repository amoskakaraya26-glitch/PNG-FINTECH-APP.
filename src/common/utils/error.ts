export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (isObject(error) && typeof error.message === 'string') return error.message;
  return String(error);
};

export const isErrorWithCode = (error: unknown): error is { code?: string } =>
  isObject(error) && typeof error.code === 'string';
