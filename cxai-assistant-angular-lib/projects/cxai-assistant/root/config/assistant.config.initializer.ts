import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  BaseSiteService,
  ConfigInitializer,
  LoggerService,
  OccEndpointsService,
} from '@spartacus/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { ASSISTANT_CONFIG_SCOPE, ASSISTANT_LOG_MARKER, CxaiAssistantConfig, CxaiAssistantConfigInternal } from './assistant.config';
import { defaultAssistantConfigInternal } from './default.assistant.config';

@Injectable({ providedIn: 'root' })
export class CxaiAssistantInitializer implements ConfigInitializer {
  private readonly http = inject(HttpClient);
  private readonly occ = inject(OccEndpointsService);
  private readonly baseSiteService = inject(BaseSiteService);
  private readonly loggerService = inject(LoggerService);

  readonly scopes = [ASSISTANT_CONFIG_SCOPE];
  readonly clientSideConfig = Object.assign({}, defaultAssistantConfigInternal, inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE]);
  readonly configFactory = () => firstValueFrom(this.resolveConfig());

  protected resolveConfig(): Observable<CxaiAssistantConfig> {
    const configInitializerEndpoint = this.clientSideConfig?.configInitializerEndpoint;
    if(!configInitializerEndpoint) {
      return of({});
    }

    return this.baseSiteService.getActive().pipe(
      filter((site) => !!site),
      take(1),
      switchMap((_) => {
        const url = this.occ.buildUrl(configInitializerEndpoint);
        return this.http.get<any>(url).pipe(
          map((config: Partial<CxaiAssistantConfigInternal>) => {
            this.populateProductFilters(config);

            const result: CxaiAssistantConfig = {
              [ASSISTANT_CONFIG_SCOPE]: Object.assign({}, config),
            };

            this.loggerService.info(ASSISTANT_LOG_MARKER, 'Loaded configuration from', url, result);
            return result;
          }),
          catchError((error) => {
            this.loggerService.error(
              ASSISTANT_LOG_MARKER,
              'Error loading configuration',
              error
            );
            return of({});
          })
        );
      })
    );
  }

  protected populateProductFilters(
    serverSideConfig: Partial<CxaiAssistantConfigInternal>,
    targetConfig: Partial<CxaiAssistantConfigInternal> = serverSideConfig
  ) {
    if(serverSideConfig?.assistantProductFiltersJson) {
      try {
        const backendFilters = JSON.parse(serverSideConfig?.assistantProductFiltersJson);
        targetConfig.assistantProductFilters = [...backendFilters];
        delete targetConfig?.assistantProductFiltersJson;
      } catch (e) {
        this.loggerService.error(ASSISTANT_LOG_MARKER, 'Error parsing assistantProductFiltersJson', e, serverSideConfig);
      }
    }
  }
}
