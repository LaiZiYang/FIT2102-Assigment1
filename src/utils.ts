import { State, Action } from "./types";
import { createSvgElement } from "./views";
import { Constants, Block, StartCubePos } from "./main";

const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;

/** State processing */
/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => {
    return {
        ...s,
        tetromino: s.tetromino.map(b=> {
            return {
                ...b,
                y: b.y+1
            }
        })
    }
};



class MoveDown implements Action {
    apply(s: Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: string; x: number; y: number; }>[]; }>): Readonly<{ gameEnd: boolean; tetromino: Readonly<{ id: string; x: number; y: number; }>[]; }> {
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

// function moveDown(s: State) {
//     s.tetromino.map(({y})=> y + 1)
//     return {
//         ...s,

//     }
// }

export {tick}