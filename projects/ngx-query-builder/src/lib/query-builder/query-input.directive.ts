import { Directive, Input, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryInput]', standalone: true })
export class QueryInputDirective {
  readonly template = inject(TemplateRef<unknown>);

  /** Unique name for query input type. */
  @Input()
  get queryInputType(): string { return this._type; }
  set queryInputType(value: string) {
    // If the directive is set without a type (updated programmatically), then this setter will
    // trigger with an empty string and should not overwrite the programmatically set value.
    if (!value) { return; }
    this._type = value;
  }
  private _type = '';
}
