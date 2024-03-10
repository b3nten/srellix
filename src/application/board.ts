export type Order = number;
export type NoteId = number;
export type ColumnId = number;
export type BoardId = number;

export type Note = {
    id: NoteId,
    board: BoardId,
    column: ColumnId,
    order: Order,
    body: string,
}

export type Column = {
    id: ColumnId,
    board: BoardId,
    title: string,
    order: Order,
}

export type Board = {
    id: BoardId,
    title: string,
}

export enum Actions {
    createBoard,
    updateBoard,
    deleteBoard,

    createColumn,
    updateColumn,
    deleteColumn,

    createNote,
    updateNote,
    deleteNote,
}

export interface Action {
    type: Actions,
    timestamp: number,
    payload: unknown
}

export interface BoardAction {
    type: Actions.createBoard | Actions.updateBoard | Actions.deleteBoard,
    payload: Board,
}

export interface ColumnAction extends Action {
    type: Actions.createColumn | Actions.updateColumn | Actions.deleteColumn,
    payload: Column,
}

export interface NoteAction extends Action {
    type: Actions.createNote | Actions.updateNote | Actions.deleteNote,
    payload: Note,
}