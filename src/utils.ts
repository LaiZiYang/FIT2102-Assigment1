import { State, Action, TetrominoBLocks } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block } from "./main";

const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;

/** State processing */
/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
class tick implements Action {
    constructor(public readonly elapsed:number){}
    apply(s: Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }>): Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }> {
        return {
            ...s,
            tetromino: s.tetromino.map(b=> {
                return {
                    ...b,
                    y: b.y+1
                }
            })
        }
    }
}
// = (s: State) => {
//     return {
//         ...s,
//         tetromino: s.tetromino.map(b=> {
//             return {
//                 ...b,
//                 y: b.y+1
//             }
//         })
//     }
// };



class MoveLeft implements Action {
    constructor(public readonly changes:number) {}
    apply(s: Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }>): Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }> {
        const getLeftMostBlock = (tetromino: TetrominoBLocks[]) => tetromino.reduce((m, b) => b.x < m.x ? {...b} : {...m})
        const collidedLeft = () => getLeftMostBlock(s.tetromino).x == 0
        return {
            ...s,
            tetromino: s.tetromino.map(b=> {
                return {
                    ...b,
                    x: collidedLeft() ? b.x : (b.x+this.changes)
                }
            })
        }
    }
}

class MoveRight implements Action {
    constructor(public readonly changes:number) {}
    apply(s: Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }>): Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: number; x: number; y: number; }>[]; }> {
        const getRightmostBlock = (tetromino: TetrominoBLocks[]) => tetromino.reduce((m, b) => b.x > m.x ? {...b} : {...m})
        const collidedRight = () => getRightmostBlock(s.tetromino).x == 9
        return {
            ...s,
            tetromino: s.tetromino.map(b=> {
                return {
                    ...b,
                    x: collidedRight() ? b.x : (b.x+this.changes)
                }
            })
        }
    }
}

export {tick, MoveLeft, MoveRight}