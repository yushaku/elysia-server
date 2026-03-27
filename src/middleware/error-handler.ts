import { status } from 'elysia';
import { HttpException } from '@/utils/exceptions';
import { log as baseLog } from '@/utils/logger';
import { Prisma } from 'generated/prisma/client';

export const errorHandler = ({ code, error: err, set, request }: any) => {
  const requestId =
    (set?.headers?.['x-request-id'] as string | undefined) ??
    request?.headers?.get?.('x-request-id') ??
    request?.headers?.get?.('X-Request-Id');

  const log = requestId ? baseLog.child({ requestId }) : baseLog;

  const url = request?.url ? new URL(request.url) : null;
  const path = url?.pathname;

  log.error(
    {
      event: 'error.handler',
      code,
      path,
      errorName: err instanceof Error ? err.name : 'Error',
      errorMessage: err instanceof Error ? err.message : String(err),
      stack:
        err instanceof Error && process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    },
    'Unhandled error',
  );

  if (
    err &&
    typeof err === 'object' &&
    'statusCode' in err &&
    typeof (err as any).statusCode === 'number'
  ) {
    const httpException = err as HttpException;
    set.status = httpException.statusCode;
    return status(httpException.statusCode, {
      success: false,
      error: httpException.error || httpException.name || 'Error',
      message: httpException.message,
      requestId,
    });
  }

  // Also try instanceof check as fallback
  if (err instanceof HttpException) {
    set.status = err.statusCode;
    return status(err.statusCode, {
      success: false,
      error: err.error || err.name || 'Error',
      message: err.message,
      requestId,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      set.status = 409;
      return status(409, {
        success: false,
        error: 'Conflict',
        message: 'Unique constraint failed',
        requestId,
      });
    }

    if (err.code === 'P2025') {
      set.status = 404;
      return status(404, {
        success: false,
        error: 'Not Found',
        message: 'Record not found',
        requestId,
      });
    }

    set.status = 400;
    return status(400, {
      success: false,
      error: 'Bad Request',
      message: process.env.NODE_ENV === 'production' ? 'Database error' : err.message,
      requestId,
    });
  }

  // Also check if code is a number (HTTP status code from Elysia)
  if (typeof code === 'number' && code >= 400 && code < 600) {
    set.status = code;
    return status(code, {
      success: false,
      error: (err instanceof Error ? err.name : 'Error') || 'Error',
      message: (err instanceof Error ? err.message : undefined) || 'An error occurred',
      requestId,
    });
  }

  if (code === 'VALIDATION') {
    set.status = 400;
    return status(400, {
      success: false,
      error: 'Validation Error',
      message: err?.message ?? 'Invalid request',
      requestId,
    });
  }

  if (code === 'NOT_FOUND') {
    set.status = 404;
    return status(404, {
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found',
      requestId,
    });
  }

  if (code === 'INTERNAL_SERVER_ERROR') {
    set.status = 500;
    return status(500, {
      success: false,
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : (err instanceof Error ? err.message : undefined) || 'An unexpected error occurred',
      requestId,
    });
  }

  // Default to 500 for unknown errors
  set.status = 500;
  return status(500, {
    success: false,
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : (err instanceof Error ? err.message : undefined) || 'An unexpected error occurred',
    requestId,
  });
};
