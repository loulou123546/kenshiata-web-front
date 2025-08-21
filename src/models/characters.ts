import { Character, type NewCharacter } from "@shared/types/Character";
import { atom } from "nanostores";
import { getUserData } from "../services/auth";

export const characters = atom<Character[]>([]);

export const Avatars = [
	"default.png",
	"boykisser.jpg",
	"purple.jpg",
	"kenshiata_ryugy_2025.png",
	"tetsuo.png",
	"fiverr.jpg",
	"bluewolf.webp",
];

export function getAvatarSource(
	avatar: string | undefined = undefined,
): string {
	if (!avatar) return "/avatar/add.png";
	return `/avatar/${avatar}`;
}

export async function listCharacters(): Promise<Character[]> {
	const user = await getUserData();
	const response = await fetch(
		`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
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
}

export async function createCharacter(
	character: NewCharacter,
): Promise<Character> {
	const user = await getUserData();
	const response = await fetch(
		`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${user?.token}`,
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
}

export async function editCharacter(character: Character): Promise<Character> {
	const user = await getUserData();
	const response = await fetch(
		`${import.meta.env.PUBLIC_API_DOMAIN}/characters`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${user?.token}`,
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

	characters.set(characters.get().map((el) => (el.id === char.id ? char : el)));
	return char;
}
