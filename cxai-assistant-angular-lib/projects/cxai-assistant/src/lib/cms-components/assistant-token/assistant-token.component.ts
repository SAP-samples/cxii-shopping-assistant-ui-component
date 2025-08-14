import { ChangeDetectionStrategy, Component, inject, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { AssistantTokenContext } from '@cx-spartacus/cxai-assistant/root';
import { CmsConfig } from '@spartacus/core';

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
  config = inject(CmsConfig).cmsComponents!;

  @Input({ required: true }) context!: AssistantTokenContext;
  componentId!: string;
  hasCustomComponent!: boolean;

  //logic to hide component tag 
  viewContainerRef = inject(ViewContainerRef);
  @ViewChild('template', { static: true }) 
  template: any;

  ngOnInit() {
    Object.assign(this.childContext, this.context);
    this.componentId = `AssistantToken_${this.context.token.type}`;
    this.hasCustomComponent = this.config[this.componentId]?.component;

    this.viewContainerRef.createEmbeddedView(this.template);
    this.viewContainerRef.element.nativeElement.remove();
  }
}
