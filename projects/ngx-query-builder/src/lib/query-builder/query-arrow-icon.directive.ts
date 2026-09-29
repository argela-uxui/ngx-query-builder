import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryArrowIcon]', standalone: true })
export class QueryArrowIconDirective {
  readonly template = inject(TemplateRef<unknown>);
}
