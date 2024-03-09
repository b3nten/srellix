import { createEffect, For } from "solid-js";
import { createApplication } from "~/application";

type Nullable<T> = T | null | undefined | false | void;

type NoteID = number;
type ColumnID = number;
type BoardID = number;

type Note = {
  name: string;
  id: number;
  parent: Nullable<number>;
};

type Column = {
  name: string;
  id: ColumnID;
  items: NoteID[];
};

type Board = {
  id: BoardID;
  columns: Array<{
    index: number;
    column: Column;
  }>;
};

type BoardStore = {
  notes: Note[];
  columns: Array<{
    index: number;
    column: Column;
  }>;
  currentDragItem: Nullable<NoteID> | Nullable<ColumnID>
  currentDragTarget: Nullable<ColumnID>;
};

const [board, update] = createApplication<BoardStore>({
  notes: [
    { name: "draggable 1", id: 1, parent: 1 },
    { name: "draggable 2", id: 2, parent: 1 },
    { name: "draggable 3", id: 3, parent: 2 },
  ],
  columns: [
    { name: "target 1", id: 1, items: [1, 2] },
    { name: "target 2", id: 2, items: [3] },
    { name: "target 3", id: 3, items: [] },
  ],
  currentDragItem: null,
  activeTarget: null,
});

function moveItem(item: number, target: number) {
  update((state) => {
    // we need to update the current target, new target, and dragged item
    const currentTarget = state.columns.find((t) => t.items.includes(item));
    const newTarget = state.columns.find((t) => t.id === target);
    if (currentTarget && newTarget) {
      currentTarget.items = currentTarget.items.filter((i) => i !== item);
      newTarget.items = [...newTarget.items, item];
    }
    const draggedItem = state.notes.find((d) => d.id === item);
    if (draggedItem) {
      draggedItem.parent = target;
    }
  });
}

createEffect(() => {
  console.log("current drag item", board.currentDragItem);
  console.log("active target", board.activeTarget);
  console.log(board.columns);
});

const Draggable = (props: { id: number }) => {
  const onDragStart = (e: DragEvent) => {
    update((state) => {
      state.currentDragItem = props.id;
    });
  };
  const onDragEnd = (e: DragEvent) => {
    update((state) => {
      state.currentDragItem = null;
    });
  };
  return (
    <div
      class="bg-blue-200 rounded-md p-4"
      draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {board.notes.find((d) => d.id === props.id)?.name}
    </div>
  );
};

const Target = (props: { id: number }) => {
  const t = () => board.columns.find((t) => t.id === props.id);
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    update((state) => {
      state.activeTarget = props.id;
    });
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    update((state) => {
      state.activeTarget = null;
    });
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (board.currentDragItem) {
      moveItem(board.currentDragItem, props.id);
    }
    update((state) => {
      state.activeTarget = null;
      state.currentDragItem = null;
    });
  };
  return (
    <div
      class="bg-orange-200 rounded-md p-4 flex flex-col space-y-2"
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {t()?.name}
      <For each={t()?.items}>
        {(item) => <Draggable id={item} />}
      </For>
    </div>
  );
};

export default function Home() {
  return (
    <main>
      <div class="flex space-x-4">
        <For each={board.columns}>
          {(target) => <Target id={target.id} />}
        </For>
      </div>
    </main>
  );
}
