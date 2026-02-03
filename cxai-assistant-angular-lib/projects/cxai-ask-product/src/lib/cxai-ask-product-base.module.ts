import { CommonModule } from '@angular/common';
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
  ]
})
export class CxaiAskProductBaseModule { }
