/*
 * SPDX-FileCopyrightText: 2025 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { Product } from '@cx-spartacus/cxai-ask-product/root';

@Injectable({ providedIn: 'root' })
export class ProductImageNormalizer {
  private baseUrl!: string;
  public setUpService(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  convert(source: any, target?: Product): Product {
    if (target === undefined) {
      target = { ...(source as any) } as Product;
    }
    if (source.images) {
      target.images = this.normalize(source.images);
    }
    return target;
  }

  /**
   * @desc
   * Creates the image structure we'd like to have. Instead of
   * having a single list with all images despite type and format
   * we create a proper structure. With that we can do:
   * - images.primary.thumnail.url
   * - images.GALLERY[0].thumnail.url
   */
  normalize(source: /*Occ.Image*/any[]): /*Images*/ any {
    const images = {};
    if (source) {
      for (const image of source) {
        const isList = this.hasGalleryIndex(image);
        if (image.imageType) {
          if (!Object.prototype.hasOwnProperty.call(images, image.imageType)) {
            images[image.imageType] = isList ? [] : {};
          }

          const imageContainer: /*ImageGroup*/ any = this.getImageContainer(
            isList,
            images,
            image
          );

          const targetImage = { ...image };
          targetImage.url = this.normalizeImageUrl(targetImage.url ?? '');
          if (image.format) {
            imageContainer[image.format] = targetImage;
          }
        }
      }
    }
    return images;
  }

  protected getImageContainer(
    isList: boolean,
    images: /*Images*/ any,
    image: /*Occ.Image*/ any
  ) {
    if (isList) {
      const imageGroups = this.getImageGroups(images, image);
      return imageGroups[image.galleryIndex as number];
    } else {
      return images[image.imageType] as /*ImageGroup*/ any;
    }
  }

  protected getImageGroups(images: /*Images*/ any, image: /*Occ.Image*/ any) {
    const imageGroups = images[image.imageType] as /*ImageGroup*/ any[];
    if (!imageGroups[image.galleryIndex as number]) {
      imageGroups[image.galleryIndex as number] = {};
    }
    return imageGroups;
  }

  /**
   * Traditionally, in an on-prem world, medias and other backend related calls
   * are hosted at the same platform, but in a cloud setup, applications are are
   * typically distributed cross different environments. For media, we use the
   * `backend.media.baseUrl` by default, but fallback to `backend.occ.baseUrl`
   * if none provided.
   */
  private normalizeImageUrl(url: string): string {
    if (new RegExp(/^(http|data:image|\/\/)/i).test(url)) {
      return url;
    }
    return (
      (this.baseUrl ?? '') + url
    );
  }

  private hasGalleryIndex(image: /*Occ.Image*/ any) {
    const galleryIndex = image.galleryIndex ?? false;
    return galleryIndex !== false;
  }
}
