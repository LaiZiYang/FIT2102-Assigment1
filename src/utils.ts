import { State, Action, TetrominoBLocks } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block, initialTetromino } from "./main";

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
        const not = <T>(f:(x:T)=>boolean)=>(x:T)=>!f(x)
        // search for a body by id in an array
        const elem = (a:ReadonlyArray<TetrominoBLocks>) => (e:TetrominoBLocks) => a.findIndex(b=>b.id === e.id) >= 0
        // array a except anything in b
        const except = (a:ReadonlyArray<TetrominoBLocks>) => (b:ReadonlyArray<TetrominoBLocks>) => a.filter(not(elem(b)))
        const mergeMap = <T, U>(
            a: ReadonlyArray<T>,
            f: (a: T) => ReadonlyArray<U>
          ) => Array.prototype.concat(...a.map(f))
        const getBottomBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.y > m.y ? {...b} : {...m})
        const getAllBottomBlocks = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.filter((b)=> b.y === getBottomBlock(s.tetromino).y)
        const collidedBottom = () => getAllBottomBlocks(s.tetromino).filter(b=> b.y === 19).length > 0
        const allBottomAndPlacedBlocks = () => mergeMap(getAllBottomBlocks(s.tetromino), b=> s.placedTetromino.map(p => [b,p]))
        const collidedBlockWithBlock = () => allBottomAndPlacedBlocks().filter(t => t[0].y+1 === t[1].y && t[0].x == t[1].x).length > 0
        const createNewTetromino = (time: number) => {
            return [
                {...initialTetromino[0], id: time}, {...initialTetromino[1], id: time+1}, {...initialTetromino[2], id: time+2}, {...initialTetromino[3], id: time+3}
            ]
        }
        const placedBlock = () => collidedBlockWithBlock() || collidedBottom() ? s.placedTetromino.concat(s.tetromino) : s.placedTetromino
        const rowsWithTetromino = () => placedBlock().reduce((a: ReadonlyArray<number>,b:TetrominoBLocks) => a.includes(b.y) ? a : a.concat([b.y]), [])
        const affectedBlocks = () => rowsWithTetromino().map(r=> placedBlock().filter(b=> b.y === r))
        const rowsToDelete = () => affectedBlocks().filter(a => a.length === 10).reduce((a, b) => a.concat(b), [])
        const rowsToRemain = () => affectedBlocks().filter(a => a.length < 10).reduce((a, b) => a.concat(b), [])
        const getBlocksInRow = (r: number) => placedBlock().filter(b => b.y === r)
        const getBlocksInRowAbove = (c: TetrominoBLocks[],r: number) => c.filter(b => b.y < r)
        const getRowsNumberToDelete = () => rowsToDelete().reduce((a: ReadonlyArray<number>, b: TetrominoBLocks)=> a.includes(b.y) ? a : a.concat([b.y]), [])
        const shiftRowsDown = () => rowsToDelete().length > 0 ? getRowsNumberToDelete().reduce((a,c) => getBlocksInRowAbove(a, c).map(b=> ({...b, y: b.y + 1})), [...rowsToRemain()]) : rowsToRemain()
        // getRowsNumberToDelete().map(r=> getBlocksInRowAbove(r).map(b => ({...b, y: b.y+1}))).reduce((a,b)=> a.concat(b), [])
        // const affectedBlocks = () => affectedRow().map(r=> placedBlock().filter(b=> b.y === r))
        // const blocksToDelete = () => affectedBlocks().filter(s => s.length === 10)
        // const setOfBlocksToDelete = () => blocksToDelete().reduce((a,c) => a.concat(c), [])
        // const finalPlacedBlock = () => placedBlock().filter(b=> !(setOfBlocksToDelete().includes(b)))
        // const updateBoard = (board: ReadonlyArray<ReadonlyArray<number>>) => {
        //     const newBoard = [...board].reduce((a,c)=> , 0)
        // }
        return {
            ...s,
            tetromino: !collidedBottom () ? (collidedBlockWithBlock() ? createNewTetromino(s.time) : s.tetromino.map(b=> {
                return {
                    ...b,
                    y: collidedBottom() ? (b.y) : (b.y+1)
                }
            })) : createNewTetromino(this.elapsed),
            time: this.elapsed,
            rowToDelete: rowsToDelete(),
            placedTetromino: shiftRowsDown()
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
        const mergeMap = <T, U>(
            a: ReadonlyArray<T>,
            f: (a: T) => ReadonlyArray<U>
          ) => Array.prototype.concat(...a.map(f))
        const getLeftMostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x < m.x ? {...b} : {...m})
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x-1 == t[1].x && t[0].y == t[1].y).length > 0
        const collidedLeft = () => getLeftMostBlock(s.tetromino).x == 0
        return {
            ...s,
            tetromino: collidedBlockWithBlock() ? s.tetromino : s.tetromino.map(b=> {
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
        const mergeMap = <T, U>(
            a: ReadonlyArray<T>,
            f: (a: T) => ReadonlyArray<U>
          ) => Array.prototype.concat(...a.map(f))
        const getRightmostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x > m.x ? {...b} : {...m})
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x+1 == t[1].x && t[0].y == t[1].y).length > 0
        const collidedRight = () => getRightmostBlock(s.tetromino).x == 9
        return {
            ...s,
            tetromino: collidedBlockWithBlock() ? s.tetromino : s.tetromino.map(b=> {
                return {
                    ...b,
                    x: collidedRight() ? b.x : (b.x+this.changes)
                }
            })
        }
    }
}

export {tick, MoveLeft, MoveRight}