import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Exposes a FormControl's value as a signal that notifies on *every* emission.
 * The query builder mutates the RuleSet in place and re-emits the same object
 * reference, so the default `Object.is` equality would swallow those changes.
 * Must be called in an injection context.
 */
export function trackControlValue<T>(control: AbstractControl<T>): Signal<T> {
  const value = signal<T>(control.value, { equal: () => false });
  const subscription = control.valueChanges.subscribe((next) => value.set(next));
  inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  return value.asReadonly();
}

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
