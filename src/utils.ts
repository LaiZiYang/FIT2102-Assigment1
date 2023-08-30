import { State, Action, TetrominoBLocks, Tetromino } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block, oTetromino } from "./main";

const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;

// helper function
const mergeMap = <T, U>(
    a: ReadonlyArray<T>,
    f: (a: T) => ReadonlyArray<U>
  ) => Array.prototype.concat(...a.map(f))

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

        // bottom bound collision verification
        const getBottomYCoordinate = () => s.tetromino.reduce((m, b) => b.y > m.y ? {...b} : {...m}).y
        const getAllBottomBlocks = () => s.tetromino.filter((b)=> b.y === getBottomYCoordinate())
        const collidedBottomBound = () => getAllBottomBlocks().filter(b=> b.y === 19).length > 0

        // block and block collision verification
        const allBottomAndPlacedBlocks = () => mergeMap(getAllBottomBlocks(), b=> s.placedTetromino.map(p => [b,p]))
        const collidedBlockWithBlock = () => allBottomAndPlacedBlocks().filter(t => t[0].y+1 === t[1].y && t[0].x == t[1].x).length > 0

        // determine if collision happen
        const collidedBottom = () => collidedBottomBound() || collidedBlockWithBlock()

        // fuction to create new Tetromino
        const createNewTetromino = (time: number): Tetromino => {
            return {...oTetromino, 
                    blocks: oTetromino.blocks.reduce((a: ReadonlyArray<TetrominoBLocks>,c:TetrominoBLocks) => a.concat([{...c, id: time + a.length}]), [])
                    }
        }

        // functions to handle row deletion
        const placedBlocks = () => collidedBottom() ? s.placedTetromino.concat(s.tetromino) : s.placedTetromino
        const rowsWithTetromino = () => placedBlocks().reduce((a: ReadonlyArray<number>,b:TetrominoBLocks) => a.includes(b.y) ? a : a.concat([b.y]), [])
        const rowsOfBlocksToBeChecked = () => rowsWithTetromino().map(r=> placedBlocks().filter(b=> b.y === r))
        
        // determine which rows to delete/remain
        const rowsToDelete = () => rowsOfBlocksToBeChecked().filter(a => a.length === 10).reduce((a, b) => a.concat(b), [])
        const rowsToRemain = () => rowsOfBlocksToBeChecked().filter(a => a.length < 10).reduce((a, b) => a.concat(b), [])

        // shift down rows above the deleted ones
        const updateBlocks = (a: TetrominoBLocks[],r: number, f: (n: TetrominoBLocks) => TetrominoBLocks) => a.map(b=> b.y < r ? f(b) : b)
        const getRowsNumberToDelete = () => rowsToDelete().reduce((a: ReadonlyArray<number>, b: TetrominoBLocks)=> a.includes(b.y) ? a : a.concat([b.y]), [])
        const fixedBlocks = () => rowsToDelete().length > 0 ? getRowsNumberToDelete().reduce((a,c) => updateBlocks(a, c, (b) => ({...b, y: b.y + 1})), rowsToRemain()) : rowsToRemain()
        
        
        // return new state
        return {
            ...s,
            tetromino: collidedBottom () || collidedBlockWithBlock() ? createNewTetromino(s.time).blocks : s.tetromino.map(b=> {
                return {
                    ...b,
                    y: collidedBottom() ? (b.y) : (b.y+1)
                }
            }), 
            time: this.elapsed,
            rowToDelete: rowsToDelete(),
            placedTetromino: fixedBlocks()
        }
    }
}



class MoveLeft implements Action {
    constructor(public readonly changes:number) {}
    apply(s: State): State {

        // left bound collision verification
        const getLeftMostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x < m.x ? {...b} : {...m})
        const collidedLeftBound = () => getLeftMostBlock(s.tetromino).x == 0
        
        // left block with block collision verification
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x-1 == t[1].x && t[0].y == t[1].y).length > 0
        const collidedLeft = () => collidedLeftBound() || collidedBlockWithBlock()
        
        // return new state
        return {
            ...s,
            tetromino: collidedLeft() ? s.tetromino : s.tetromino.map(b=> {
                return {
                    ...b,
                    x: b.x+this.changes
                }
            })
        }
    }
}

class MoveRight implements Action {
    constructor(public readonly changes:number) {}
    apply(s: State): State {

        // right bound collision verification
        const getRightmostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x > m.x ? {...b} : {...m})
        const collidedRightBound = () => getRightmostBlock(s.tetromino).x == 9

        // right block with block collision verification
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x+1 == t[1].x && t[0].y == t[1].y).length > 0
        const collidedRight = () => collidedRightBound() || collidedBlockWithBlock()
        
        // return new state
        return {
            ...s,
            tetromino: collidedRight() ? s.tetromino : s.tetromino.map(b=> {
                return {
                    ...b,
                    x: b.x+this.changes
                }
            })
        }
    }
}

export {tick, MoveLeft, MoveRight}