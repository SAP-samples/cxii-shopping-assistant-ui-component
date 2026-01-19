import { Injectable } from '@angular/core';
import { ILoggerService } from '@cx-spartacus/cxai-ask-product/root';

@Injectable({
  providedIn: 'root'
})
export class WcLoggerService extends ILoggerService {
  override info(marker: string, ...args: any[]): void {
    console.info(marker, ...args);
  }

  override warn(marker: string, ...args: any[]): void {
    console.warn(marker, ...args);
  }

  override error(marker: string, ...args: any[]): void {
    console.error(marker, ...args);
  }

  override debug(marker: string, ...args: any[]): void {
    console.debug(marker, ...args);
  }
}
