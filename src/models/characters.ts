import { faro } from "@grafana/faro-web-sdk";
import { Character, type NewCharacter } from "@shared/types/Character";
import { atom } from "nanostores";
import { get_access_token } from "../services/auth";

export const characters = atom<Character[]>([]);

export const Avatars = [
	"default.png",
	"boykisser.jpg",
	"purple.jpg",
	// "kenshiata_ryugy_2025.png",
	// "tetsuo.png",
	"fiverr.jpg",
	"bluewolf.webp",
];

export function getAvatarSource(
	avatar: string | Character | undefined = undefined,
): string {
	if (!avatar) return "/avatar/add.png";
	const avatar_name = typeof avatar === "string" ? avatar : avatar.avatar;
	if (avatar_name === "custom" && typeof avatar === "object") {
		if (import.meta.env?.PUBLIC_FRONT_DOMAIN?.startsWith("http://localhost"))
			return `https://kenshiata.studio/public/avatars/${avatar.userId}:${avatar.id}`;
		return `/public/avatars/${avatar.userId}:${avatar.id}`;
	}
	return `/avatar/${avatar_name}`;
}

export async function listCharacters(): Promise<Character[]> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				mode: "cors",
			},
		);
		if (!response.ok) {
			throw new Error("Failed to fetch characters");
		}
		const data = await response.json();
		const chars = data?.data
			?.map((character: unknown) => {
				try {
					return Character.parse(character);
				} catch {
					return undefined;
				}
			})
			.filter((el: Character | undefined) => el !== undefined);
		characters.set(chars);
		return chars;
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function createCharacter(
	character: NewCharacter,
): Promise<Character> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				body: JSON.stringify(character),
				mode: "cors",
			},
		);
		if (!response.ok) {
			throw new Error("Failed to create character");
		}
		const data = await response.json();
		const char = Character.parse(data.data);

		characters.set([...characters.get(), char]);
		return char;
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}

export async function editCharacter(character: Character): Promise<Character> {
	try {
		const response = await fetch(
			`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${await get_access_token()}`,
				},
				body: JSON.stringify(character),
				mode: "cors",
			},
		);
		if (!response.ok) {
			throw new Error("Failed to edit character");
		}
		const data = await response.json();
		const char = Character.parse(data.data);

		characters.set(
			characters.get().map((el) => (el.id === char.id ? char : el)),
		);
		return char;
	} catch (err) {
		faro.api.pushError(err as Error);
		throw err;
	}
}
