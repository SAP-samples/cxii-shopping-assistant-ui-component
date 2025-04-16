import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, inject, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ASSISTANT_CONFIG_SCOPE, ASSISTANT_LOG_MARKER, AssistantChatSession, CxaiAssistantConfig, CxaiAssistantRootService } from '@cx-spartacus/cxai-assistant/root';
import { LoggerService } from '@spartacus/core';
import { ICON_TYPE } from '@spartacus/storefront';
import { distinctUntilChanged, finalize, Subscription, take } from 'rxjs';
import { CxaiAssistantService } from '../../cxai-assistant.service';
import { AssistantProductReferenceComponent } from '../assistant-product-reference/assistant-product-reference.component';
@Component({
  selector: 'lib-assistant-chat-window',
  templateUrl: './assistant-chat-window.component.html',
  styleUrls: [
    './cxai-chat.scss',
    './assistant-chat-window.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AssistantChatWindowComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChildren(AssistantProductReferenceComponent) children!: QueryList<AssistantProductReferenceComponent>;

  private config = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE];
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private cxaiAssistantService = inject(CxaiAssistantService);
  private cxaiAssistantRootService = inject(CxaiAssistantRootService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  protected loggerService = inject(LoggerService);
  protected chatOpened$ = this.cxaiAssistantRootService.getChatOpenedStatus();
  protected currentSiteName = this.cxaiAssistantService.currentBaseSiteName;
  useSapIcons = this.cxaiAssistantRootService.useSapIcons;
  maximized = false;

  icon = ICON_TYPE;
  @ViewChild('chatInputField') chatInputField!: ElementRef;
  @ViewChild('chat') chatNode!: ElementRef;

  sendQuestionSubscription: Subscription | undefined;
  messages: AssistantChatSession | undefined;
  
  //to keep scroll-to-bottom on new message
  lastMessageHeight = 0;

  form: FormGroup = this.fb.group({
    message: ['', Validators.required],
  });

  constructor() {
    this.cxaiAssistantService.getChatSession(!this.config?.openSessionOnlyAfterFirstMessage).pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((session) => {
      //delayed session opening - after 1st user message
      if(this.cxaiAssistantService.isDummySession(this.messages)) {
        //clear "wait for response" marker
        this.sendQuestionSubscription = undefined;
        if(session.chat_history.length == 1) {
          //some error happened, just append last message to current local session stack
          //normally we expect exactly 3 messages in new session - welcome, user, response
          this.messages!.chat_history.push(session.chat_history[0]);
        } else {
          this.messages = session;
        }
      } else {
        this.messages = session;
      }

      this.focusInput();
      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnInit() {
    this.cxaiAssistantRootService.chatWindowLoaded();
  }

  ngOnDestroy() {
    this.sendQuestionSubscription?.unsubscribe();
  }

  ngAfterViewInit() {
    this.focusInput();

    this.cxaiAssistantRootService.chatTextToSend$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((data) => {
      this.form.setValue({ message: data.text });
      this.focusInput();
    });
  }

  ngAfterViewChecked(): void {
    if (
      this.chatNode?.nativeElement &&
      this.lastMessageHeight != this.chatNode.nativeElement.scrollHeight
    ) {
      this.lastMessageHeight = this.chatNode.nativeElement.scrollHeight;
      this.chatNode.nativeElement.scrollTop = this.lastMessageHeight;
    }
  }

  sendMessage() {
    if(!this.messages?.status) {
      this.loggerService.warn(ASSISTANT_LOG_MARKER, 'sendMessage: No valid chat session available');
      return;
    }

    const message = this.form.value.message?.trim();
    if (!message) {
      this.renderer
        .selectRootElement(this.chatInputField.nativeElement)
        .select();
      return;
    }

    this.messages.chat_history.push({
      content: message,
      role: 'user',
    });
    this.form.reset();

    if(this.messages.session_id) {
      this.sendQuestionSubscription = this.cxaiAssistantService
        .sendQuestion(message)
        .pipe(
          take(1),
          finalize(() => {
            this.sendQuestionSubscription = undefined;
            this.changeDetectorRef.detectChanges();
          })
        )
        .subscribe((response) => {
          if(this.messages) {
            this.messages.chat_history.push(Object.assign({}, response));
            this.changeDetectorRef.markForCheck();
          } else {
            this.loggerService.error(ASSISTANT_LOG_MARKER, 'sendMessage response: No chat session available, orphaned response?', response);
          }
        });
    } else if (this.config?.openSessionOnlyAfterFirstMessage) {
      //a "waiting for response" marker that will be cleaned when new session is received
      this.sendQuestionSubscription = new Subscription();
      this.cxaiAssistantService.startNewChatSession(message);
    } else {
      this.loggerService.error(ASSISTANT_LOG_MARKER, 'sendMessage: invaid session_id state', this.messages, this.config);
    }
  }

  onKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.sendMessage();
      e.preventDefault();
    }
  }

  newSession() {
    if(this.messages && (this.messages.chat_history.length > 1 || this.messages.chat_history[0]?.error)) {
      this.messages = undefined;
      this.sendQuestionSubscription?.unsubscribe();
      this.sendQuestionSubscription = undefined;
      this.cxaiAssistantService.startNewChatSession();
    }
  }

  closeChat() {
    this.closeAllProductRefences();
    this.cxaiAssistantRootService.closeChat();
  }

  focusInput() {
    if(this.chatInputField) {
      setTimeout(
        () => this.renderer.selectRootElement(this.chatInputField.nativeElement).select(),
        10
      );
    }
  }

  closeAllProductRefences() {
    this.children.forEach((child) => child.close());
  }

  //resize logic
  resizing = false;
  public mouse!: {x: number, y: number};
  boxPosition!: { left: number, top: number, width: number, height: number};
  width: number | undefined;
  height: number | undefined;
  @ViewChild("chatWindow") public box!: ElementRef;

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent){
    this.mouse = { x: event.clientX, y: event.clientY };

    if(this.resizing) this.resize();
  }

  setResizeStatus(status: boolean, event) {
    if(status) {
      this.loadBox(event);
    }

    setTimeout(() => {
      this.resizing = status;
    }, 1)
  }

  private loadBox(event){
    const rect = this.box.nativeElement.getBoundingClientRect();
    const mouse = { x: event.clientX, y: event.clientY };

    this.boxPosition = {left: mouse.x, top: mouse.y, width: rect.width, height: rect.height};
  }

  private resize() {
    this.width = this.boxPosition.width + (this.boxPosition.left - this.mouse.x);
    this.height = this.boxPosition.height + (this.boxPosition.top - this.mouse.y);
    this.cxaiAssistantService.notifyResize(this.width, this.height);
  }

  toggleMaximize() {
    this.maximized = !this.maximized;
    this.cxaiAssistantService.notifyResize(window.innerWidth, window.innerHeight);
  }
}
