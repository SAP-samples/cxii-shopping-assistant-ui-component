import { AssistantChatMessage, ChatMessageToken } from "@cx-spartacus/cxai-assistant/root";
import { ChatMessagePipe } from "./chat-message.pipe";
import { TestBed } from "@angular/core/testing";

const testAssistantMessage: AssistantChatMessage = {
  role: 'assistant',
  content: 'Here are some **fantastic** white sneakers Product Code: {BR3089}, <script>{BR1021WHI} that will elevate your style and comfort! ' +
  'Order {order_id}, you can track using {tracking_id1} or {tracking_id2} or {tracking_id3}',
  tokens: {
    order: ['order_id'],
    tracking_id: ['tracking_id1', 'tracking_id2'],
  }
}

const testUserMessage: AssistantChatMessage = {
  ...testAssistantMessage,
  role: 'user',
}

const expectedAssistantTokens: ChatMessageToken[] = [
  { type: 'html', content: 'Here are some <b>fantastic</b> white sneakers ' },
  { type: 'product', content: 'BR3089' },
  { type: 'html', content: ', &lt;script&gt;' },
  { type: 'product', content: 'BR1021WHI' },
  { type: 'html', content: ' that will elevate your style and comfort! Order ' },
  { type: 'order', content: testAssistantMessage.tokens!.order![0] },
  { type: 'html', content: ', you can track using ' },
  { type: 'tracking_id', content: testAssistantMessage.tokens!.tracking_id![0] },
  { type: 'html', content: ' or ' },
  { type: 'tracking_id', content: testAssistantMessage.tokens!.tracking_id![1] },
  { type: 'html', content: ' or ' },
  //fallback for product for unknown tokens
  { type: 'product', content: 'tracking_id3' },
];

const expectedUserTokens: ChatMessageToken[] = [
  //ignore markdown
  { type: 'html', content: 'Here are some **fantastic** white sneakers ' },
  { type: 'product', content: 'BR3089' },
  //for user we don't escape html because [innerHtml] should not be used
  { type: 'html', content: ', <script>' },
  { type: 'product', content: 'BR1021WHI' },
  { type: 'html', content: ' that will elevate your style and comfort! Order ' },
  { type: 'order', content: testAssistantMessage.tokens!.order![0] },
  { type: 'html', content: ', you can track using ' },
  { type: 'tracking_id', content: testAssistantMessage.tokens!.tracking_id![0] },
  { type: 'html', content: ' or ' },
  { type: 'tracking_id', content: testAssistantMessage.tokens!.tracking_id![1] },
  { type: 'html', content: ' or ' },
  //fallback for product for unknown tokens
  { type: 'product', content: 'tracking_id3' },
];

//test for chat-message.pipe.ts
describe('ChatMessagePipe', () => {
  let pipe: ChatMessagePipe;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ChatMessagePipe],
    });
    pipe = TestBed.inject(ChatMessagePipe);
  });

  it('should parse assistant message', () => {
    const testMessageCopy = Object.assign({}, testAssistantMessage);
    const result = pipe.transform(testMessageCopy);
    //should not modify the original message
    expect(testMessageCopy).toEqual(testAssistantMessage);
    expect(result).toEqual(expectedAssistantTokens);
  });

  it('should parse user message', () => {
    const testMessageCopy = Object.assign({}, testUserMessage);
    const result = pipe.transform(testMessageCopy);
    expect(testMessageCopy).toEqual(testUserMessage);
    expect(result).toEqual(expectedUserTokens);
  });

});

