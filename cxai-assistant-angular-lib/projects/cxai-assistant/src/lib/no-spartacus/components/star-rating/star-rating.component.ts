import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input
} from '@angular/core';
import { CxTranslatePipe } from '../../i18n/cx-translate.pipe';

/**
 * Star rating component can be used to view existing ratings as well
 * as create new ratings. The component can be used for any ratings.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'cx-star-rating',
  templateUrl: './star-rating.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CxTranslatePipe,
  ]
})
export class StarRatingComponent {
  protected initialRate = 0;

  @Input()
  @HostBinding('style.--star-fill')
  rating: number = this.initialRate;

}
