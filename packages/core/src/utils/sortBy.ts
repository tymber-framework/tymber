export function sortBy<T>(array: T[], field: keyof T, field2?: keyof T): T[] {
  return array.sort((a, b) => {
    if (a[field] === b[field] && field2) {
      return a[field2] < b[field2] ? -1 : 1;
    }
    return a[field] < b[field] ? -1 : 1;
  });
}
