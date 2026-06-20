import { ThirtySecondsEngine } from "./thirtySeconds.js";
import { XbolaEngine } from "./xbola.js";
import { WhoIsWhoEngine } from "./whoIsWho.js";
import { SabeTudoEngine } from "./sabeTudo.js";
import { SporcleMZEngine } from "./sporcleMZ.js";

export const GAME_TYPES = {
  THIRTY_SECONDS: "thirtySeconds",
  XBOLA: "xbola",
  WHO_IS_WHO: "whoIsWho",
  SABE_TUDO: "sabeTudo",
  SPORCLE_MZ: "sporcleMZ",
};

export function createEngine(gameType, params) {
  switch (gameType) {
    case GAME_TYPES.THIRTY_SECONDS: return new ThirtySecondsEngine(params);
    case GAME_TYPES.XBOLA:          return new XbolaEngine(params);
    case GAME_TYPES.WHO_IS_WHO:     return new WhoIsWhoEngine(params);
    case GAME_TYPES.SABE_TUDO:      return new SabeTudoEngine(params);
    case GAME_TYPES.SPORCLE_MZ:     return new SporcleMZEngine(params);
    default: throw new Error(`Unknown gameType: ${gameType}`);
  }
}