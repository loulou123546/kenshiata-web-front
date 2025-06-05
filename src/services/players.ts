import { persistentMap } from "@nanostores/persistent";
import { z } from "zod";

export const Player = z.object({
	username: z.string(),
});
export type Player = z.infer<typeof Player>;

export const myPlayer = persistentMap<Player>("player:me:", {
	username: "",
});
