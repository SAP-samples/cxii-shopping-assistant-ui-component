import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ASK_PRODUCT_CONFIG_SCOPE,
  ASK_PRODUCT_LOG_MARKER,
  AskProductConfig, AskProductConfigInternal, AskProductServerSideConfig, IBaseSiteService,
  ILoggerService,
  IOccEndpointsService
} from '@cx-spartacus/cxai-ask-product/root';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, delay, filter, map, switchMap, take } from 'rxjs/operators';
import { defaultAskProductConfigInternal } from './default.ask-product.config';

@Injectable({ providedIn: 'root' })
export class AskProductInitializer {
  readonly scopes = [ASK_PRODUCT_CONFIG_SCOPE];
  readonly configFactory = () => firstValueFrom(this.resolveConfig());

  constructor(
    protected http: HttpClient,
    protected occ: IOccEndpointsService,
    protected baseSiteService: IBaseSiteService,
    protected loggerService: ILoggerService,
  ) {}

  protected resolveConfig(): Observable<AskProductConfig> {

    return this.baseSiteService.getActive().pipe(
      filter((site) => !!site),
      delay(0), //make sure ACC script runs first (i.e. static config)
      take(1),
      switchMap((site) => {

        // this code is only to support accelerator (JSP) config - basically an object in window.ACC
        const staticConfig = this.getStaticConfig();

        if(staticConfig) {
          this.loggerService.info(ASK_PRODUCT_LOG_MARKER, 'Using static config from window.ACC', staticConfig);
          return of({[ASK_PRODUCT_CONFIG_SCOPE]: staticConfig});
        }

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

  /** This code is only to support accelerator (JSP) config - basically an object in window.ACC */
  private getStaticConfig(): AskProductConfigInternal | null {
    const staticConfig = window?.['ACC']?.cxaiaskproduct?.config as AskProductConfigInternal | undefined;

    if(staticConfig) {
      //{ url: 'ok' } - we check if config.url is defined to assume that config is valid but in case
      //of hardcoded static config URL is not required
      return Object.assign({ url: 'ok' }, defaultAskProductConfigInternal, staticConfig);
    }

    return null;
  }
}
