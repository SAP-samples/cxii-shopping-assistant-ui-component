import { OccConfig } from '@spartacus/core';
import { OccEndpoint } from '@spartacus/core';

export interface AssistantOccEndpoints {
  cxaiAssistant_trackingIdToConsignment?: string | OccEndpoint;
}

declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OccEndpoints extends AssistantOccEndpoints {}
}

const occAssistantEndpoints: AssistantOccEndpoints = {
  cxaiAssistant_trackingIdToConsignment: 
    '/cxai/tools/find-consignment/${trackingId}?fields=code,status,statusDate,statusDisplay,orderCode',
};

export type AssistantEndpointKey = keyof AssistantOccEndpoints;

export const defaultOccAssistantConfig: OccConfig = {
  backend: {
    occ: {
      endpoints: {
        ...occAssistantEndpoints,
      },
    },
  },
};
