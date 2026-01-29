import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';

/**
 * Mock directive that handles Spartacus outlet attributes without functionality
 * Simply renders the template content
 * Used for Accelerator / no-Spartacus setup
 *
 * Usage:
 * <ng-template [cxOutlet]="'OutletName'"></ng-template>
 * <ng-template [cxOutletContext]="contextData"></ng-template>
 */
@Directive({
  selector: '[cxOutlet], [cxOutletContext]',
  standalone: true,
})
export class OutletMockDirective {
  @Input() cxOutlet?: string;
  @Input() cxOutletContext?: any;

  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainerRef = inject(ViewContainerRef);

  constructor() {
    // Render the template content
    this.viewContainerRef.createEmbeddedView(this.templateRef);
  }
}
