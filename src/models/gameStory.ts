import { faro } from "@grafana/faro-web-sdk";
import { GameStoryMetadata } from "@shared/types/GameStory";
import { Stories } from "@shared/types/Story";
// import { persistentAtom } from '@nanostores/persistent';
import { getUserData } from "../services/auth";

// export const cacheUsernames = persistentAtom<Record<string, string>>('username-cache', {'__cache_age__': `${Date.now()/1000}`}, {
//   encode: JSON.stringify,
//   decode: JSON.parse,
// })

export async function getGameStories(): Promise<Stories> {
	try {
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
		return Stories.parse(data?.data);
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function getStoryMetadata(id: string): Promise<GameStoryMetadata> {
	try {
		const user = await getUserData();
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/stories/metadata/${encodeURIComponent(id)}`,
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
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
