<script lang="ts">
import type { GameRoom } from "@shared/types/GameRoom";
import { UserIdentity } from "@shared/types/User";
import type SocketAPI from "../../services/socketAPI";

const { socket, room } = $props<{
	socket: SocketAPI;
	room: GameRoom;
}>();

let requests: UserIdentity[] = $state([]);

socket.addListener(
	"request-join-room",
	(data: { hostId: unknown; user: unknown }) => {
		if (data?.hostId !== room.hostId) return;
		const user = UserIdentity.parse(data?.user);
		requests.push(user);
	},
);

function respondInvite(userId: string, accept: boolean) {
	socket.send("respond-join-room", {
		hostId: room.hostId,
		userId,
		accept,
	});
	requests = requests.filter((player) => player.id !== userId);
}
</script>

<ul class="w-full flex flex-col flex-wrap justify-center gap-4 py-2 md:py-8">
    {#each requests as player}
        <div class="w-full flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-sand-200/40 p-1 rounded">
            <h3><span class="font-semibold">{player.username}</span> souhaite rejoindre<span class="hidden xs:inline"> la partie</span></h3>
            <button
                class="bg-red-700 text-white hover:bg-red-800 py-2 px-4 rounded-lg"
                onclick={() => respondInvite(player.id, false)}
            >
                Refuser
            </button>
            <button
                class="bg-cactus-600 text-white hover:bg-cactus-700 py-2 px-4 rounded-lg"
                onclick={() => respondInvite(player.id, true)}
            >
                Accepter
            </button>
        </div>
    {/each}
</ul>
