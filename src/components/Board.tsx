import {
  Accessor,
  For,
  Match,
  Switch,
  createMemo,
  createSignal,
} from "solid-js";
import * as board from "../application/board";
import { Popover } from "@kobalte/core";
import { BsPlus, BsThreeDotsVertical } from "solid-icons/bs";
import { RiEditorDraggable } from "solid-icons/ri";
import { action, cache, useAction } from "@solidjs/router";
import { BoardData, db } from "~/application/db";

export const createColumn = action(
  async (board: board.BoardId, title: string) => {
    "use server";
    await db.read();
    db.data.columns.push({
      id: db.data.columns.length,
      board: board,
      title: title,
      order: db.data.columns.length,
    });
    await db.write();
    return true;
  }
);

export const renameColumn = action(async (id: number, title: string) => {
  "use server";
  const index = db.data.columns.findIndex((c) => c.id === id);
  db.data.columns[index].title = title;
  await db.write();
  return true;
});

export const moveColumn = action(
  async (column: board.Column, order: board.Order) => {}
);

export const deleteColumn = action(async (id: number) => {
  "use server";
  const index = db.data.columns.findIndex((c) => c.id === id);
  const deletedCol = db.data.columns.splice(index, 1);
  db.data.notes = db.data.notes.filter((n) => n.column !== deletedCol[0].id);
  await db.write();
  return true;
});

export const createNote = action(
  async (column: board.ColumnId, body: string, order: number) => {
    "use server";
    db.data.notes.push({
      id: db.data.notes.length,
      board: 0,
      column: column,
      order: order,
      body: body,
    });
    await db.write();
    return true;
  }
);

export const editNote = action(async (id: number, content: string) => {
  "use server";
  const index = db.data.notes.findIndex((n) => n.id === id);
  db.data.notes[index].body = content;
  await db.write();
  return true;
});

export const moveNote = action(
  async (note: number, column: number, order: number) => {
    "use server";
    const index = db.data.notes.findIndex((n) => n.id === note);
    db.data.notes[index].column = column;
    db.data.notes[index].order = order;
    await db.write();
    return true;
  }
);

export const deleteNote = action(async (id: number) => {
  "use server";
  const index = db.data.notes.findIndex((n) => n.id === id);
  db.data.notes.splice(index, 1);
  await db.write();
  return true;
});

export const fetchBoard = cache(async (id: board.BoardId) => {
  "use server";
  console.log("fetching board", id);
  return db.read().then(() => db.data);
}, "board");

export function Board(props: { board: Accessor<BoardData> }) {
  const columns = createMemo(() =>
    [...props.board().columns].sort((a, b) => a.order - b.order)
  );
  return (
    <div class="min-w-full overflow-scroll min-h-screen p-12 flex flex-start items-start space-x-12 flex-nowrap">
      <For each={columns()}>
        {(column) => <Column column={column} notes={props.board().notes} />}
      </For>
      <AddColumn board={props.board().board.id} />
    </div>
  );
}

function Column(props: { column: board.Column; notes: board.Note[] }) {
  const notes = createMemo(() =>
    props.notes.filter((n) => n.column === props.column.id).sort((a, b) => a.order - b.order)
  );
  const renameAction = useAction(renameColumn);
  const deleteAction = useAction(deleteColumn);
  const moveNoteAction = useAction(moveNote);
  return (
    <div
      class="w-full max-w-[300px] shrink-0"
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const noteId = e.dataTransfer?.getData("text/plain");
        if (noteId) {
          console.log("dropped", noteId, "on", props.column.title);
          moveNoteAction(
            parseInt(noteId),
            props.column.id,
            notes().length
          );
        }
      }}
    >
      <div class="card card-side flex items-center bg-base-300 px-2 py-2 mb-2 space-x-1">
        <div>
          <RiEditorDraggable size={6} class="cursor-move" />
        </div>
        <input
          class="input input-ghost text-2xl font-bold w-full"
          value={props.column.title}
          onInput={(e) => renameAction(props.column.id, e.target.value)}
        />
        <NoteMenu delete={() => deleteAction(props.column.id)} />
      </div>
      <div class="flex flex-col space-y-2">
        <For each={notes()}>{(n) => <Note note={n} />}</For>
      </div>
      <div class="py-2" />
      <AddNote column={props.column.id} length={notes.length} />
    </div>
  );
}

function Note(props: { note: board.Note }) {
  const updateAction = useAction(editNote);
  const deleteAction = useAction(deleteNote);
  const moveNoteAction = useAction(moveNote);
  let input: HTMLTextAreaElement | undefined;

  const [isBeingDragged, setIsBeingDragged] = createSignal(false);
  return (
    <div
      style={{
        opacity: isBeingDragged() ? .25 : 1,
      }}
      draggable="true"
      class="card card-side px-1 py-2 w-full bg-base-200 text-lg flex justify-between items-center space-x-1"
      onDragStart={(e) => {
        e.dataTransfer?.setData("text/plain", props.note.id.toString());
      }}
      onDrag={(e) => {
        setIsBeingDragged(true);
      }}
      onDragEnd={(e) => {
        setIsBeingDragged(false);
      }}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const noteId = e.dataTransfer?.getData("text/plain");
        if (noteId) {
          moveNoteAction(
            parseInt(noteId),
            props.note.column,
            props.note.order
          );
        }
      }}
    >
      <div>
        <RiEditorDraggable size={6} class="cursor-move" />
      </div>
      <textarea
        class="textarea textarea-ghost text-lg w-full"
        ref={input}
        style={{
          resize: "none",
        }}
        onInput={(e) =>
          updateAction(props.note.id, (e.target as HTMLTextAreaElement).value)
        }
      >
        {props.note.body}
      </textarea>
      <NoteMenu delete={() => deleteAction(props.note.id)} />
    </div>
  );
}

function AddNote(props: { column: board.ColumnId; length: number }) {
  const [active, setActive] = createSignal(false);
  const addNote = useAction(createNote);
  let inputRef: HTMLTextAreaElement | undefined;
  return (
    <div class="w-full flex justify-center">
      <Switch>
        <Match when={active()}>
          <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full">
            <textarea
              ref={inputRef}
              class="textarea"
              placeholder="Add a Note"
            />
            <div class="space-x-2">
              <button
                class="btn btn-success"
                onClick={() => {
                  addNote(props.column, inputRef?.value ?? "", props.length);
                  setActive(false);
                }}
              >
                Add
              </button>
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

function AddColumn(props: { board: board.BoardId }) {
  const [active, setActive] = createSignal(false);
  const addColumn = useAction(createColumn);

  let inputRef: HTMLInputElement | undefined;
  return (
    <Switch>
      <Match when={active()}>
        <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full max-w-[300px]">
          <input ref={inputRef} class="input" placeholder="Add a Column" />
          <div class="space-x-2">
            <button
              onClick={() => (
                addColumn(props.board, inputRef?.value ?? "Column"),
                setActive(false)
              )}
              class="btn btn-success"
            >
              Add
            </button>
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
  );
}

function NoteMenu(props: { delete?: Function }) {
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
