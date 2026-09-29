import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CodeBlockComponent } from './code-block.component';

/** A code tab rendered beneath a demo card's live preview. */
export interface CodeTab {
  id: string;
  label: string;
  language: string;
  code: string;
  testId?: string;
}

let nextCardId = 0;

/**
 * Card wrapper for a live demo. Projects the preview as default content,
 * optional header actions via `[cardActions]`, and renders code tabs below.
 */
@Component({
  selector: 'app-demo-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <article class="card">
      @if (heading()) {
        <header class="card__header">
          <div class="card__heading">
            <h2 class="card__title">{{ heading() }}</h2>
            @if (description()) {
              <p class="card__desc">{{ description() }}</p>
            }
          </div>
          <div class="card__actions"><ng-content select="[cardActions]" /></div>
        </header>
      }
      <div class="card__body"><ng-content /></div>
      @if (tabs().length) {
        <div class="card__tabs" role="tablist" [attr.aria-label]="(heading() || 'Demo') + ' code'">
          @for (tab of tabs(); track tab.id) {
            <button
              type="button"
              role="tab"
              class="card__tab"
              [id]="cardId + '-tab-' + tab.id"
              [attr.aria-selected]="tab.id === activeTab()?.id"
              [attr.aria-controls]="cardId + '-panel'"
              [attr.tabindex]="tab.id === activeTab()?.id ? 0 : -1"
              [attr.data-testid]="'tab-' + tab.id"
              (click)="activeTabId.set(tab.id)"
              (keydown)="onTabKeydown($event)">
              {{ tab.label }}
            </button>
          }
        </div>
        @let current = activeTab();
        @if (current) {
          <div class="card__panel" role="tabpanel" [id]="cardId + '-panel'"
            [attr.aria-labelledby]="cardId + '-tab-' + current.id">
            <app-code-block [code]="current.code" [language]="current.language" [testId]="current.testId" />
          </div>
        }
      }
    </article>
  `,
  styles: `
    .card {
      border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface);
      box-shadow: var(--shadow); overflow: hidden;
    }
    .card__header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
    }
    .card__title { font-size: 15px; font-weight: 650; }
    .card__desc { margin-top: 2px; color: var(--text-muted); font-size: 13px; }
    .card__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .card__actions:empty { display: none; }
    .card__body { padding: 20px; }
    .card__tabs {
      display: flex; gap: 2px; padding: 0 12px; border-top: 1px solid var(--border);
      background: var(--surface-2); overflow-x: auto;
    }
    .card__tab {
      position: relative; height: 40px; padding: 0 12px; border: 0; background: transparent; color: var(--text-muted);
      font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap;
    }
    .card__tab:hover { color: var(--text); }
    .card__tab[aria-selected='true'] { color: var(--primary); }
    .card__tab[aria-selected='true']::after {
      content: ''; position: absolute; left: 8px; right: 8px; bottom: 0; height: 2px; border-radius: 2px;
      background: var(--primary);
    }
    .card__panel { padding: 0 12px 12px; background: var(--surface-2); }
  `,
})
export class DemoCardComponent {
  readonly heading = input<string>('');
  readonly description = input<string>('');
  readonly tabs = input<readonly CodeTab[]>([]);

  readonly cardId = `demo-card-${nextCardId++}`;
  readonly activeTabId = signal<string | null>(null);

  readonly activeTab = computed<CodeTab | undefined>(() => {
    const tabs = this.tabs();
    return tabs.find((tab) => tab.id === this.activeTabId()) ?? tabs[0];
  });

  /** Roving arrow-key navigation between tabs (WAI-ARIA tabs pattern). */
  onTabKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    const tabs = this.tabs();
    const index = tabs.findIndex((tab) => tab.id === this.activeTab()?.id);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    this.activeTabId.set(next.id);
    const button = (event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`#${this.cardId}-tab-${next.id}`);
    button?.focus();
    event.preventDefault();
  }
}
