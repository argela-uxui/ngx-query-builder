import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Field, QueryBuilderComponent, QueryBuilderConfig, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { toReadableText } from '../shared/query-format';

const TS_CODE = `const orderTotal: Field = { name: 'Order total', type: 'number', entity: 'order' };

config: QueryBuilderConfig = {
  entities: {
    customer: { name: 'Customer' },
    order: { name: 'Order', defaultField: orderTotal },   // field picked when switching to "Order"
    product: { name: 'Product' },                          // falls back to the first product field
  },
  fields: {
    customerName: { name: 'Name', type: 'string', entity: 'customer' },
    segment:      { name: 'Segment', type: 'category', entity: 'customer', options: [...] },
    orderDate:    { name: 'Order date', type: 'date', entity: 'order' },
    orderTotal,
    sku:          { name: 'SKU', type: 'string', entity: 'product' },
    ...
  },
};`;

@Component({
  selector: 'app-entities-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Configuration" title="Entities"
      description="Group fields by entity. An entity selector appears in each rule and the field list is filtered to the selected entity. Use defaultField to control which field is picked when the entity changes."
      [apis]="['QueryBuilderConfig.entities', 'Entity.defaultField', 'Field.entity', 'Rule.entity']" />

    <app-demo-card heading="Customers, orders & products" description="Switch a rule's entity — the field list and default field follow."
      [tabs]="tabs()">
      <div data-testid="example-builder">
        <query-builder [formControl]="queryCtrl" [config]="config" />
      </div>
    </app-demo-card>
  `,
})
export class EntitiesExampleComponent {
  private readonly orderTotal: Field = { name: 'Order total', type: 'number', entity: 'order' };

  readonly config: QueryBuilderConfig = {
    entities: {
      customer: { name: 'Customer' },
      order: { name: 'Order', defaultField: this.orderTotal },
      product: { name: 'Product' },
    },
    fields: {
      customerName: { name: 'Name', type: 'string', entity: 'customer' },
      segment: {
        name: 'Segment',
        type: 'category',
        entity: 'customer',
        options: [
          { name: 'Enterprise', value: 'enterprise' },
          { name: 'SMB', value: 'smb' },
          { name: 'Consumer', value: 'consumer' },
        ],
      },
      vip: { name: 'VIP', type: 'boolean', entity: 'customer' },
      orderDate: { name: 'Order date', type: 'date', entity: 'order' },
      orderTotal: this.orderTotal,
      sku: { name: 'SKU', type: 'string', entity: 'product' },
      stock: { name: 'Stock', type: 'number', entity: 'product' },
    },
  };

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { entity: 'customer', field: 'segment', operator: '=', value: 'enterprise' },
        { entity: 'order', field: 'orderTotal', operator: '>=', value: 1000 },
        {
          condition: 'or',
          rules: [
            { entity: 'product', field: 'sku', operator: 'like', value: 'PRO-%' },
            { entity: 'customer', field: 'vip', operator: '=', value: true },
          ],
        },
      ],
    },
    { nonNullable: true },
  );
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    { id: 'text', label: 'Readable', language: 'text', code: toReadableText(this.value(), this.config) },
    { id: 'ts', label: 'Config', language: 'typescript', code: TS_CODE },
  ]);
}
