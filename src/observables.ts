import { Constants } from "./main";
import { fromEvent, interval, merge } from "rxjs";

/** Observables */

/** Determines the rate of time steps */
const tick$ = interval(Constants.TICK_RATE_MS);

export {tick$}