import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { asProblemDetail } from '../models/problem-detail';
import { NotificationService } from '../notify/notification.service';

/**
 * Shows non-field ProblemDetail errors in a snackbar. Errors with field `errors` are left to the
 * form that sent the request. The error is always rethrown.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const pd = asProblemDetail(err.error);
        const hasFieldErrors = !!pd?.errors && Object.keys(pd.errors).length > 0;
        if (!hasFieldErrors) {
          const msg =
            err.status === 0
              ? 'Cannot reach the server'
              : pd?.detail || pd?.title || `Request failed (${err.status})`;
          notify.error(msg);
        }
      }
      return throwError(() => err);
    }),
  );
};
