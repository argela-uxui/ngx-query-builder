import { Routes } from '@angular/router';
import { NAV_ITEMS } from './navigation';

export const routes: Routes = [
  ...NAV_ITEMS.map((item) => ({
    path: item.path,
    pathMatch: 'full' as const,
    loadComponent: item.loadComponent,
    title: `${item.label} · ngx-query-builder`,
  })),
  { path: '**', redirectTo: '' },
];
