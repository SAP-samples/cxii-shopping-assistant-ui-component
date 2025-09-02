import { Component, inject, OnDestroy } from '@angular/core';
import { AssistantTokenContext } from '@cx-spartacus/cxai-assistant/root';
import { Consignment, OrderHistoryFacade } from '@spartacus/order/root';
import { LAUNCH_CALLER, LaunchDialogService } from '@spartacus/storefront';
import { CxaiAssistantTrackingService } from '../../cxai-assistant.tracking.service';

@Component({
  selector: 'lib-assistant-tracking-id-reference',
  templateUrl: './assistant-tracking-id-reference.component.html',
  styleUrl: './assistant-tracking-id-reference.component.scss',
  standalone: false,
})
export class AssistantTrackingIdReferenceComponent implements OnDestroy{
  assistantTrackingService = inject(CxaiAssistantTrackingService);
  tokenContext: AssistantTokenContext = inject(AssistantTokenContext);
  orderHistoryFacade = inject(OrderHistoryFacade);
  launchDialogService = inject(LaunchDialogService);
  
  token = this.tokenContext.token;
  consignment$ = this.assistantTrackingService.getConsignmentByTrackingId(this.token.content);
  consignmentTracking$ = this.orderHistoryFacade.getConsignmentTracking();

  openTrackingDialog(event: Event, consignment: Consignment) {
    event.preventDefault();
    if (consignment.code) {
      this.orderHistoryFacade.loadConsignmentTracking(
        consignment['orderCode'],
        consignment.code
      );
    }
    const modalInstanceData = {
      tracking$: this.consignmentTracking$,
      shipDate: consignment.statusDate,
    };

    this.launchDialogService.openDialogAndSubscribe(
      LAUNCH_CALLER.CONSIGNMENT_TRACKING,
      undefined,
      modalInstanceData
    );
  }

  ngOnDestroy(): void {
    this.orderHistoryFacade.clearConsignmentTracking();
  }
}
