import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title block shown at the top of every demo route. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      @if (eyebrow()) {
        <p class="page-header__eyebrow">{{ eyebrow() }}</p>
      }
      <h1 class="page-header__title">{{ title() }}</h1>
      @if (description()) {
        <p class="page-header__desc">{{ description() }}</p>
      }
      @if (apis().length) {
        <ul class="page-header__apis" aria-label="APIs used on this page">
          @for (api of apis(); track api) {
            <li class="chip">{{ api }}</li>
          }
        </ul>
      }
    </header>
  `,
  styles: `
    .page-header { margin-bottom: 24px; }
    .page-header__eyebrow {
      margin-bottom: 6px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      color: var(--primary);
    }
    .page-header__title { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
    .page-header__desc { max-width: 760px; margin-top: 8px; color: var(--text-muted); font-size: 15px; }
    .page-header__apis { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly description = input<string>('');
  readonly apis = input<readonly string[]>([]);
}
