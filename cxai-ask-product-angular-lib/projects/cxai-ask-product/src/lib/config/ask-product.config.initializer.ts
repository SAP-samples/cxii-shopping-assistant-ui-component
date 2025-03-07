import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BaseSiteService,
  ConfigInitializer,
  LoggerService,
  OccEndpointsService,
} from '@spartacus/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { AskProductServerSideConfig } from '@cx-spartacus/cxai-ask-product/root';
import {
  ASK_PRODUCT_CONFIG_SCOPE,
  ASK_PRODUCT_LOG_MARKER,
  AskProductConfig
} from '@cx-spartacus/cxai-ask-product/root';

@Injectable({ providedIn: 'root' })
export class AskProductInitializer implements ConfigInitializer {
  readonly scopes = [ASK_PRODUCT_CONFIG_SCOPE];
  readonly configFactory = () => firstValueFrom(this.resolveConfig());

  constructor(
    protected http: HttpClient,
    protected occ: OccEndpointsService,
    protected baseSiteService: BaseSiteService,
    protected loggerService: LoggerService,
  ) {}

  protected resolveConfig(): Observable<AskProductConfig> {
    return this.baseSiteService.getActive().pipe(
      filter((site) => !!site),
      take(1),
      switchMap((site) => {
        const url = this.occ.buildUrl('/cxai/config');
        return this.http.get<AskProductServerSideConfig>(url).pipe(
          map((config) => {
            const result: AskProductConfig = {
              [ASK_PRODUCT_CONFIG_SCOPE]: config.askProductDestination || {},
            };

            if(config.askProductContextCharacterLimit != undefined) {
              result[ASK_PRODUCT_CONFIG_SCOPE].contextCharacterLimit = config.askProductContextCharacterLimit;
            }
            if(config.askProductContextMessageWindow != undefined) {
              result[ASK_PRODUCT_CONFIG_SCOPE].contextMessageWindow = config.askProductContextMessageWindow;
            }

            this.loggerService.info(ASK_PRODUCT_LOG_MARKER, 'Loaded ask product configuration from', url, result);
            return result;
          }),
          catchError((error) => {
            this.loggerService.error(
              ASK_PRODUCT_LOG_MARKER,
              'Error loading CXAI ask product configuration',
              error
            );
            return of({});
          })
        );
      })
    );
  }
}
