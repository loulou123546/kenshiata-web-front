import { z } from 'zod';
import { UserIdentity } from './user';
import { getUserData } from '../services/auth';

export const GameRoom = z.object({
    hostId: z.string().uuid(),
    players: z.array(z.string().uuid()),
    invites: z.array(z.string().uuid()),
    public: z.boolean(),
    name: z.string().min(1).max(256),
});
export type GameRoom = z.infer<typeof GameRoom>;

export async function getGameRoomNames(roomId: string): Promise<Record<string, UserIdentity>> {
    const user = await getUserData();
        const response = await fetch(`${import.meta.env.PUBLIC_API_DOMAIN}/gamerooms/${roomId}/names`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user?.token}`,
            },
            mode: 'cors',
        });
    if (!response.ok) {
        throw new Error(`Failed to fetch game room names: ${response.statusText}`);
    }
    const data = await response.json();
    return data?.data ?? {};
}
