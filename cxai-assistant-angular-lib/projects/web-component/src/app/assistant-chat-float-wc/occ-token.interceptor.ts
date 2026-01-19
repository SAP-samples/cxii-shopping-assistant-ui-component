import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OccTokenInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const occToken = window.ACC?.spartacus?.occToken;

    if (occToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${occToken}`,
        },
      });
    }

    return next.handle(request);
  }
}
