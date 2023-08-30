import { State, Action, TetrominoBLocks, Tetromino } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block, oTetromino, initialState, TetrominoList } from "./main";

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
        const nextTetromino = (id: number) => ({...TetrominoList.reduce((r, t) => t.tetrominoId === id ? t : r)})
        const createNewTetromino = (time: number, id: number): Tetromino => {
            return {...nextTetromino(id), blocks: nextTetromino(id).blocks.reduce((a: ReadonlyArray<TetrominoBLocks>,c:TetrominoBLocks) => a.concat([{...c, id: time + a.length}]), [])}
            return {...oTetromino, 
                    blocks: oTetromino.blocks.reduce((a: ReadonlyArray<TetrominoBLocks>,c:TetrominoBLocks) => a.concat([{...c, id: time + a.length}]), [])
                    }
        }

        // functions to handle row deletion
        const placedBlocks = () => collidedBottom() ? s.placedTetromino.concat(s.tetromino) : s.placedTetromino
        const rowsWithTetromino = () => placedBlocks().reduce((a: ReadonlyArray<number>,b:TetrominoBLocks) => a.includes(b.y) ? a : a.concat([b.y]), [])
        const rowsOfBlocksToBeChecked = () => rowsWithTetromino().map(r=> placedBlocks().filter(b=> b.y === r))
        
        // determine which rows to delete/remain
        const blocksToDelete = () => rowsOfBlocksToBeChecked().filter(a => a.length === 10).reduce((a, b) => a.concat(b), [])
        const blocksToRemain = () => rowsOfBlocksToBeChecked().filter(a => a.length < 10).reduce((a, b) => a.concat(b), [])

        // shift down rows above the deleted ones
        const updateBlocks = (a: TetrominoBLocks[],r: number, f: (n: TetrominoBLocks) => TetrominoBLocks) => a.map(b=> b.y < r ? f(b) : b)
        const getRowsNumberToDelete = () => blocksToDelete().reduce((a: ReadonlyArray<number>, b: TetrominoBLocks)=> a.includes(b.y) ? a : a.concat([b.y]), [])
        const fixedBlocks = () => blocksToDelete().length > 0 ? getRowsNumberToDelete().reduce((a,c) => updateBlocks(a, c, (b) => ({...b, y: b.y + 1})), blocksToRemain()) : blocksToRemain()
        
        // game end logic
        const getTopYCoordinate = () => s.placedTetromino.reduce((m, b) => b.y <= m.y ? {...b} : {...m}).y
        const collidedTop = () => s.placedTetromino.length > 0 ? getTopYCoordinate() === -1 : false
        const gameEnd = () => collidedTop() || s.gameEnd
        const evaluateHighScore = () => s.score > s.highScore ? s.score : s.highScore

        const generateTetrominoId = () => Math.floor(RNG.scale(RNG.hash(s.seed)))
        
        // return new state
        return {
            ...s,
            gameEnd: gameEnd(), 
            tetromino: (collidedBottom () || collidedBlockWithBlock()) && !s.gameEnd ? createNewTetromino(s.time, generateTetrominoId()).blocks : s.tetromino.map(b=> {
                return {
                    ...b,
                    y: collidedBottom() ? (b.y) : (b.y+1)
                }
            }), 
            time: this.elapsed,
            rowToDelete: blocksToDelete(),
            placedTetromino: fixedBlocks(), 
            score: gameEnd() ? s.score : s.score + blocksToDelete().length,
            highScore: evaluateHighScore(),
            seed: RNG.hash(s.seed)
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

    class Restart implements Action {
        constructor() {}
        apply(s: State):State {
            return {
                ...initialState,
                rowToDelete: s.tetromino.concat(s.placedTetromino),
                highScore: s.highScore
            }
        }
    }

    abstract class RNG {
        private static m = 0x80000000; // 2**31
        private static a = 1103515245;
        private static c = 12345;
      
        /**
         * Call `hash` repeatedly to generate the sequence of hashes.
         * @param seed
         * @returns a hash of the seed
         */
        public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;
      
        /**
         * Takes hash value and scales it to the range [-1, 1]
         */
        public static scale = (hash: number) => ((hash) / (RNG.m - 1)) * 5 + 1.5;
      }

export {tick, MoveLeft, MoveRight, Restart, RNG}