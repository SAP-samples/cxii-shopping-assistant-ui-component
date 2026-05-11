import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
  inject, AfterViewChecked
} from '@angular/core';
import {
  ASK_PRODUCT_LOG_MARKER,
  AskProductChatMessage,
  AskProductSource,
  ICurrentProductService,
  ILoggerService,
} from '@cx-spartacus/cxai-ask-product/root';
import {
  Observable,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  take,
  tap,
} from 'rxjs';
import { CxaiAskProductService } from '../../cxai-ask-product.service';

@Component({
  selector: 'lib-cxai-ask-product-chat',
  templateUrl: './cxai-ask-product-chat.component.html',
  styleUrls: [
    //this references styles from assistant lib - we want to have consistent chat window look but we can't extract common library yet
    '../../../../../../../cxai-assistant-angular-lib/projects/cxai-assistant/root/cms-components/_common-variables.scss',
    '../../../../../../../cxai-assistant-angular-lib/projects/cxai-assistant/src/lib/cms-components/assistant-chat-window/cxai-chat.scss',
    './cxai-ask-product-chat.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CxaiAskProductChatComponent implements OnInit, AfterViewChecked {
  private readonly currentProductService = inject(ICurrentProductService);
  private readonly cxaiAskProductService = inject(CxaiAskProductService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly renderer = inject(Renderer2);
  protected loggerService = inject(ILoggerService);

  @ViewChild('chatInputField') chatInputField!: ElementRef;
  @ViewChild('chat') chatNode: ElementRef | undefined;

  busy = false;
  messages: AskProductChatMessage[] = [];
  productCode$: Observable<string> | undefined;
  //to keep scroll-to-bottom on new message
  lastMessageHeight = 0;

  message = '';
  isMessageValid = false;

  onMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.message = target.value;
    this.isMessageValid = !!this.message.trim();
  }

  ngOnInit() {
    if (!this.cxaiAskProductService.isConfigured()) {
      this.loggerService.warn(
        ASK_PRODUCT_LOG_MARKER,
        'Ask product is not configured (missing url)'
      );
      this.productCode$ = undefined;
      return;
    }

    const product$ =
      this.currentProductService.getProduct();
    this.productCode$ = product$.pipe(
      filter((p) => !!p?.code),
      map((p) => p?.code || ''),
      distinctUntilChanged(),
      tap((productCode) => this.loadConversation(productCode))
    );
  }

  ngAfterViewChecked(): void {
    if (
      this.chatNode?.nativeElement &&
      this.lastMessageHeight !== this.chatNode.nativeElement.scrollHeight
    ) {
      this.lastMessageHeight = this.chatNode.nativeElement.scrollHeight;
      this.chatNode.nativeElement.scrollTop = this.lastMessageHeight;
    }
  }

  sendMessage(productCode: string, event?: Event) {
    event?.preventDefault();

    const message = this.message?.trim();
    if (!message) {
      this.renderer
        .selectRootElement(this.chatInputField.nativeElement)
        .select();
      return;
    }

    const context = this.messages.slice(-10);
    this.messages.push({
      message,
      source: 'user',
      timestamp: Date.now(),
    });
    this.message = '';
    this.busy = true;

    this.cxaiAskProductService
      .sendQuestion(productCode, message, context)
      .pipe(
        take(1),
        finalize(() => {
          this.busy = false;
          this.changeDetectorRef.detectChanges();
        })
      )
      .subscribe((response) => {
        const documentIdSet = new Set();
        let sources: AskProductSource[] = response.answer
          ? response.sources || []
          : [];
        sources = sources
          .map((s) => {
            return {
              documentId: s.documentId,
              name: s.name || s.documentId || '',
              downloadUrl: s.downloadUrl,
            };
          })
          .filter((s) => {
            return (
              !!s.downloadUrl &&
              !s.name?.endsWith('_generated') &&
              !documentIdSet.has(s.documentId) &&
              documentIdSet.add(s.documentId)
            );
          });

        this.messages.push({
          message: response.answer,
          source: 'assistant',
          sources,
          status: response.error ? 'error' : '',
          timestamp: Date.now(),
        });
        this.saveConversation(productCode);
        this.changeDetectorRef.markForCheck();
      });
  }

  loadConversation(productCode: string) {
    const conversation = sessionStorage.getItem(
      CONVERSATION_STORAGE_KEY + productCode
    );
    if (conversation && conversation.length > 2) {
      const storedConversation: AskProductChatMessage[] =
        JSON.parse(conversation);
      const interval24h = 1000 * 60 * 60 * 24;
      const oldestTimestamp = Date.now() - interval24h;

      let filteredConversation = storedConversation.filter((m) => {
        return m.timestamp > oldestTimestamp;
      });

      if (filteredConversation.length % 2 === 1) {
        //no orphaned bot messages - remove 1st element
        filteredConversation = filteredConversation.slice(1);
      }

      this.messages = filteredConversation;
      if (this.messages.length !== storedConversation.length) {
        this.saveConversation(productCode);
      }
    } else {
      this.messages = [];
    }
  }

  saveConversation(productCode: string) {
    //last 10 messages
    const lastMessages = this.messages.slice(-10);
    const storageKey = CONVERSATION_STORAGE_KEY + productCode;
    if (lastMessages.length) {
      sessionStorage.setItem(storageKey, JSON.stringify(lastMessages));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }

  clearConversation(productCode: string) {
    this.messages = [];
    this.renderer.selectRootElement(this.chatInputField.nativeElement).select();
    this.saveConversation(productCode);
  }

  onKeyPress(e: KeyboardEvent, productCode: string) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.sendMessage(productCode);
      e.preventDefault();
    }
  }

}

const CONVERSATION_STORAGE_KEY = 'cxai-ask-product-conversation';
