import { Constants } from "./main";

/** User input */

export type Key = "KeyS" | "KeyA" | "KeyD";

export type Event = "keydown" | "keyup" | "keypress";

export type State = Readonly<{
  time: number;
  gameEnd: boolean;
  tetromino: ReadonlyArray<TetrominoBLocks>
  placedTetromino: ReadonlyArray<TetrominoBLocks>
  currentBoard: ReadonlyArray<ReadonlyArray<number>>
  rowToDelete: ReadonlyArray<TetrominoBLocks>
}>;

export type TetrominoBLocks = Readonly<{
  id: number
  x: number
  y: number
}>

export interface Action {
  apply(s: State): State
}