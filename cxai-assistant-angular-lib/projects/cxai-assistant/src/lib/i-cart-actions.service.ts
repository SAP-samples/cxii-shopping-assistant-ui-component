import { AssistantContext } from "@cx-spartacus/cxai-assistant/root";
import { Observable } from "rxjs";

/**
 * Actions like reload cart, get page context etc that differ
 * between Spartacus and Accelerator implementations
 */
export abstract class IMiscSpartacusActionsService {
  abstract reloadCart(): void;
  abstract getPageContext(): Observable<AssistantContext>;
}
