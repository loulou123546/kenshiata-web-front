<script lang="ts">
import type { GameRoom } from "@shared/types/GameRoom";
import type { UserIdentity } from "@shared/types/User";
import { getGameRoomNames } from "../../models/gameRoom";
import { gameStatus, type User } from "../../services/auth";
import type SocketAPI from "../../services/socketAPI";
import RequestJoining from "./requestJoining.svelte";

const { socket, room, me } = $props<{
	socket: SocketAPI;
	room: GameRoom;
	me: User;
}>();
let names: Record<string, UserIdentity> = $state({});
let btnLocked = $state(false);

$effect(() => {
	gameStatus.set("matchmaking");
});

getGameRoomNames(room.hostId).then((values) => {
	names = {
		...names,
		...values,
	};
});

function leaveRoom() {
	gameStatus.set("none");
	socket.send("leave-room", { hostId: room.hostId });
}

function startGame() {
	btnLocked = true;
	socket.send("start-game", { hostId: room.hostId });
	setTimeout(() => {
		btnLocked = false;
	}, 5000);
}
</script>

<h2 class="text-lg md:text-2xl text-center py-4">
    Session de jeu : {room.name} <!--({room.public ? "publique" : "sur invitation"})-->
</h2>
<ul class="w-full flex flex-row flex-wrap justify-center gap-3 md:gap-x-8 md:gap-y-4 py-2 md:py-8">
    {#each room.players as player}
        <li class="bg-gray-200 text-black px-4 py-2 rounded-lg">
            {player === me?.id ? "Moi" : (names[player]?.username ?? player)}
            {#if player === room.hostId}
                <span class="text-sm text-gray-700"> (Hôte) </span>
            {/if}
        </li>
    {/each}
</ul>
<RequestJoining {socket} {room} />
<div class="flex flex-row justify-around gap-2">
    {#if room.hostId === me?.id}
        <button
            class="bg-red-700 text-white hover:bg-red-800 py-2 px-4 rounded-lg"
            disabled={btnLocked}
            onclick={leaveRoom}>Fermer la session de jeu</button
        >
        <button
            class="bg-night-600 text-white hover:bg-night-700 py-2 px-4 rounded-lg"
            disabled={btnLocked}
            onclick={startGame}>Lancer la partie</button
        >
    {:else}
        <button
            class="bg-red-700 text-white hover:bg-red-800 py-2 px-4 rounded-lg"
            onclick={leaveRoom}>Quitter la session de jeu</button
        >
    {/if}
</div>
