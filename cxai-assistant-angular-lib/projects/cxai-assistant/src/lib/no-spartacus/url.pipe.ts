import { Pipe, PipeTransform } from "@angular/core";

/**
 * CxUrl pipe used in no-Spartacus / Accelerator setup
 * It uses ACC.spartacus.urls mapping to build URLs
 */
@Pipe({
  name: 'cxUrl',
  standalone: true,
})
export class CxUrlPipe implements PipeTransform {
  private readonly urls = window?.ACC?.spartacus?.urls ?? {};
  private readonly contextPath = window?.ACC?.config?.encodedContextPath;

  transform(commands: any): any[] {
    let url = this.urls[commands.cxRoute];
    if(url) {
      if(this.contextPath && url.startsWith('/') && !url.startsWith(this.contextPath)) {
        url = this.contextPath + url;
      }

      //TODO: if needed in future replace ${} inside url (e.g. ${code})
      return commands.params?.code ? [url, commands.params.code] : [url];
    }

    return ['#' + commands.cxRoute];
  }
}
