import { Constants } from "./main";

/** User input */

export type Key = "KeyS" | "KeyA" | "KeyD" | "KeyW";

export type Event = "keydown" | "keyup" | "keypress";

export type State = Readonly<{
  time: number;
  gameEnd: boolean;
  tetromino: Tetromino
  placedTetromino: ReadonlyArray<TetrominoBLocks>
  rowToDelete: ReadonlyArray<TetrominoBLocks>
  score: number
  highScore: number
  seed: number
}>;

export type TetrominoBLocks = Readonly<{
  id: number
  x: number
  y: number
  fill: string
}>

export type Tetromino = Readonly<{
  tetrominoId: number
  blocks: ReadonlyArray<TetrominoBLocks>
  pivot: Readonly<{pivotX: number, pivotY: number}>
}>

export interface Action {
  apply(s: State): State
}