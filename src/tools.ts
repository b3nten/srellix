export const nextFrame = (callback: Function) =>
  requestAnimationFrame(() => setTimeout(() => callback()));
