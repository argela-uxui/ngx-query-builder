import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let nextToggleId = 0;

/**
 * Accessible switch built on a native checkbox (role="switch").
 * The native input stays in the layout (transparent, stretched over the track)
 * so Playwright's `check()` / `toBeVisible()` keep working on `testId`.
 */
@Component({
  selector: 'app-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="toggle" [class.toggle--disabled]="disabled()">
      <span class="toggle__track" [class.toggle__track--on]="checked()">
        <input
          type="checkbox"
          role="switch"
          class="toggle__input"
          [checked]="checked()"
          [disabled]="disabled()"
          [attr.aria-checked]="checked()"
          [attr.data-testid]="testId() ?? null"
          [attr.aria-describedby]="hint() ? hintId : null"
          (change)="onChange($event)" />
        <span class="toggle__thumb"></span>
      </span>
      <span class="toggle__text">
        <span class="toggle__label">{{ label() }}</span>
        @if (hint()) {
          <span class="toggle__hint" [id]="hintId">{{ hint() }}</span>
        }
      </span>
    </label>
  `,
  styles: `
    .toggle { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none; }
    .toggle--disabled { cursor: not-allowed; opacity: .6; }
    .toggle__track {
      position: relative; flex-shrink: 0; width: 34px; height: 20px; margin-top: 1px;
      border-radius: 999px; background: var(--border-strong); transition: background-color .15s;
    }
    .toggle__track--on { background: var(--primary); }
    .toggle__input {
      position: absolute; inset: 0; width: 100%; height: 100%; margin: 0;
      opacity: 0; cursor: inherit; z-index: 1;
    }
    .toggle__thumb {
      position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
      background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / 30%); transition: transform .15s;
    }
    .toggle__track--on .toggle__thumb { transform: translateX(14px); }
    .toggle__track:has(.toggle__input:focus-visible) { box-shadow: var(--focus-ring); }
    .toggle__text { display: flex; flex-direction: column; min-width: 0; }
    .toggle__label { font-weight: 500; color: var(--text); }
    .toggle__hint { font-size: 12px; color: var(--text-subtle); }
  `,
})
export class ToggleComponent {
  readonly checked = model<boolean>(false);
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly testId = input<string>();
  readonly disabled = input<boolean>(false);

  readonly hintId = `app-toggle-hint-${nextToggleId++}`;

  onChange(event: Event): void {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
