import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title block shown at the top of every demo route. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__content">
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
      </div>
      <div class="page-header__actions">
        <ng-content select="[pageHeaderActions]" />
      </div>
    </header>
  `,
  styles: `
    :host { display: block; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px;
    }
    .page-header__content { flex: 1 1 auto; min-width: 0; }
    .page-header__actions { flex: 0 0 min(440px, 40%); min-width: 0; }
    .page-header__actions:empty { display: none; }
    .page-header__eyebrow {
      margin-bottom: 6px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      color: var(--primary);
    }
    .page-header__title { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
    .page-header__desc { max-width: 760px; margin-top: 8px; color: var(--text-muted); font-size: 15px; }
    .page-header__apis { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; }
    @media (max-width: 1050px) {
      .page-header { flex-direction: column; gap: 16px; }
      .page-header__actions { flex: 0 0 auto; width: 100%; }
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>('');
  readonly description = input<string>('');
  readonly apis = input<readonly string[]>([]);
}
