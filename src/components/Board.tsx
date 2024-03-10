import {
  For,
  Match,
  Switch,
  batch,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import { Action, useAction, useSubmissions } from "@solidjs/router";
import { Popover } from "@kobalte/core";
import { BsPlus, BsThreeDotsVertical } from "solid-icons/bs";
import { RiEditorDraggable } from "solid-icons/ri";
import { createStore, reconcile } from "solid-js/store";

export type ID = string;
export type Order = number;

export type Note = {
  id: ID;
  board: ID;
  column: ID;
  order: Order;
  body: string;
};

export type Column = {
  id: ID;
  board: ID;
  title: string;
  order: Order;
};

export type Board = {
  id: ID;
  title: string;
};

export type BoardData = {
  board: Board;
  columns: Column[];
  notes: Note[];
};

export type Actions = {
  createColumn: Action<
    [id: ID, board: ID, title: string, timestamp: number],
    boolean
  >;
  renameColumn: Action<[id: ID, title: string, timestamp: number], boolean>;
  moveColumn: Action<[column: ID, order: Order], void>;
  deleteColumn: Action<[id: ID, timestamp: number], boolean>;
  createNote: Action<
    [
      {
        id: ID;
        board: ID;
        column: ID;
        body: string;
        order: Order;
        timestamp: number;
      }
    ],
    boolean
  >;
  editNote: Action<[id: ID, content: string, timestamp: number], boolean>;
  moveNote: Action<
    [note: ID, column: ID, order: number, timestamp: number],
    boolean
  >;
  deleteNote: Action<[id: ID, timestamp: number], boolean>;
};

const BoardContext = createContext<
  | {
      board: Board;
      columns: Column[];
      notes: Note[];
      actions: Actions;
    }
  | undefined
>();

const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error("No context provided");
  return context;
};

export function Board(props: { board: BoardData; actions: Actions }) {
  const [boardStore, setBoardStore] = createStore({
    board: props.board.board,
    columns: props.board.columns,
    notes: props.board.notes,
    actions: props.actions,
  });

  const createNoteSubmission = useSubmissions(props.actions.createNote);
  const createColumnSubmission = useSubmissions(props.actions.createColumn);
  const renameColumnSubmission = useSubmissions(props.actions.renameColumn);
  const deleteColumnSubmission = useSubmissions(props.actions.deleteColumn);
  const editNoteSubmission = useSubmissions(props.actions.editNote);
  const moveNoteSubmission = useSubmissions(props.actions.moveNote);
  const deleteNoteSubmission = useSubmissions(props.actions.deleteNote);

  createEffect(() => {
    const mutations: any[] = [];

    for (const note of createNoteSubmission.values()) {
      if (!note.pending) continue;
      const [{ id, column, body, order, timestamp }] = note.input;
      mutations.push({
        type: "createNote",
        id,
        column,
        body,
        order,
        timestamp,
      });
    }

    for (const note of deleteNoteSubmission.values()) {
      if (!note.pending) continue;
      const [id, timestamp] = note.input;
      mutations.push({
        type: "deleteNote",
        id,
        timestamp,
      });
    }

    for(const note of moveNoteSubmission.values()) {
      if (!note.pending) continue;
      const [id, column, order, timestamp] = note.input;
      mutations.push({
        type: "moveNote",
        id,
        column,
        order,
        timestamp,
      });
    }

    const newNotes = [...props.board.notes];
    const newColumns = [...props.board.columns];
    const newBoard = Object.assign({}, props.board.board);

    for (const mut of mutations.sort((a, b) => a.timestamp - b.timestamp)) {
      switch (mut.type) {
        case "createNote": {
          newNotes.push({
            id: mut.id,
            column: mut.column,
            body: mut.body,
            order: mut.order,
            board: props.board.board.id,
          });
          break;
        }
        case "deleteNote": {
          const index = newNotes.findIndex((n) => n.id === mut.id);
          if (index === -1) break;
          newNotes.splice(index, 1);
          break;
        }
        case "moveNote": {
          const index = newNotes.findIndex((n) => n.id === mut.id);
          if (index === -1) break;
          newNotes[index].column = mut.column;
          newNotes[index].order = mut.order;
          break;
        }
      }
    }

    console.log("newNotes", newNotes, "mutations", mutations);

    batch(() => {
      setBoardStore("notes", newNotes);
      setBoardStore("columns", newColumns);
      setBoardStore("board", newBoard);
    });
  });

  return (
    <BoardContext.Provider value={boardStore}>
      <div class="min-w-full overflow-scroll min-h-screen p-12 flex flex-start items-start space-x-12 flex-nowrap">
        <For each={boardStore.columns}>
          {(column) => <Column column={column} />}
        </For>
        <AddColumn board={props.board.board.id} />
      </div>
    </BoardContext.Provider>
  );
}

function Column(props: { column: Column }) {
  const ctx = useBoard();

  const renameAction = useAction(ctx.actions.renameColumn);
  const deleteAction = useAction(ctx.actions.deleteColumn);
  const moveNoteAction = useAction(ctx.actions.moveNote);

  const [acceptDrop, setAcceptDrop] = createSignal(false);

  const filteredNotes = createMemo(() =>
    ctx.notes.filter((n) => n.column === props.column.id)
  );

  return (
    <div
      class="w-full max-w-[300px] shrink-0 rounded-lg"
      style={{
        border: acceptDrop() ? "2px solid red" : "none",
      }}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        setAcceptDrop(true);
      }}
      onDragExit={(e) => setAcceptDrop(false)}
      onDrop={(e) => {
        e.preventDefault();
        const noteId = e.dataTransfer?.getData("text/plain");

        if (noteId) {
          moveNoteAction(
            noteId,
            props.column.id,
            ctx.notes.length + 1,
            new Date().getTime()
          );
        }

        setAcceptDrop(false);
      }}
    >
      <div class="card card-side flex items-center bg-base-300 px-2 py-2 mb-2 space-x-1">
        <div>
          <RiEditorDraggable size={6} class="cursor-move" />
        </div>
        <input
          class="input input-ghost text-2xl font-bold w-full"
          value={props.column.title}
          onInput={(e) =>
            renameAction(props.column.id, e.target.value, new Date().getTime())
          }
        />
        <NoteMenu
          delete={() => deleteAction(props.column.id, new Date().getTime())}
        />
      </div>
      <div class="flex flex-col space-y-2">
        <For each={filteredNotes()}>
          {(n) => <Note note={n} previous={1} next={1} />}
        </For>
      </div>
      <div class="py-2" />
      <AddNote column={props.column.id} length={ctx.notes.length} />
    </div>
  );
}

function Note(props: { note: Note; previous: number; next: number }) {
  const { actions } = useBoard();

  const updateAction = useAction(actions.editNote);
  const deleteAction = useAction(actions.deleteNote);
  const moveNoteAction = useAction(actions.moveNote);

  let input: HTMLTextAreaElement | undefined;

  const [isBeingDragged, setIsBeingDragged] = createSignal(false);

  const [acceptDrop, setAcceptDrop] = createSignal<"top" | "bottom" | false>(
    false
  );

  return (
    <div
      style={{
        opacity: isBeingDragged() ? 0.25 : 1,
        "border-top": acceptDrop() === "top" ? "2px solid red" : "none",
        "border-bottom": acceptDrop() === "bottom" ? "2px solid red" : "none",
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
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = (rect.top + rect.bottom) / 2;
        const isTop = e.clientY < midpoint;

        setAcceptDrop(isTop ? "top" : "bottom");
      }}
      onDragExit={(e) => {
        setAcceptDrop(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const noteId = e.dataTransfer?.getData("text/plain");
        if (noteId) {
          // using fractional order to avoid conflicts
          const droppedOrder =
            acceptDrop() === "top" ? props.previous : props.next;
          const order = (droppedOrder + props.note.order) / 2;

          moveNoteAction(
            noteId,
            props.note.column,
            order,
            new Date().getTime()
          );
        }

        setAcceptDrop(false);
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
          updateAction(
            props.note.id,
            (e.target as HTMLTextAreaElement).value,
            new Date().getTime()
          )
        }
      >
        {`${props.note.body} @ ${props.note.order}, before: ${props.previous}, after: ${props.next}`}
      </textarea>
      <NoteMenu
        delete={() => deleteAction(props.note.id, new Date().getTime())}
      />
    </div>
  );
}

function AddNote(props: { column: ID; length: number }) {
  const { actions } = useBoard();
  const [active, setActive] = createSignal(false);
  const addNote = useAction(actions.createNote);
  let inputRef: HTMLTextAreaElement | undefined;
  return (
    <div class="w-full flex justify-center">
      <Switch>
        <Match when={active()}>
          <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full">
            <textarea
              ref={(el) => {
                inputRef = el;
                setTimeout(() => requestAnimationFrame(() => void el.focus()));
              }}
              class="textarea"
              placeholder="Add a Note"
            />
            <div class="space-x-2">
              <button
                class="btn btn-success"
                onClick={() => {
                  addNote({
                    id: crypto.randomUUID(),
                    board: "board",
                    column: props.column,
                    body: inputRef?.value ?? "Note",
                    order: props.length + 1,
                    timestamp: new Date().getTime(),
                  });
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

function AddColumn(props: { board: ID }) {
  const { actions } = useBoard();

  const [active, setActive] = createSignal(false);

  const addColumn = useAction(actions.createColumn);

  let inputRef: HTMLInputElement | undefined;

  return (
    <Switch>
      <Match when={active()}>
        <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full max-w-[300px]">
          <input
            ref={(el) => {
              (inputRef = el),
                setTimeout(() => requestAnimationFrame(() => el.focus()));
            }}
            class="input"
            placeholder="Add a Column"
          />
          <div class="space-x-2">
            <button
              onClick={() => (
                addColumn(
                  crypto.randomUUID(),
                  props.board,
                  inputRef?.value ?? "Column",
                  new Date().getTime()
                ),
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
