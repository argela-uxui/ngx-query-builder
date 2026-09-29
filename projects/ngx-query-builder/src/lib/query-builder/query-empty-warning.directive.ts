import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryEmptyWarning]', standalone: true })
export class QueryEmptyWarningDirective {
  readonly template = inject(TemplateRef<unknown>);
}
