import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[querySwitchGroup]', standalone: true })
export class QuerySwitchGroupDirective {
  readonly template = inject(TemplateRef<unknown>);
}
