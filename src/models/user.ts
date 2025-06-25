import { persistentMap } from "@nanostores/persistent";
import { atom } from "nanostores";
import { z } from "zod";

export const User = z.object({
    avatar: z.string(),
    username: z.string(),
    online: z.literal("yes").or(z.literal("no")),
});
export type User = z.infer<typeof User>;

export const UserIdentity = z.object({
    id: z.string().uuid(),
    username: z.string(),
    groups: z.array(z.string()),
});
export type UserIdentity = z.infer<typeof UserIdentity>;

export const Avatars = [
    'default.png',
    "boykisser.jpg",
    "purple.jpg",
    "kenshiata_ryugy_2025.png",
    "tetsuo.png",
    "fiverr.jpg",
    "bluewolf.webp"
]

export const user = persistentMap<User>("user:me:", {
    avatar: Avatars[Math.floor(Math.random() * Avatars.length)],
    username: "",
    online: "no",
});

export const players = atom<User[]>([]);

export function getAvatarSource(avatar: string | undefined = undefined): string {
    if (!avatar) return `/avatar/${user.get().avatar}`;
    else return `/avatar/${avatar}`;
}

export function getPlayer(username: string): User | undefined {
    return players.get().find(player => player.username === username);
}
