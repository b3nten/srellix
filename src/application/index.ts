import { createStore, produce, } from "solid-js/store";
import { splitProps } from "solid-js";

const [App, _update] = createStore({});

const update = (fn: (state: typeof App) => void) =>
  _update(
    produce((state) => void fn(state)),
  );

export const state = App;
export const actions = {};

export function createApplication<
  S extends Omit<object, "update">,
>(
  initial: S,
) {
  const [state, _update] = createStore(initial);
  const update = (fn: (state: S) => void) =>
    _update(
      produce((state) => void fn(state)),
    )
  return [state, update] as const;
}