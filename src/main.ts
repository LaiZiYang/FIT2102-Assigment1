/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import { Event, State, Key, TetrominoBLocks, Action } from "./types";
import { hide, show, createSvgElement } from "./views";
import { tick, MoveLeft, MoveRight } from "./utils";
import { tick$ } from "./observables";

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

export const Constants = {
  TICK_RATE_MS: 100,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};



/** Utility functions */
export const initialTetromino: TetrominoBLocks[] = [
  {id: 0, x: 4, y: -1}, {id: 1, x: 5, y: -1}, {id: 2, x: 4, y: 0}, {id: 3, x: 5, y: 0}
]

const initialState: State = {
  time: 0,
  gameEnd: false,
  tetromino: initialTetromino,
  placedTetromino: [], 
  currentBoard: Array.from({ length: Constants.GRID_HEIGHT }, () => [...Array(Constants.GRID_WIDTH)]),
  rowToDelete: []
} as const;



/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const key$ = fromEvent<KeyboardEvent>(document, "keypress");

  const fromKey = (keyCode: Key) =>
    key$.pipe(filter(({ code }) => code === keyCode));

  const left$ = fromKey("KeyA");
  const right$ = fromKey("KeyD");
  const down$ = fromKey("KeyS");

  /** Observables */
const LeftAction = left$.pipe(
  map(_=> new MoveLeft(-1))
)

const RightActioin = right$.pipe(
  map(_=> new MoveRight(1))
)

const Tick = interval(Constants.TICK_RATE_MS).pipe(
  map(elapsed=> new tick(elapsed))
)

const Action$ = merge(LeftAction, RightActioin, Tick)


  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS);

  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
    if (s.rowToDelete.length>0) {
      levelText.textContent = (String(s.rowToDelete[5].id))
    }
    
    s.placedTetromino.forEach(b=> {
      const v = createSvgElement(svg.namespaceURI, "rect", {
        height: `${Block.HEIGHT}`,
        width: `${Block.WIDTH}`,
        x: `${Block.WIDTH*b.x}`,
        y: `${Block.HEIGHT*b.y}`,
        style: "fill: red"
      })
      v.setAttribute("id", String(b.id))
      svg.appendChild(v)
    })
    
    s.tetromino.forEach(b=> {
      const createBlock = (block: TetrominoBLocks) => {
        const v = createSvgElement(svg.namespaceURI, "rect", {
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${Block.WIDTH*block.x}`,
          y: `${Block.HEIGHT*block.y}`,
          style: "fill: yellow"
        })
        v.setAttribute("id", String(block.id))
        svg.appendChild(v)
        return v
      }

      const v = document.getElementById(String(b.id)) || createBlock(b)

      v.setAttribute("x", String(Block.WIDTH*b.x))
      // v.setAttribute("x", String(Block.WIDTH*b.x))
      v.setAttribute("y", String(Block.HEIGHT*b.y))
    })

    
    s.rowToDelete.forEach(b=> {
      const v = document.getElementById(String(b.id))
      if(v) svg.removeChild(v) 
      // if(v) v.setAttribute("style", "fill: black")
    })
  };

  const source$ = Action$
  .pipe(
    scan((s: State, a: Action)=> a.apply(s), initialState)
    )
  .subscribe((s: State) => {
    render(s);

    if (s.gameEnd) {
      show(gameover);
    } else {
      hide(gameover)
    }

  })

  // const source$ = merge(tick$)
  //   .pipe(
  //     map(t=> new tick(t)),
  //     scan((s: State, a: Action)=> a.apply(s), initialState))
  //   .subscribe((s: State) => {
  //     render(s);

  //     if (s.gameEnd) {
  //       show(gameover);
  //     } else {
  //       hide(gameover);
  //     }
  //   });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
