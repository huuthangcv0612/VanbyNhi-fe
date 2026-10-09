/**
 * Ghép các classnames có điều kiện một cách an toàn và gọn gàng
 */
export function cn(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ');
}
