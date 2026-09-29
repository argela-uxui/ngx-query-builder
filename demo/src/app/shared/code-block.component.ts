import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { IconComponent } from './icon.component';

/** Read-only code viewer with a language label and copy-to-clipboard action. */
@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="code">
      <div class="code__bar">
        <span class="code__lang">{{ language() }}</span>
        <button type="button" class="code__copy" (click)="copy()" [attr.aria-label]="'Copy ' + language() + ' code'">
          <app-icon [name]="copied() ? 'check' : 'copy'" [size]="13" />
          {{ copied() ? 'Copied' : copyFailed() ? 'Copy unavailable' : 'Copy' }}
        </button>
      </div>
      <pre class="code__pre" [style.max-height]="maxHeight()" [attr.data-testid]="testId() ?? null">{{ code() }}</pre>
    </div>
  `,
  styles: `
    .code { border-radius: var(--radius); overflow: hidden; background: var(--code-bg); border: 1px solid var(--border); }
    .code__bar {
      display: flex; align-items: center; justify-content: space-between; padding: 6px 8px 6px 14px;
      background: var(--code-bar); border-bottom: 1px solid rgb(255 255 255 / 6%);
    }
    .code__lang { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; }
    .code__copy {
      display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border: 0; border-radius: 5px;
      background: transparent; color: #cbd5e1; font: inherit; font-size: 12px; cursor: pointer;
    }
    .code__copy:hover { background: rgb(255 255 255 / 8%); }
    .code__pre {
      margin: 0; padding: 14px 16px; overflow: auto; color: var(--code-text);
      font-size: 12.5px; line-height: 1.6; tab-size: 2; white-space: pre;
    }
  `,
})
export class CodeBlockComponent {
  readonly code = input.required<string>();
  readonly language = input<string>('text');
  readonly testId = input<string>();
  readonly maxHeight = input<string>('360px');

  readonly copied = signal(false);
  readonly copyFailed = signal(false);

  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resetTimer));
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      this.copyFailed.set(false);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 1500);
    } catch {
      this.copyFailed.set(true);
    }
  }
}
