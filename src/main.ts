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
import { Event, State, Key, TetrominoBLocks } from "./types";
import { hide, show, createSvgElement } from "./views";
// import { tick } from "./utils";
import { tick$ } from "./observables";

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

export const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

export const StartCubePos = {
  Block1: {
    X_COORDINATE: Block.WIDTH*5,
    Y_COORDINATE: Block.HEIGHT*0
  },

  Block2: {
    X_COORDINATE: Block.WIDTH*6,
    Y_COORDINATE: Block.HEIGHT*0
  },

  Block3: {
    X_COORDINATE: Block.WIDTH*5,
    Y_COORDINATE: Block.HEIGHT*1
  },

  Block4: {
    X_COORDINATE: Block.WIDTH*6,
    Y_COORDINATE: Block.HEIGHT*1
  }
  
}

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

/** Utility functions */
const initialTetromino: TetrominoBLocks[] = [
  {id: "0", x: 4, y: 0}, {id: "1", x: 5, y: 0}, {id: "2", x: 4, y: 1}, {id: "3", x: 5, y: 1}
]

const initialState: State = {
  gameEnd: false,
  tetromino: initialTetromino
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
    

    s.tetromino.forEach(b=> {
      const createBlock = (blocks: TetrominoBLocks) => {
        const v = createSvgElement(svg.namespaceURI, "rect", {
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${Block.WIDTH*blocks.x}`,
          y: `${Block.HEIGHT*blocks.y}`,
          style: "fill: yellow"
        })
        v.setAttribute("id", blocks.id)
        svg.appendChild(v)
        return v
      }

      const v = document.getElementById(b.id) || createBlock(b)

      v.setAttribute("x", String(Block.WIDTH*b.x))
      v.setAttribute("y", String(Block.HEIGHT*b.y))
    })

    // // Add blocks to the main grid canvas
    // const cube = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: "0",
    //   y: "0",
    //   style: "fill: green",
    // });
    // svg.appendChild(cube);
    // const cube2 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * (3 - 1)}`,
    //   y: `${Block.HEIGHT * (20 - 1)}`,
    //   style: "fill: red",
    // });
    // svg.appendChild(cube2);
    // const cube3 = createSvgElement(svg.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * (4 - 1)}`,
    //   y: `${Block.HEIGHT * (20 - 1)}`,
    //   style: "fill: red",
    // });
    // svg.appendChild(cube3);

    // // Add a block to the preview canvas
    // const cubePreview = createSvgElement(preview.namespaceURI, "rect", {
    //   height: `${Block.HEIGHT}`,
    //   width: `${Block.WIDTH}`,
    //   x: `${Block.WIDTH * 2}`,
    //   y: `${Block.HEIGHT}`,
    //   style: "fill: green",
    // });
    // preview.appendChild(cubePreview);
  };

  const source$ = merge(tick$)
    .pipe(scan(tick, initialState))
    .subscribe((s: State) => {
      render(s);

      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
