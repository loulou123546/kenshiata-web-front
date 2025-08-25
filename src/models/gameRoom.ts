import { faro } from "@grafana/faro-web-sdk";
import type { UserIdentity } from "@shared/types/User";
// import { persistentAtom } from '@nanostores/persistent';
import { getUserData } from "../services/auth";

// export const cacheUsernames = persistentAtom<Record<string, string>>('username-cache', {'__cache_age__': `${Date.now()/1000}`}, {
//   encode: JSON.stringify,
//   decode: JSON.parse,
// })

export async function getGameRoomNames(
	roomId: string,
): Promise<Record<string, UserIdentity>> {
	try {
		const user = await getUserData();
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/gamerooms/${roomId}/names`,
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
			throw new Error(
				`Failed to fetch game room names: ${response.statusText}`,
			);
		}
		const data = await response.json();
		return data?.data ?? {};
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
