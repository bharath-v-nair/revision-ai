import { Component, input, computed } from '@angular/core';

/**
 * Circular avatar with initials fallback.
 * Shows the image when `url` is provided, otherwise a gradient circle with
 * up to two initials derived from `name`.
 */
@Component({
  selector: 'app-avatar',
  imports: [],
  template: `
    @if (url()) {
      <img [src]="url()" [class]="imgClass()" alt="" />
    } @else {
      <div [class]="fallbackClass()">{{ initials() }}</div>
    }
  `,
})
export class AvatarComponent {
  readonly url = input<string | null | undefined>(null);
  readonly name = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  private sizeBox = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 'w-10 h-10 text-xs';
      case 'lg':
        return 'w-14 h-14 text-lg';
      default:
        return 'w-11 h-11 text-sm';
    }
  });

  protected imgClass = computed(
    () => `${this.sizeBox()} rounded-full object-cover bg-gray-100 flex-shrink-0`,
  );

  protected fallbackClass = computed(
    () =>
      `${this.sizeBox()} rounded-full bg-gradient-to-br from-primary to-indigo-600 ` +
      'flex items-center justify-center text-white font-bold flex-shrink-0',
  );

  protected initials = computed(() => {
    const n = (this.name() ?? '').trim();
    if (!n) return '?';
    return (
      n
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || '?'
    );
  });
}
