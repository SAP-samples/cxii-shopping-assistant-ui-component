import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, ReplaySubject, takeUntil } from 'rxjs';
import { CxaiAssistantRootService } from '../../cxai-assistant.root.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'lib-assistant-chat-float',
  templateUrl: './assistant-chat-float.component.html',
  styleUrls: [
    './assistant-chat-float.component.scss',
    '../_common-variables.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('showHide', [
      state(
        'hidden',
        style({
          transform: 'translateX(100%)',
        })
      ),
      state(
        'shown',
        style({
          transform: 'translateX(0%)',
        })
      ),
      transition('hidden <=> shown', [animate('.3s ease-in')]),
    ]),
  ],
  standalone: false,
})
export class AssistantChatFloatComponent implements OnInit {
  buttonState = 'hidden';
  cxaiAssistantRootService = inject(CxaiAssistantRootService);
  loadChat$ = new ReplaySubject<boolean>(1);
  useSapIcons = this.cxaiAssistantRootService.useSapIcons;
  chatOpened$ = this.cxaiAssistantRootService.getChatOpenedStatus();
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    //trigger loading of lazy chunk once somebody requests to open chat window (see template @if)
    this.cxaiAssistantRootService.chatOpenRequest$
      .pipe(
        takeUntilDestroyed(),
        takeUntil(this.loadChat$),
        filter(Boolean)
      )
      .subscribe(() => {
        this.loadChat$.next(true);
      });
  }

  ngOnInit() {
    this.cxaiAssistantRootService.enableModule();
    setTimeout(() => {
      this.buttonState = 'shown';
      this.cdr.markForCheck();
    }, 2000);
  }

  openChat() {
    this.cxaiAssistantRootService.openChat();
  }
}
