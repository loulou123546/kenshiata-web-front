import { persistentMap } from "@nanostores/persistent";
import type { MapStore } from "nanostores";
import { UserManager } from "oidc-client-ts";
import { z } from "zod";

export const User = z.object({
	id: z.string(),
	email: z.string().email(),
	username: z.string(),
	token: z.string(),
});
export type User = z.infer<typeof User>;

class NanoStoreAsStoreManager {
	private mapStore: MapStore<any>;
	constructor(main_key: string) {
		this.mapStore = persistentMap<any>(main_key, {});
	}
	async get(key: string): Promise<null | string> {
		return this.mapStore.get()?.[key] ?? null;
	}
	async getAllKeys(): Promise<string[]> {
		return Object.keys(this.mapStore.get() ?? {});
	}
	async remove(key: string): Promise<null | string> {
		const previous = this.mapStore.get()?.[key] ?? null;
		this.mapStore.setKey(key, undefined);
		return previous;
	}
	async set(key: string, value: string): Promise<void> {
		this.mapStore.setKey(key, value);
	}
}

const cognitoAuthConfig = {
	authority: "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_Fzpf4i9XY",
	client_id: "203t0a306t5vkid4kdeto2hs2i",
	redirect_uri: `${import.meta.env.PUBLIC_FRONT_DOMAIN}/user/login`,
	response_type: "code",
	scope: "email openid phone profile",
	// no revoke of "access token" (https://github.com/authts/oidc-client-ts/issues/262)
	revokeTokenTypes: ["refresh_token" as const],
	// no silent renew via "prompt=none" (https://github.com/authts/oidc-client-ts/issues/366)
	automaticSilentRenew: false,
	userStore: new NanoStoreAsStoreManager("oidc:cognito:user:"),
	stateStore: new NanoStoreAsStoreManager("oidc:cognito:state:"),
};

// create a UserManager instance
export const userManager = new UserManager({
	...cognitoAuthConfig,
});

export async function signOutRedirect() {
	const clientId = "203t0a306t5vkid4kdeto2hs2i";
	const logoutUri = "<logout uri>";
	const cognitoDomain =
		"https://eu-west-1fzpf4i9xy.auth.eu-west-1.amazoncognito.com";
	window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

export async function getUserData(): Promise<User | undefined> {
	const user = await userManager.getUser();
	if (!user) throw new Error("User is not authenticated");
	if (user.expires_at && user.expires_at < Date.now() / 1000) {
		await userManager.signinSilent();
		return await getUserData();
	}
	return User.parse({
		id: user.profile.sub,
		email: user.profile.email,
		username: user.profile?.["cognito:username"],
		token: user.access_token,
	});
}
