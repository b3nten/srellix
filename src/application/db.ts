import { JSONFilePreset } from "lowdb/node";
import { BoardData } from "~/components/Board";

const mock: BoardData = {
  board: {
    id: 0,
    title: "Board 0",
  },
  columns: Array.from({ length: 3 }, (_, i) => ({
    id: i,
    board: 0,
    title: `Column ${i}`,
    order: i,
  })),
  notes: Array.from({ length: 10 }, (_, i) => ({
    id: i,
    board: 0,
    column: 0,
    order: i,
    body: `Note ${i}`,
  })),
};

export const db = await JSONFilePreset('db.json', mock)