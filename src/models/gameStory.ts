import { z } from "zod";
// import { persistentAtom } from '@nanostores/persistent';
import { getUserData } from "../services/auth";

export const GameStory = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
});
export type GameStory = z.infer<typeof GameStory>;

export const GameStoryMetadata = z.object({
	id: z.string().uuid(),
	title: z.string().optional(),
	roles: z.array(
		z.object({
			tag: z.string(),
			name: z.string(),
		}),
	),
});
export type GameStoryMetadata = z.infer<typeof GameStoryMetadata>;

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
	return z.array(GameStory).parse(data?.data);
}

export async function getStoryMetadata(id: string): Promise<GameStoryMetadata> {
	const user = await getUserData();
	const response = await fetch(
		`${import.meta.env.PUBLIC_API_DOMAIN}/stories/${encodeURIComponent(id)}`,
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
		throw new Error(`Failed to fetch story metadata: ${response.statusText}`);
	}
	const data = await response.json();
	return GameStoryMetadata.parse(data);
}
