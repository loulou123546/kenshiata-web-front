import { faro } from "@grafana/faro-web-sdk";
import { persistentMap } from "@nanostores/persistent";
import { RefreshTokenResponse } from "@shared/types/Auth";
import { z } from "zod";

type AuthTokens = {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
};

export const User = z.object({
	id: z.string(),
	email: z.string().email(),
	username: z.string(),
});
export type User = z.infer<typeof User>;

const authTokens = persistentMap<AuthTokens>("auth-tokens:", {
	access_token: undefined,
	id_token: undefined,
	refresh_token: undefined,
});

const currentUser = persistentMap<User>("auth-user:");

function unsafe_parse_token(token: string): {
	header: Record<string, unknown>;
	payload: Record<string, unknown>;
} {
	const parts = token.split(".");
	return {
		header: JSON.parse(atob(parts[0])),
		payload: JSON.parse(atob(parts[1])),
	};
}

export function receiveTokens(tokens: AuthTokens): void {
	if (tokens.access_token)
		authTokens.setKey("access_token", tokens.access_token);
	if (tokens.id_token) authTokens.setKey("id_token", tokens.id_token);
	if (tokens.refresh_token)
		authTokens.setKey("refresh_token", tokens.refresh_token);
}

async function refreshTokens() {
	const token = authTokens.get()?.refresh_token;
	if (!token) return;
	try {
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/auth/refresh`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					refresh_token: token,
				}),
			},
		);
		const data = RefreshTokenResponse.parse(await res.json());
		if (data?.success) receiveTokens(data.success);
		if (data?.error) throw new Error(data.error);
	} catch (err) {
		console.error(err);
	}
}

async function remaining_time_refresh_token_ms(): Promise<number | undefined> {
	try {
		const refresh_token_expires_after = (
			import.meta.env?.PUBLIC_COGNITO_REFRESH_EXPIRES ?? "1 days"
		).split(" ");
		if (refresh_token_expires_after.length !== 2) return undefined;
		let expires_after_ms = Number(refresh_token_expires_after[0]);
		switch (refresh_token_expires_after[1]) {
			case "days":
				expires_after_ms *= 24;
			case "hours":
				expires_after_ms *= 60;
			case "minutes":
				expires_after_ms *= 60;
			case "seconds":
				expires_after_ms *= 1000;
				break;
			default:
				return undefined;
		}
		const tokens = authTokens.get();
		const token = tokens?.id_token ?? tokens?.access_token;
		if (!token) return undefined;
		const auth_time = unsafe_parse_token(token).payload?.auth_time;
		if (typeof auth_time !== "number") return undefined;
		return auth_time * 1000 + expires_after_ms - Date.now();
	} catch (err) {
		faro.api.pushError(err as Error);
		return undefined;
	}
}

function shouldRefreshToken() {
	const tokens = authTokens.get();
	if (!tokens?.access_token || !tokens?.id_token) return true;
	const id_payload = tokens?.id_token
		? unsafe_parse_token(tokens?.id_token)
		: undefined;
	const at_payload = tokens?.access_token
		? unsafe_parse_token(tokens?.access_token)
		: undefined;
	const expires_at = new Date(
		((id_payload?.payload?.exp ?? at_payload?.payload?.exp ?? 0) as number) *
			1000,
	);
	if (expires_at.getTime() < Date.now() + 1000 * 60 * 5) return true; // one of the token expires in less than 5 minutes
}

setTimeout(() => {
	remaining_time_refresh_token_ms().then((ms) => {
		console.log(`Refresh token expires in ${(ms ?? 0) / 3600000} hours`);
	});
	if (shouldRefreshToken()) refreshTokens().catch(console.error);
}, 10);

// every minute
setInterval(() => {
	if (shouldRefreshToken()) refreshTokens().catch(console.error);
}, 60000);

export async function get_access_token(): Promise<string> {
	if (shouldRefreshToken()) await refreshTokens();
	const tokens = authTokens.get();
	if (!tokens?.access_token) throw new Error("User is not authenticated");
	return tokens.access_token;
}

export async function get_id(): Promise<User> {
	if (shouldRefreshToken()) await refreshTokens();
	const tokens = authTokens.get();
	if (!tokens?.id_token) throw new Error("User is not authenticated");
	const id = unsafe_parse_token(tokens.id_token);
	return {
		id: id.payload?.sub,
		username: id.payload?.["cognito:username"],
		email: id.payload.email_verified ? id.payload?.email : undefined,
	} as User;
}
