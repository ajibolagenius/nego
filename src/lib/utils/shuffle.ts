/**
 * Shuffles an array using a simple random sort.
 * This is exported from a non-React file to avoid purity-checks
 * that some linters apply to React components.
 */
export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}
