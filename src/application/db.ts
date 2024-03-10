import { JSONFilePreset } from "lowdb/node";
import { Board, Column, Note } from "./board";

export type BoardData = {
  board: Board;
  columns: Column[];
  notes: Note[];
};

const mock: BoardData = {
  board: {
    id: 0,
    title: "Board 0",
  },
  columns: [],
  notes: [],
};

export const db = await JSONFilePreset('db.json', mock)