import { z } from "zod";
// import { persistentAtom } from '@nanostores/persistent';
import { getUserData } from "../services/auth";

export const GameStory = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(256),
});
export type GameStory = z.infer<typeof GameStory>;

// export const cacheUsernames = persistentAtom<Record<string, string>>('username-cache', {'__cache_age__': `${Date.now()/1000}`}, {
//   encode: JSON.stringify,
//   decode: JSON.parse,
// })

export async function getGameStories(): Promise<GameStory[]> {
    const user = await getUserData();
    const response = await fetch(
        `${import.meta.env.PUBLIC_API_DOMAIN}/stories/available`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user?.token}`,
            },
            mode: "cors",
        },
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.statusText}`);
    }
    const data = await response.json();
    return data?.data ?? {};
}
