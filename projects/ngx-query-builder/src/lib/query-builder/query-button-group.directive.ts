import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryButtonGroup]', standalone: true })
export class QueryButtonGroupDirective {
  readonly template = inject(TemplateRef<unknown>);
}
