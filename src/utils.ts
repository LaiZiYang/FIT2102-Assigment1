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
        const mergeMap = <T, U>(
            a: ReadonlyArray<T>,
            f: (a: T) => ReadonlyArray<U>
          ) => Array.prototype.concat(...a.map(f))
        const  not = <T>(f:(x:T)=>boolean)=>(x:T)=>!f(x)
        // search for a body by id in an array
        const elem = (a:ReadonlyArray<TetrominoBLocks>) => (e:TetrominoBLocks) => a.findIndex(b=>b.id === e.id) >= 0
        // array a except anything in b
        const except = (a:ReadonlyArray<TetrominoBLocks>) => (b:ReadonlyArray<TetrominoBLocks>) => a.filter(not(elem(b)))
        const getBottomBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.y > m.y ? {...b} : {...m})
        const getAllBottomBlocks = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.filter((b)=> b.y === getBottomBlock(s.tetromino).y)
        const collidedBottom = () => getAllBottomBlocks(s.tetromino).filter(b=> b.y === 19).length > 0
        const allBottomAndPlacedBlocks = () => mergeMap(getAllBottomBlocks(s.tetromino), b=> s.placedTetromino.map(p => [b,p]))
        const allBlocks = () => s.tetromino.concat(s.placedTetromino)
        const collidedBlockWithBlock = () => allBottomAndPlacedBlocks().filter(t => t[0].y+1 === t[1].y && t[0].x == t[1].x).length > 0
        const createNewTetromino = (time: number) => {
            return [
                {...initialTetromino[0], id: time}, {...initialTetromino[1], id: time+1}, {...initialTetromino[2], id: time+2}, {...initialTetromino[3], id: time+3}
            ]
        }
        const affectedRow = () => collidedBlockWithBlock() || collidedBottom() ? s.tetromino.reduce((a: ReadonlyArray<number>, b: TetrominoBLocks):ReadonlyArray<number> => a.includes(b.y) ? a : a.concat([b.y]), []) : []
        // const allBlocksInAffectedRow = () => mergeMap(affectedRow(), r => allBlocks().filter(b => b.y === r))
        const allBlocksInAffectedRow = () => affectedRow().map(r => allBlocks().filter(b=> b.y === r))
        const rowToDelete = () => allBlocksInAffectedRow().filter(a => a.length === 10).map(d => d[0].y)
        const blockToBeDeleted = () => allBlocks().filter(b=> rowToDelete().includes(b.y)) 
        return {
            ...s,
            tetromino: !collidedBottom () ? (collidedBlockWithBlock() ? createNewTetromino(s.time) : s.tetromino.map(b=> {
                return {
                    ...b,
                    y: collidedBottom() ? (b.y) : (b.y+1)
                }
            })) : createNewTetromino(s.time),
            time: s.time + 1,
            placedTetromino: (collidedBottom() || collidedBlockWithBlock()) ? except(s.placedTetromino)(s.rowToDelete).concat(s.tetromino) : except(s.placedTetromino)(blockToBeDeleted()),
            rowToDelete: blockToBeDeleted()
        }
    }
}



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