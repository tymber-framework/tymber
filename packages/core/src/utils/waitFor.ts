export function waitFor(target: EventTarget, type: string) {
  return new Promise((resolve) => {
    target.addEventListener(type, resolve, { once: true });
  });
}
