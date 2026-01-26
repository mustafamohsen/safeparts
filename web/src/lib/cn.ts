export type ClassValue = string | undefined | null | false

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
