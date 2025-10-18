import { faro } from "@grafana/faro-web-sdk";
import { persistentMap } from "@nanostores/persistent";
import { RefreshTokenResponse } from "@shared/types/Auth";
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";
import { atom } from "nanostores";
import type { NotyfNotification } from "notyf";
import { z } from "zod";
import notyf from "./notyf";

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

export const currentUser = persistentMap<User>("auth-user:");

export const gameStatus = atom<"none" | "matchmaking" | "game">("none");

export type authIssue =
	| "ok"
	| "auth_now"
	| "refresh_now"
	| "auth_soon"
	| "refresh_soon";

const JWKS = createRemoteJWKSet(new URL(import.meta.env.PUBLIC_COGNITO_JWKS));

async function parse_tokens(token: string): Promise<JWTPayload> {
	if (!import.meta.env.PUBLIC_COGNITO_CLIENT_ID)
		throw new Error("Missing Cognito Client ID");
	if (!import.meta.env.PUBLIC_COGNITO_ISSUER)
		throw new Error("Missing Cognito Issuer");

	const { payload } = await jwtVerify(token, JWKS, {
		issuer: import.meta.env.PUBLIC_COGNITO_ISSUER,
		clockTolerance: "5 minutes",
		maxTokenAge: "2 hours",
		requiredClaims: ["sub", "token_use"],
	});
	if (
		payload?.aud !== import.meta.env.PUBLIC_COGNITO_CLIENT_ID &&
		payload?.client_id !== import.meta.env.PUBLIC_COGNITO_CLIENT_ID
	)
		throw new Error("Invalid audience / client ID for the token");
	return payload;
}

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

export async function receiveTokens(tokens: AuthTokens): Promise<void> {
	if (tokens.access_token)
		authTokens.setKey("access_token", tokens.access_token);
	if (tokens.refresh_token)
		authTokens.setKey("refresh_token", tokens.refresh_token);
	if (tokens.id_token) {
		authTokens.setKey("id_token", tokens.id_token);
		const payload = await parse_tokens(tokens.id_token);
		currentUser.set(
			User.parse({
				id: payload.sub,
				email: payload.email,
				username: payload?.["cognito:username"],
			}),
		);
	}
}

async function refreshTokens(): Promise<boolean> {
	const token = authTokens.get()?.refresh_token;
	if (!token) return false;
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
		if (data?.success) {
			await receiveTokens(data.success);
			return true;
		}
		if (data?.error) throw new Error(data.error);
	} catch (err) {
		console.error(err);
	}
	return false;
}

function remaining_time_refresh_token_ms(): number | undefined {
	try {
		const refresh_token_expires_after = (
			import.meta.env?.PUBLIC_COGNITO_REFRESH_EXPIRES ?? "1 days"
		).split(" ");
		if (refresh_token_expires_after.length !== 2) return undefined;
		let expires_after_ms = Number(refresh_token_expires_after[0]);
		switch (refresh_token_expires_after[1]) {
			case "days":
				expires_after_ms *= 24 * 60 * 60 * 1000;
				break;
			case "hours":
				expires_after_ms *= 60 * 60 * 1000;
				break;
			case "minutes":
				expires_after_ms *= 60 * 1000;
				break;
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

function remaining_time_tokens_ms(): number {
	const tokens = authTokens.get();
	if (!tokens?.access_token || !tokens?.id_token) return 0;
	const id_payload = tokens?.id_token
		? unsafe_parse_token(tokens?.id_token)
		: undefined;
	const at_payload = tokens?.access_token
		? unsafe_parse_token(tokens?.access_token)
		: undefined;
	const now = Date.now();
	return Math.min(
		((id_payload?.payload?.exp ?? 0) as number) * 1000 - now,
		((at_payload?.payload?.exp ?? 0) as number) * 1000 - now,
	);
}

// Run every minutes to verify if authentification or refresh is needed
function check_auth_issues(): authIssue {
	const tokens = authTokens.get();
	const user = currentUser.get();

	if (!tokens?.refresh_token) return "auth_now";
	if (!tokens?.access_token || !tokens?.id_token) return "refresh_now";
	if (!user) return "refresh_now";

	const tokens_expires_in = remaining_time_tokens_ms();
	if (tokens_expires_in < 5 * 60 * 1000) return "refresh_soon";

	const refresh_expires_in = remaining_time_refresh_token_ms();
	if (refresh_expires_in && refresh_expires_in < 5 * 60 * 60 * 1000)
		return "auth_soon";
	return "ok";
}

let FAILED_REFRESH: number = 0;
let authWarningNotyf: NotyfNotification | undefined;
let refresh_handling: Promise<authIssue> | undefined;

function handle_auth_issues(): Promise<authIssue> {
	if (refresh_handling === undefined) {
		console.log("Running handle_auth_issues");
		refresh_handling = int_handle_auth_issues().finally(() => {
			refresh_handling = undefined;
		});
		return refresh_handling;
	} else {
		console.log("Already running handle_auth_issues, return existing promise");
		return refresh_handling;
	}
}

async function int_handle_auth_issues(): Promise<authIssue> {
	const action = check_auth_issues();
	console.debug("auth issues:", action, FAILED_REFRESH);
	if (authWarningNotyf) notyf.dismiss(authWarningNotyf);

	if (action === "ok") {
		FAILED_REFRESH = 0;
		return action;
	}
	if (action === "auth_now") {
		currentUser.set({} as User);
		authTokens.set({});
		FAILED_REFRESH = 0;
		return action;
	}
	if (action === "refresh_now" || action === "refresh_soon") {
		const success = await refreshTokens().catch((err) => {
			faro.api.pushError(err as Error);
			notyf.error("Erreur réseau lors de la reconnexion");
			console.error(err);
			return false;
		});
		if (!success) {
			if (FAILED_REFRESH >= 3) {
				currentUser.set({} as User);
				authTokens.set({});
				return "auth_now";
			} else {
				FAILED_REFRESH += 1;
				authWarningNotyf = notyf.warning({
					message: `Tentative de reconnexion ${FAILED_REFRESH}/3`,
					duration: 0,
					dismissible: false,
					icon: {
						className: "fa fa-circle-notch fa-spin",
						tagName: "i",
						color: "white",
						text: "",
					},
				});
			}
		}
	}
	if (action === "auth_soon") {
		if (gameStatus.get() !== "game") {
			notyf.warning(
				"Votre connexion expire bientôt, veuillez-vous reconnecter avant de jouer",
			);
			currentUser.set({} as User);
			authTokens.set({});
			FAILED_REFRESH = 0;
			return "auth_now";
		}
	}
	return action;
}

// at start and then every minute
setTimeout(handle_auth_issues, 10);
setInterval(handle_auth_issues, 30000);

export async function get_access_token(): Promise<string> {
	if (check_auth_issues() !== "ok") await handle_auth_issues();
	const tokens = authTokens.get();
	if (!tokens?.access_token) throw new Error("User is not authenticated");
	return tokens.access_token;
}

export async function get_id(): Promise<User> {
	if (check_auth_issues() !== "ok") await handle_auth_issues();
	const user = currentUser.get();
	if (!user) throw new Error("User is not authenticated");
	return user;
}
