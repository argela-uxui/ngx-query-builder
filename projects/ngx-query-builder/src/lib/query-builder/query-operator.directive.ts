import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryOperator]', standalone: true })
export class QueryOperatorDirective {
  readonly template = inject(TemplateRef<unknown>);
}
