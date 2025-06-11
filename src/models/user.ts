import { persistentMap } from "@nanostores/persistent";
import { z } from "zod";

export const User = z.object({
    avatar: z.string(),
    username: z.string(),
    online: z.literal("yes").or(z.literal("no")),
});
export type User = z.infer<typeof User>;

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

export function getAvatarSource(avatar: string | undefined = undefined): string {
    if (!avatar) return `/avatar/${user.get().avatar}`;
    else return `/avatar/${avatar}`;
}
