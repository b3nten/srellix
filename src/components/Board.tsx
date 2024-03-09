import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import * as board from "../application/board";
import { Popover } from "@kobalte/core";
import { BsPlus, BsThreeDotsVertical } from "solid-icons/bs";
import { RiEditorDraggable } from "solid-icons/ri";

export function Board() {}

export function Column(props: { id: board.ColumnId }) {
  return (
    <div class="w-full max-w-[300px] shrink-0">
      <div class="card card-side flex items-center bg-base-300 px-2 py-2 mb-2 space-x-1">
        <div>
          <RiEditorDraggable size={6} class="cursor-move" />
        </div>
        <input
          class="input input-ghost text-2xl font-bold w-full"
          value={"Column " + props.id}
        />
        <DeleteMenu delete={() => console.log("delete")} />
      </div>
      <div class="flex flex-col space-y-2">
        <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>
          {(i) => <Note id={i} />}
        </For>
      </div>
      <div class="py-2" />
      <AddNote />
    </div>
  );
}

const mocknotes: board.Note[] = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  column: 0,
  board: 0,
  title: `Note ${i}`,
  body: `This is note ${i}`,
}));

export function Note(props: { id: board.NoteId }) {
  const note = mocknotes[props.id];
  const [body, setBody] = createSignal(note.body);
  let input: HTMLTextAreaElement | undefined;
  return (
    <div class="card card-side px-1 py-2 w-full bg-base-200 text-lg flex justify-between items-center space-x-1">
      <div class="">
        <RiEditorDraggable size={6} class="cursor-move" />
      </div>
      <textarea
        class="textarea textarea-ghost text-lg w-full"
        ref={input}
        style={{
          resize: "none",
          height: body().split("\n").length * 2 + "rem",
        }}
        onInput={(e) => setBody(e.currentTarget.value)}
      >
        {body()}
      </textarea>
      <DeleteMenu delete={() => console.log("delete")} />
    </div>
  );
}

function AddNote() {
  const [active, setActive] = createSignal(false);
  return (
    <div class="w-full flex justify-center">
      <Switch>
        <Match when={active()}>
          <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full">
            <textarea class="textarea" placeholder="Add a Note" />
            <div class="space-x-2">
              <button class="btn btn-success">Add</button>
              <button class="btn btn-error" onClick={() => setActive(false)}>
                Cancel
              </button>
            </div>
          </div>
        </Match>
        <Match when={!active()}>
          <button class="btn btn-circle" onClick={() => setActive(true)}>
            <BsPlus size={10} />
          </button>
        </Match>
      </Switch>
    </div>
  );
}

function DeleteMenu(props: { delete?: Function }) {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <BsThreeDotsVertical />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content class="bg-base-300 p-1 rounded-md">
          <Popover.Description>
            <Popover.CloseButton>
              <button
                class="btn btn-error btn-sm"
                onClick={() => props.delete?.()}
              >
                Delete
              </button>
            </Popover.CloseButton>
          </Popover.Description>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
