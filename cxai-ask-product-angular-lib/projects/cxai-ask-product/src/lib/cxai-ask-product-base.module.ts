import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';

/**
 * Base module containing all common functionality for CxaiAskProduct
 * This module handles the component declarations, exports, and providers
 * but does not include any i18n setup - that should be provided by the consuming module
 */
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    CommonModule,
  ],
  providers: [
    provideHttpClient(),
  ]
})
export class CxaiAskProductBaseModule { }