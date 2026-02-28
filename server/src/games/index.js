import { ThirtySecondsEngine } from "./thirtySeconds.js";
import { XbolaEngine } from "./xbola.js";
import { WhoIsWhoEngine } from "./whoIsWho.js"; 

export const GAME_TYPES = {
  THIRTY_SECONDS: "thirtySeconds",
  XBOLA: "xbola",
  WHO_IS_WHO: "whoIsWho", 
};

export function createEngine(gameType, params) {
  switch (gameType) {
    case GAME_TYPES.THIRTY_SECONDS:
      return new ThirtySecondsEngine(params);

    case GAME_TYPES.XBOLA:
      return new XbolaEngine(params);

    case GAME_TYPES.WHO_IS_WHO: 
      return new WhoIsWhoEngine(params);

    default:
      throw new Error(`Unknown gameType: ${gameType}`);
  }
}