/**
 * @framesquared/component – TemplateInterface
 *
 * Minimal interface satisfied by both Template and XTemplate.
 * Use this type in APIs that accept either engine.
 */

export interface TemplateInterface {
  apply(data: Record<string, unknown>): string;
}
