import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { version as libraryVersion } from '../../../projects/ngx-query-builder/package.json';
import { NAV_GROUPS } from './navigation';
import { IconComponent } from './shared/icon.component';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly theme = inject(ThemeService);
  readonly navGroups = NAV_GROUPS;
  readonly version = libraryVersion;
  readonly repoUrl = 'https://github.com/argela-uxui/ngx-query-builder';
  readonly navOpen = signal(false);

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }
}
