/*
 * SPDX-FileCopyrightText: 2023 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { TranslationChunksConfig, TranslationResources } from '@spartacus/core';
import { en } from '@cx-spartacus/cxai-assistant/root';

export const libTranslations: TranslationResources = {
  en,
};

export const libTranslationsChunksConfig: TranslationChunksConfig = {
  cxaiAssistant: ['cxaiAssistant'],
};
