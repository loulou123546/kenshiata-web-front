import { z } from 'zod';
import { getUserData } from '../services/auth';

export const Character = z.object({
    userId: z.string(),
    id: z.string().uuid(),
    name: z.string().min(1, 'Character name is required'),
    avatar: z.string(),
});
export type Character = z.infer<typeof Character>;

export const NewCharacter = Character.omit({ userId: true, id: true });
export type NewCharacter = z.infer<typeof NewCharacter>;

export const CharacterId = Character.pick({ userId: true, id: true });
export type CharacterId = z.infer<typeof CharacterId>;

export async function listCharacters(): Promise<Character[]> {
    const user = await getUserData();
    const response = await fetch(`${import.meta.env.PUBLIC_API_DOMAIN}/characters`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
        },
        mode: 'cors',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch characters');
    }
    const data = await response.json();
    return data?.data?.map((character: any) => {
        try {
            return Character.parse(character);
        } catch {
            return undefined;
        }
    }).filter((el: Character | undefined) => el !== undefined);
}

export async function createCharacter(character: NewCharacter): Promise<Character> {
    const user = await getUserData();
    const response = await fetch(`${import.meta.env.PUBLIC_API_DOMAIN}/characters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(character),
        mode: 'cors',
    });
    if (!response.ok) {
        throw new Error('Failed to create character');
    }
    const data = await response.json();
    return Character.parse(data.data);
}

export async function editCharacter(character: Character): Promise<Character> {
    const user = await getUserData();
    const response = await fetch(`${import.meta.env.PUBLIC_API_DOMAIN}/characters`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(character),
        mode: 'cors',
    });
    if (!response.ok) {
        throw new Error('Failed to edit character');
    }
    const data = await response.json();
    return Character.parse(data.data);
}
