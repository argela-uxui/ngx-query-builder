import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryField]', standalone: true })
export class QueryFieldDirective {
  readonly template = inject(TemplateRef<unknown>);
}
