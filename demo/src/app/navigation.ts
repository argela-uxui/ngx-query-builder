import { Type } from '@angular/core';
import { IconName } from './shared/icon.component';

export interface DemoNavItem {
  /** Route path (without leading slash). Empty string = playground. */
  path: string;
  /** Stable id used for `data-testid="nav-<slug>"`. */
  slug: string;
  label: string;
  icon: IconName;
  loadComponent: () => Promise<Type<unknown>>;
}

export interface DemoNavGroup {
  label: string;
  items: DemoNavItem[];
}

export const NAV_GROUPS: DemoNavGroup[] = [
  {
    label: 'Getting started',
    items: [
      {
        path: '', slug: 'playground', label: 'Playground', icon: 'play',
        loadComponent: () => import('./playground/playground.component').then((m) => m.PlaygroundComponent),
      },
      {
        path: 'examples/basic', slug: 'basic', label: 'Basic usage', icon: 'box',
        loadComponent: () => import('./examples/basic.component').then((m) => m.BasicExampleComponent),
      },
      {
        path: 'examples/field-types', slug: 'field-types', label: 'Field types', icon: 'type',
        loadComponent: () => import('./examples/field-types.component').then((m) => m.FieldTypesExampleComponent),
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        path: 'examples/entities', slug: 'entities', label: 'Entities', icon: 'layers',
        loadComponent: () => import('./examples/entities.component').then((m) => m.EntitiesExampleComponent),
      },
      {
        path: 'examples/operators', slug: 'operators', label: 'Operators', icon: 'sliders',
        loadComponent: () => import('./examples/operators.component').then((m) => m.OperatorsExampleComponent),
      },
      {
        path: 'examples/validation', slug: 'validation', label: 'Validation', icon: 'shield',
        loadComponent: () => import('./examples/validation.component').then((m) => m.ValidationExampleComponent),
      },
      {
        path: 'examples/callbacks', slug: 'callbacks', label: 'Config callbacks', icon: 'zap',
        loadComponent: () => import('./examples/callbacks.component').then((m) => m.CallbacksExampleComponent),
      },
    ],
  },
  {
    label: 'Customization',
    items: [
      {
        path: 'examples/custom-templates', slug: 'custom-templates', label: 'Custom templates', icon: 'layout',
        loadComponent: () => import('./examples/custom-templates.component').then((m) => m.CustomTemplatesExampleComponent),
      },
      {
        path: 'examples/styling', slug: 'styling', label: 'Styling & themes', icon: 'droplet',
        loadComponent: () => import('./examples/styling.component').then((m) => m.StylingExampleComponent),
      },
      {
        path: 'examples/localization', slug: 'localization', label: 'Localization', icon: 'globe',
        loadComponent: () => import('./examples/localization.component').then((m) => m.LocalizationExampleComponent),
      },
    ],
  },
  {
    label: 'Interaction',
    items: [
      {
        path: 'examples/nested', slug: 'nested', label: 'Nested & collapse', icon: 'branch',
        loadComponent: () => import('./examples/nested.component').then((m) => m.NestedExampleComponent),
      },
      {
        path: 'examples/drag-drop', slug: 'drag-drop', label: 'Drag & drop', icon: 'move',
        loadComponent: () => import('./examples/drag-drop.component').then((m) => m.DragDropExampleComponent),
      },
      {
        path: 'examples/disabled', slug: 'disabled', label: 'Disabled & import', icon: 'lock',
        loadComponent: () => import('./examples/disabled.component').then((m) => m.DisabledExampleComponent),
      },
    ],
  },
  {
    label: 'Integration',
    items: [
      {
        path: 'examples/query-conversion', slug: 'query-conversion', label: 'Query conversion', icon: 'database',
        loadComponent: () => import('./examples/query-conversion.component').then((m) => m.QueryConversionExampleComponent),
      },
    ],
  },
];

export const NAV_ITEMS: DemoNavItem[] = NAV_GROUPS.flatMap((group) => group.items);
