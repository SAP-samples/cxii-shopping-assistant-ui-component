import { OccConfig } from '@spartacus/core';

import { OccEndpoint } from '@spartacus/core';
import { CXAI_ASSISTANT_FEATURE } from '../feature-name';

export interface AssistantOccEndpoints {
  [CXAI_ASSISTANT_FEATURE]: {
    trackingIdToConsignment?: string | OccEndpoint;
  }
}

declare module '@spartacus/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface OccEndpoints extends AssistantOccEndpoints {}
}

const occAssistantEndpoints: AssistantOccEndpoints = {
  cxaiAssistant: {
    trackingIdToConsignment: '/cxai/tools/find-consignment/${trackingId}?fields=code,status,statusDate,statusDisplay,orderCode',
  }
};

// all endpoints grouped under CXAI_ASSISTANT_FEATURE as "scopes"
export type AssistantEndpointKey = keyof AssistantOccEndpoints[typeof CXAI_ASSISTANT_FEATURE];

export const defaultOccAssistantConfig: OccConfig = {
  backend: {
    occ: {
      endpoints: {
        ...occAssistantEndpoints,
      },
    },
  },
};
