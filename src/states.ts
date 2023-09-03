import { State, Action, TetrominoBLocks, Tetromino } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block, oTetromino, initialState, TetrominoList, randomTetromino } from "./main";

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
        ////// get the bottom y-coordinate of the active tetromino, and use that coordinate to get all bottom blocks of the tetromino, 
        ////// and finally check if any of them hit the bottom boundary
        const getBottomYCoordinate = () => s.tetromino.blocks.reduce((m, b) => b.y > m.y ? {...b} : {...m}).y
        const getAllBottomBlocks = () => s.tetromino.blocks.filter((b)=> b.y === getBottomYCoordinate())
        const collidedBottomBound = () => getAllBottomBlocks().filter(b=> b.y === 19).length > 0

        // block and block collision verification
        ////// get an array of tuples of active and placed blocks, 
        ////// and compare the elements of the tuples for each tuple to determine if they collided with each other
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino.blocks, b=> s.placedTetromino.map(p => [b,p]))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].y+1 === t[1].y && t[0].x == t[1].x).length > 0

        // determine if collision happen
        const collidedBottom = () => collidedBottomBound() || collidedBlockWithBlock()

        // fuction to create new Tetromino
        ////// a function that generate random number from 1-6
        const generateTetrominoId = () => Math.floor(RNG.scale(RNG.hash(s.seed)))

        ////// return a tetromino by id
        const nextTetromino = (id: number) => ({...TetrominoList.reduce((r, t) => t.tetrominoId === id ? t : r)})

        ////// a function to create new tetromino, using time as id for each of the tetromino blocks.
        ////// - the id is times 10 to ensure that we do not create multiple blocks with the same id.
        ////// - the id is added with the length of the accumulated array to create unique id for each of the blocks
        const createNewTetromino = (time: number, id: number): Tetromino => {
            return {
                ...nextTetromino(id), 
                blocks: nextTetromino(id).blocks.reduce((a: ReadonlyArray<TetrominoBLocks>,c:TetrominoBLocks) => a.concat([{...c, id: time*10 + a.length}]), []) 
            }
        }

        // functions to handle row deletion

        //// function to get all blocks
        const placedBlocks = () => collidedBottom() ? s.placedTetromino.concat(s.tetromino.blocks) : s.placedTetromino
        //// function to get the rows number (y coordinate) that has tetromino
        const rowsWithTetromino = () => placedBlocks().reduce((a: ReadonlyArray<number>,b:TetrominoBLocks) => a.includes(b.y) ? a : 
                                                                                                                                a.concat([b.y]), [])
        //// function to get array of array of tetromino group by their y coordinate
        const rowsOfBlocksToBeChecked = () => rowsWithTetromino().map(r=> placedBlocks().filter(b=> b.y === r))
        
        //// functions to get all the blocks to delete/remain, by checking their length
        const blocksToDelete = () => rowsOfBlocksToBeChecked().filter(a => a.length === 10).reduce((a, b) => a.concat(b), [])
        const blocksToRemain = () => rowsOfBlocksToBeChecked().filter(a => a.length < 10).reduce((a, b) => a.concat(b), [])

        // shift down rows above the deleted ones
        
        //// a function that apply the input function to the tetromino blocks that is above input row number r
        const updateBlocks = (a: TetrominoBLocks[],r: number, f: (n: TetrominoBLocks) => TetrominoBLocks) => a.map(b=> b.y < r ? f(b) : b)

        //// get all the rows number (y coordinate) of the row to be deleted
        const getRowsNumberToDelete = () => blocksToDelete().reduce((a: ReadonlyArray<number>, b: TetrominoBLocks)=> a.includes(b.y) ? a : 
                                                                                                                     a.concat([b.y]), [])
        
        //// for each rows number to be deleted, shift the row above it down by 1, by callind the updateBlocks()
        const fixedBlocks = () => blocksToDelete().length > 0 ? getRowsNumberToDelete().reduce((a,c) => updateBlocks(a, c, (b) => ({...b, y: b.y + 1})), blocksToRemain()) : 
                                                                blocksToRemain()
        
        // game end logic
        //// get the top-most y coordinate of the placed blocks
        const getTopYCoordinate = () => s.tetromino.blocks.reduce((m, b) => b.y <= m.y ? {...b} : {...m}).y
        
        //// verify if the placed blocks has reach the top of the boundary
        const collidedTop = () => s.placedTetromino.length > 0 ? getTopYCoordinate() === -1 : false

        //// verify if game has ended, if it has ended in previous state, it also ended for next state
        const gameEnd = () => (collidedTop() || s.gameEnd) && collidedBottom()

        // highscore logic
        const evaluateHighScore = () => s.score > s.highScore ? s.score : s.highScore
        
        // return new state
        return {
            ...s,
            gameEnd: gameEnd(), 
            tetromino: (collidedBottom () || collidedBlockWithBlock()) && !s.gameEnd ? createNewTetromino(s.time, generateTetrominoId()) : 
                                                                                        ({
                                                                                            ...s.tetromino, 
                                                                                            blocks: s.tetromino.blocks.map(b=> {return {...b,y: collidedBottom() ? (b.y) : (b.y+1)}}), // update the y coordinate to make it fall for each tick
                                                                                            pivot: ({
                                                                                                ...s.tetromino.pivot, 
                                                                                                pivotY: s.tetromino.pivot.pivotY + 1 // we also have to update the pivot so that it always at the center of the tetromino
                                                                                            })
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

/**
 * Move the active tetromino left.
 *
 * @param s Current state
 * @returns Updated state
 */
class MoveLeft implements Action {
    constructor(public readonly changes:number) {}
    apply(s: State): State {

        // left bound collision verification
        //// get the leftmost block and verify if the coordinate has reach the leftmost limit
        const getLeftMostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x < m.x ? {...b} : {...m})
        const collidedLeftBound = () => getLeftMostBlock(s.tetromino.blocks).x == 0
        
        // left block with block collision verification
        //// make tuples from each of the active blocks with each of the placed blocks,
        //// check if any of them collided with each other on the left side
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino.blocks, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x-1 == t[1].x && t[0].y == t[1].y).length > 0

        // verify if collision happen
        const collidedLeft = () => collidedLeftBound() || collidedBlockWithBlock()
        
        // return new state
        return {
            ...s,
            tetromino: collidedLeft() ? s.tetromino : 
                                        {
                                            ...s.tetromino, 
                                            blocks: s.tetromino.blocks.map(b=> ({...b, x: b.x + this.changes})), 
                                            pivot: ({
                                                ...s.tetromino.pivot, 
                                                pivotX: s.tetromino.pivot.pivotX + this.changes
                                            })
                                        }
        }
    }
}

/**
 * Move the active tetromino right.
 *
 * @param s Current state
 * @returns Updated state
 */
class MoveRight implements Action {
    constructor(public readonly changes:number) {}
    apply(s: State): State {

        // right bound collision verification
        const getRightmostBlock = (tetromino: ReadonlyArray<TetrominoBLocks>) => tetromino.reduce((m, b) => b.x > m.x ? {...b} : {...m})
        const collidedRightBound = () => getRightmostBlock(s.tetromino.blocks).x == 9

        // right block with block collision verification
        const allActiveAndPlacedBlocks = () => mergeMap(s.tetromino.blocks, b=> s.placedTetromino.map((p=> [b,p])))
        const collidedBlockWithBlock = () => allActiveAndPlacedBlocks().filter(t => t[0].x+1 == t[1].x && t[0].y == t[1].y).length > 0
        const collidedRight = () => collidedRightBound() || collidedBlockWithBlock()
        
        // return new state
        return {
            ...s,
            tetromino: collidedRight() ? s.tetromino : 
                                        {
                                            ...s.tetromino, 
                                            blocks: s.tetromino.blocks.map(b=> ({...b, x: b.x + this.changes})), 
                                            pivot: ({
                                                ...s.tetromino.pivot, 
                                                pivotX: s.tetromino.pivot.pivotX + this.changes
                                            })
                                        }
        }
    }
}

/**
 * refresh the state.
 *
 * @param s Current state
 * @returns Updated state
 */
class Restart implements Action {
    constructor() {}
    apply(s: State):State {
        // return the initial state, but
        // - all previous tetromino blocks is added to the rowToDelete, to tell the svg to remove all the blocks from canvas
        // - retain the highscore
        // - create a new random tetromino for the new state
        return {
            ...initialState,
            rowToDelete: s.tetromino.blocks.concat(s.placedTetromino),
            highScore: s.highScore,
            tetromino: randomTetromino(new Date().getMilliseconds())
        }
    }
}

/**
 * Rotate the active tetromino 90 degree to the right.
 *
 * @param s Current state
 * @returns Updated state
 */
class Rotate implements Action {
    constructor () {}

    apply(s: State):State {

        // a function that use rotation matrix to calculate the new coordinate after rotation
        // reference: this function is referenced from https://tgdwyer.github.io/asteroids/
        //// - x and y is minus by their respective pivot to get the relative coordinate to the pivot.
        //// - it was then added back by their pivot to get back to their coordinate on the canvas
        const getNewCoordinate = (deg:number, tetrominoBlock: TetrominoBLocks) =>
        (rad =>(
            (cos,sin,{x,y})=> ({...tetrominoBlock, x: ((x-s.tetromino.pivot.pivotX)*cos - (y-s.tetromino.pivot.pivotY)*sin) + s.tetromino.pivot.pivotX, 
                                                    y: ((x-s.tetromino.pivot.pivotX)*sin + (y-s.tetromino.pivot.pivotY)*cos) + s.tetromino.pivot.pivotY})
            )(Math.cos(rad), Math.sin(rad), tetrominoBlock)
        )(Math.PI * deg / 180)
        
        // function that apply the rotation matrix onto each blocks
        const updateCoordinate = () => ({...s.tetromino, blocks: s.tetromino.blocks.map(b=> getNewCoordinate(90, b))})
        const wallkickCollision = () => mergeMap(updateCoordinate().blocks, b=> s.placedTetromino.map(p=> [b,p])).filter((t: ReadonlyArray<TetrominoBLocks>)=> (t[0].y === t[1].y && t[0].x === t[1].x)).length > 0
        const boundaryCollision = () => updateCoordinate().blocks.filter(b=> b.x < 0 || b.x > 9 || b.y > 19).length > 0
        const collision = () => wallkickCollision() || boundaryCollision()
        const finalrotate = () => collision() ? s.tetromino : updateCoordinate()


        return {
            ...s, 
            tetromino: finalrotate()
        }
    }
}

/** 
 * class that help generate random tetromino id (range from 1 - 6) 
 * reference: this function came from applied tutorial bundle code week 4
 */
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

export {tick, MoveLeft, MoveRight, Restart, RNG, Rotate}