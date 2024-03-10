import {
  RouteDefinition,
  createAsync,
  createAsyncStore,
} from "@solidjs/router";
import { Accessor, Show } from "solid-js";
import { Board, fetchBoard } from "~/components/Board";

export const route: RouteDefinition = {
  load: () => fetchBoard(0),
};

export default function Page() {
  const board = createAsyncStore(() => fetchBoard(0));
  return (
    <Show when={board()}>
      {/* @ts-ignore ts doesn't understand <Show /> */}
      <Board board={board} />
    </Show>
  );
}
