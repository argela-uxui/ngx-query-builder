import { Directive, inject, TemplateRef } from '@angular/core';

@Directive({ selector: '[queryRemoveButton]', standalone: true })
export class QueryRemoveButtonDirective {
  readonly template = inject(TemplateRef<unknown>);
}
