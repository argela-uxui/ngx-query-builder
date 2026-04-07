import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryEntity]', standalone: true })
export class QueryEntityDirective {
  readonly template = inject(TemplateRef<unknown>);
}
