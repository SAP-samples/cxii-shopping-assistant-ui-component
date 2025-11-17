import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import {
  AssistantChatResponse,
  AssistantChatSessionInternal,
  AssistantNoSessionYetUserInput,
  AssistantUserInput,
} from '../models';

/** 
 * Can be overwritten from root, by default uses OCC implementation
 */
export abstract class CxaiAssistantApiService {
  abstract postMessage(payload: AssistantUserInput): Observable<AssistantChatResponse>;

  abstract getChatSession(sessionId: string): Observable<AssistantChatSessionInternal>;

  abstract createChatSession(configId: string): Observable<{ session_id: string }>;

  postMessageAndCreateSession(payload: AssistantNoSessionYetUserInput): Observable<{ session_id: string }> {
    return this.createChatSession(payload.config_id).pipe(
      switchMap((sessionResponse) => {
        return this.postMessage({
          session_id: sessionResponse.session_id,
          user_input: payload.user_input,
        }).pipe(
          map((chatResponse) => {
            return { session_id: chatResponse.session_id };
          })
        );
      })
    );
  }

  abstract deleteChatSession(sessionId: string): Observable<any>;
}
