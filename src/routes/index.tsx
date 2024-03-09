import { BsPlus } from "solid-icons/bs";
import { Column, Note } from "../components/Board";
import { Match, Switch, createSignal } from "solid-js";

export default function Page() {
  return (
    <div class="min-w-full overflow-scroll min-h-screen p-12 flex flex-start items-start space-x-12 flex-nowrap">
      <Column id={0} />
      <Column id={1} />
      <Column id={2} />
      <AddColumn />
    </div>
  );
}

function AddColumn() {
  const [active, setActive] = createSignal(false);
  return (
    <Switch>
      <Match when={active()}>
        <div class="flex flex-col space-y-2 card bg-base-200 p-2 w-full max-w-[300px]">
          <input class="input" placeholder="Add a Column" />
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
  );
}
