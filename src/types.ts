/** User input */

export type Key = "KeyS" | "KeyA" | "KeyD";

export type Event = "keydown" | "keyup" | "keypress";

export type State = Readonly<{
  gameEnd: boolean;
  tetromino: TetrominoBLocks[]
}>;

export type TetrominoBLocks = Readonly<{
  id: string
  x: number
  y: number
}>

export interface Action {
  apply(s: State): State
}