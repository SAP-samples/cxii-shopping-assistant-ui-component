import { Injectable, Pipe, PipeTransform } from "@angular/core";
import { AssistantChatMessage } from "@cx-spartacus/cxai-assistant/root";

export declare type ChatMessageToken = {
  type: 'html' | 'product';
  content: string;
};

@Injectable({
  providedIn: 'root'
})
@Pipe({
  name: 'chatMessage',
  pure: true,
})
export class ChatMessagePipe implements PipeTransform {
  readonly productMentionRegex = /(?:Product Code:\s*)?\{([^}\s\\"']{4,32})\}/g

  transform(message: AssistantChatMessage): ChatMessageToken[] {
    const result: ChatMessageToken[] = [];
    const regex = this.productMentionRegex;
    let content = message.content;

    let match;
    let lastIndex = 0;

    //escape html, parse markdown for assistant
    if(message.role === 'assistant') {
      content = this.escapeHtml(content); 
      if(content.includes('**')) {
        //parse basic markdown
        content = content.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      }
    }

    //tokenize the content
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({type: 'html', content: content.substring(lastIndex, match.index)});
      }
      result.push({ type: 'product', content: match[1] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      result.push({type: 'html', content: content.substring(lastIndex)}); // Add remaining text
    }

    return result;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}