import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, ElementRef, HostListener, inject, OnInit, QueryList, Renderer2, signal, ViewChild, ViewChildren } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ASSISTANT_CONFIG_SCOPE, ASSISTANT_LOG_MARKER, AssistantChatSession, AssistantChatWindowComponentInterface, AssistantChatWindowOutletContext, CxaiAssistantConfig, CxaiAssistantOutlets, CxaiAssistantRootService } from '@cx-spartacus/cxai-assistant/root';
import { LoggerService } from '@spartacus/core';
import { ICON_TYPE } from '@spartacus/storefront';
import { distinctUntilChanged, finalize, map, Subscription, take } from 'rxjs';
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
export class AssistantChatWindowComponent implements OnInit, AfterViewInit, AfterViewChecked, AssistantChatWindowComponentInterface {
  @ViewChildren(AssistantProductReferenceComponent) children!: QueryList<AssistantProductReferenceComponent>;

  private config = inject(CxaiAssistantConfig)[ASSISTANT_CONFIG_SCOPE];
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private cxaiAssistantService = inject(CxaiAssistantService);
  private cxaiAssistantRootService = inject(CxaiAssistantRootService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);
  protected loggerService = inject(LoggerService);

  protected outlets = CxaiAssistantOutlets;
  protected chatOpened$ = this.cxaiAssistantRootService.getChatOpenedStatus();
  protected currentSiteName = this.cxaiAssistantService.currentBaseSiteName;
  useSapIcons = this.cxaiAssistantRootService.useSapIcons;
  maximized = false;

  icon = ICON_TYPE;
  @ViewChild('chatInputField') chatInputField!: ElementRef;
  @ViewChild('chat') chatNode!: ElementRef;

  sendQuestionSubscription = signal<Subscription | undefined>(undefined);
  messages: AssistantChatSession | undefined;
  
  //to keep scroll-to-bottom on new message
  lastMessageHeight = 0;

  form: FormGroup = this.fb.group({
    message: ['', Validators.required],
  });

  //external interface state
  formValid = toSignal(this.form.statusChanges.pipe(map(status => status === 'VALID')), { initialValue: false });
  hasValidSession = signal<boolean>(false); // until messages are signal, this must be manually updated
  inputTextDisabled = computed(() => !this.hasValidSession() || !!this.sendQuestionSubscription());
  sendDisabled = computed(() => !!this.sendQuestionSubscription() || !this.formValid() || !this.hasValidSession());
  outletContext: AssistantChatWindowOutletContext = { chatWindowComponent: this };

  constructor() {
    this.cxaiAssistantService.getChatSession(!this.config?.openSessionOnlyAfterFirstMessage).pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((session) => {
      //delayed session opening - after 1st user message
      if(this.cxaiAssistantService.isDummySession(this.messages)) {
        //clear "wait for response" marker
        this.sendQuestionSubscription.set(undefined);
        if(session.chat_history.length == 1) {
          //some error happened, just append last message to current local session stack
          //normally we expect exactly 3 messages in new session - welcome, user, response
          this.messages!.chat_history.push(session.chat_history[0]);
        } else {
          this.setChatSession(session);
        }
      } else {
        this.setChatSession(session);
      }

      this.focusInput();
      this.changeDetectorRef.markForCheck();
    });

    this.cxaiAssistantService.currentUserChange$.pipe(
      takeUntilDestroyed(),
    ).subscribe(newSession => {
      //user logged in/out, or site changed etc. if we don't have cached session need to create new one
      if(!newSession.new_session_id && !this.config?.openSessionOnlyAfterFirstMessage) {
        this.newSession(true);
      }
    });
  }

  ngOnInit() {
    this.cxaiAssistantRootService.chatWindowLoaded();
  }

  ngOnDestroy() {
    this.sendQuestionSubscription()?.unsubscribe();
  }

  ngAfterViewInit() {
    this.focusInputAndSelectAll();

    this.cxaiAssistantRootService.chatTextToSend$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((data) => {
      this.setInputText(data.text);
    });
  }

  setInputText(text: string, select = true) {
    this.form.setValue({ message: text || '' });
    if (select) {
      this.focusInputAndSelectAll();
    } else {
      this.focusInput();
    }
  }

  appendInputText(text: string, select = true) {
    //append text at the end of current input, and focus
    const input = this.chatInputField.nativeElement;
    const currentText = this.form.value.message || '';
    this.form.setValue({ message: currentText + text });
    this.focusInput();

    if (select) {
      input.setSelectionRange(currentText.length, currentText.length + text.length);
    }
  }

  insertInputText(text: string, select = true) {
    //insert text at the end of current selection, and select newly added text
    const input = this.chatInputField.nativeElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentText = this.form.value.message || '';
    const newText = currentText.slice(0, start) + text + currentText.slice(end);
    this.form.setValue({ message: newText });
    this.focusInput();

    if (select) {
      //select newly added text
      input.setSelectionRange(start, start + text.length);
    }
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
    if(!this.messages || !this.hasValidSession()) {
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
      const sub = this.cxaiAssistantService
        .sendQuestion(message)
        .pipe(
          take(1),
          finalize(() => {
            this.sendQuestionSubscription.set(undefined);
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
      this.sendQuestionSubscription.set(sub);
    } else if (this.config?.openSessionOnlyAfterFirstMessage) {
      //a "waiting for response" marker that will be cleaned when new session is received
      this.sendQuestionSubscription.set(new Subscription());
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

  newSession(force = false) {
    if(force || (this.messages && (this.messages.chat_history.length > 1 || this.messages.chat_history[0]?.error))) {
      this.setChatSession(undefined);
      this.sendQuestionSubscription()?.unsubscribe();
      this.sendQuestionSubscription.set(undefined);
      this.cxaiAssistantService.startNewChatSession();
    }
  }

  protected setChatSession(session: AssistantChatSession | undefined) {
    this.messages = session;
    this.hasValidSession.set(!!this.messages?.status);
  }

  closeChat() {
    this.closeAllProductRefences();
    this.cxaiAssistantRootService.closeChat();
  }

  focusInput() {
    this.chatInputField?.nativeElement?.focus();
  }

  focusInputAndSelectAll() {
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

  // Drag logic
  dragging = false;
  dragOffset = { x: 0, y: 0 };

  onTitleBarMouseDown(event: MouseEvent) {
    if (this.maximized) return;
    this.dragging = true;
    const boxRect = this.box?.nativeElement.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - (boxRect?.left ?? 0),
      y: event.clientY - (boxRect?.top ?? 0),
    };
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  onDragMove = (event: MouseEvent) => {
    if (!this.dragging || this.maximized || !this.box?.nativeElement) return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const boxRect = this.box.nativeElement.getBoundingClientRect();
    const boxWidth = boxRect.width || 0;
    const boxHeight = boxRect.height || 0;
    // Calculate new right and bottom
    let right = viewportWidth - (event.clientX - this.dragOffset.x + boxWidth);
    let bottom = viewportHeight - (event.clientY - this.dragOffset.y + boxHeight);
    const snapDistance = 10;

    // Snap to right
    if (right < snapDistance) right = 0;
    // Snap to left
    if (viewportWidth - right - boxWidth < snapDistance) right = viewportWidth - boxWidth;
    // Snap to bottom
    if (bottom < snapDistance) bottom = 0;
    // Snap to top
    if (viewportHeight - bottom - boxHeight < snapDistance) bottom = viewportHeight - boxHeight;

    if(right) {
      this.box.nativeElement.style.right = `${right}px`;
    } else {
      this.box.nativeElement.style.removeProperty('right');
    }

    if(bottom) {
      this.box.nativeElement.style.bottom = `${bottom}px`;
    } else {
      this.box.nativeElement.style.removeProperty('bottom');
    }
  };

  onDragEnd = () => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };
}
