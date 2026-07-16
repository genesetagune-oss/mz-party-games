import { ThirtySecondsEngine } from "./thirtySeconds.js";
import { WhoIsWhoEngine } from "./whoIsWho.js";
import { SabeTudoEngine } from "./sabeTudo.js";
import { SporcleMZEngine } from "./sporcleMZ.js";
import { AgenteSecretoEngine } from "./agenteSecreto.js";

export const GAME_TYPES = {
  THIRTY_SECONDS: "thirtySeconds",
  WHO_IS_WHO: "whoIsWho",
  SABE_TUDO: "sabeTudo",
  SPORCLE_MZ: "sporcleMZ",
  AGENTE_SECRETO: "agenteSecreto",
};

export function createEngine(gameType, params) {
  switch (gameType) {
    case GAME_TYPES.THIRTY_SECONDS: return new ThirtySecondsEngine(params);
    case GAME_TYPES.WHO_IS_WHO:     return new WhoIsWhoEngine(params);
    case GAME_TYPES.SABE_TUDO:      return new SabeTudoEngine(params);
    case GAME_TYPES.SPORCLE_MZ:     return new SporcleMZEngine(params);
    case GAME_TYPES.AGENTE_SECRETO: return new AgenteSecretoEngine(params);
    default: throw new Error(`Unknown gameType: ${gameType}`);
  }
}