<script lang="ts">
import type { GameRoom } from "../../models/gameRoom";
import { UserIdentity } from "../../models/user";
import type SocketAPI from "../../services/socketAPI";

const { socket, room } = $props<{
	socket: SocketAPI;
	room: GameRoom;
}>();

let requests: UserIdentity[] = $state([]);

socket.addListener("request-join-room", (data: any) => {
	if (data?.hostId !== room.hostId) return;
	const user = UserIdentity.parse(data?.user);
	requests.push(user);
});

function respondInvite(userId: string, accept: boolean) {
	socket.send("respond-join-room", {
		hostId: room.hostId,
		userId,
		accept,
	});
	requests = requests.filter((player) => player.id !== userId);
}
</script>

<ul class="w-full flex flex-col flex-wrap justify-center gap-4 py-8">
    {#each requests as player}
        <div class="w-full flex flex-row items-center justify-center gap-4">
            <h3>{player.username} souhaite rejoindre la partie</h3>
            <button
                class="bg-red-500 text-white hover:bg-red-700 py-2 px-4 rounded-lg"
                onclick={() => respondInvite(player.id, false)}
            >
                Refuser
            </button>
            <button
                class="bg-green-500 text-white hover:bg-green-700 py-2 px-4 rounded-lg"
                onclick={() => respondInvite(player.id, true)}
            >
                Accepter
            </button>
        </div>
    {/each}
</ul>
