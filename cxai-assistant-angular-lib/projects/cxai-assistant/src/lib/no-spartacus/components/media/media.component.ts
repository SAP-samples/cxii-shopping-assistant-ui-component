/*
 * SPDX-FileCopyrightText: 2025 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges
} from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'cx-media',
  templateUrl: './media.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class MediaComponent implements OnChanges {
  @Input() container: { [imageFormat: string]: any } | undefined;

  /**
   * if a media format is given, a media for the given format will be rendered
   */
  @Input() format: string | undefined;

  /**
   * A specific alt text for an image, which overrules the alt text
   * from the container data.
   */
  @Input() alt: string | undefined;

  media: any;

  ngOnChanges(): void {
    const allImageFormats = (window as any).ACC?.spartacus?.imageFormats || ['thumbnail', 'product', 'zoom'];
    const imageFormatsInContainer = this.container ? Object.keys(this.container) : [];

    if(!this.container || imageFormatsInContainer.length === 0) {
      this.media = undefined;
      return;
    }

    let selectedMedia = this.container[allImageFormats[0]];

    if(this.format) {
      if(this.container[this.format]) {
        selectedMedia = this.container[this.format];
      } else {
        // find the closest matching format of higher quality
        const formatIndex = allImageFormats.indexOf(this.format);
        if(formatIndex >= 0) {
          for(let i = formatIndex + 1; i < allImageFormats.length; i++) {
            const nextFormat = allImageFormats[i];
            if(this.container[nextFormat]) {
              selectedMedia = this.container[nextFormat];
              break;
            }
          }
        }
      }
    }

    this.media = {
      src: selectedMedia?.url,
      alt: this.alt || selectedMedia?.altText,
      title: this.alt || selectedMedia?.altText,
    }
  }
}
