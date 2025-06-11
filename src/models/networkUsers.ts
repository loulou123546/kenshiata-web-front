import { z } from "zod";
import { User } from "./user.ts";

export const NetworkUser = z.object({
    socketId: z.string(),
    user: User,
});
export type NetworkUser = z.infer<typeof NetworkUser>;

export async function listNetworkUsers(): Promise<NetworkUser[]> {
    const response = await fetch(import.meta.env.PUBLIC_API_DOMAIN + "/players/online", {
        method: "GET",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        return [];
    }
    const data = await response.json();
    return data
        .map((user: any) => {
            try {
                return NetworkUser.parse({
                    socketId: user.socketId,
                    user: {
                        ...user
                    },
                });
            } catch {
                return undefined;
            }
        })
        .filter((user: NetworkUser | undefined) => user !== undefined);
}
