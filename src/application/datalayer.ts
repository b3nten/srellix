interface DataLayer {
    createBoard: (title: string) => BoardId,
    updateBoard: (id: BoardId, title: string) => void,
    deleteBoard: (id: BoardId) => void,
    createColumn: (board: BoardId, title: string) => ColumnId,
    updateColumn: (id: ColumnId, title: string) => void,
    deleteColumn: (id: ColumnId) => void,
    createNote: (column: ColumnId, title: string, body: string) => NoteId,
    updateNote: (id: NoteId, title: string, body: string) => void,
    deleteNote: (id: NoteId) => void,
}