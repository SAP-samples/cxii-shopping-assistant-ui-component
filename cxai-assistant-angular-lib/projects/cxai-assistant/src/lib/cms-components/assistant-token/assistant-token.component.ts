import { ChangeDetectionStrategy, Component, inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AssistantTokenContext, CxaiAssistantTokenComponentsConfig, CxaiAssistantTokenComponentsConfigInternal } from '@cx-spartacus/cxai-assistant/root';

class AssistantTokenContextImpl extends AssistantTokenContext {

}

@Component({
  selector: 'lib-assistant-token',
  templateUrl: './assistant-token.component.html',
  styleUrl: './assistant-token.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AssistantTokenContextImpl,
    { provide: AssistantTokenContext, useExisting: AssistantTokenContextImpl }
  ]
})
export class AssistantTokenComponent implements OnInit {
  childContext = inject(AssistantTokenContextImpl);
  private readonly defaultTokenComponents = inject(CxaiAssistantTokenComponentsConfigInternal).assistantTokens ?? {};
  private readonly customTokenComponents = inject(CxaiAssistantTokenComponentsConfig, { optional: true })?.assistantTokens ?? {};

  @Input({ required: true }) context!: AssistantTokenContext;
  componentId!: string;
  customComponent!: any;

  //logic to hide component tag
  private readonly viewContainerRef = inject(ViewContainerRef);
  @ViewChild('template', { static: true })
  template: any;

  ngOnInit() {
    Object.assign(this.childContext, this.context);
    this.componentId = `AssistantToken_${this.context.token.type}`;
    this.customComponent = this.customTokenComponents[this.componentId];
    if(this.customComponent === undefined) {
      this.customComponent = this.defaultTokenComponents[this.componentId];
    }

    this.viewContainerRef.createEmbeddedView(this.template);
    this.viewContainerRef.element.nativeElement.remove();
  }
}
