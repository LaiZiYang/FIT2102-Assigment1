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
    apply(s: State): State {
        const getBottomBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.y > m.y ? {...b} : {...m})
        const getListOfBottomBlocks = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.filter((b)=> b.y === getBottomBlock(s.tetromino).y)
        const collidedBottom = () => getListOfBottomBlocks(s.tetromino).filter(b=> b.y === 19).length > 0
        return {
            ...s,
            tetromino: s.tetromino.map(b=> {
                return {
                    ...b,
                    y: collidedBottom() ? (b.y) : (b.y+1),
                    placedTetromino: collidedBottom() ? s.placedTetromino.concat(s.tetromino) : s.placedTetromino
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
    apply(s: State): State {
        const getLeftMostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x < m.x ? {...b} : {...m})
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
    apply(s: State): State {
        const getRightmostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x > m.x ? {...b} : {...m})
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