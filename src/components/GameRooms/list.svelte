<script lang="ts">
import type { GameRoom } from "@shared/types/GameRoom";
import type { UserIdentity } from "@shared/types/User";
import { getGameRoomNames } from "../../models/gameRoom";
import type SocketAPI from "../../services/socketAPI";

const { socket, rooms } = $props<{
	socket: SocketAPI;
	rooms: GameRoom[];
}>();

let selectedRoom: GameRoom | undefined = $state(undefined);
let names: Record<string, UserIdentity> = $state({});
let loading: Promise<void> = $state(Promise.resolve());
let joiningRooms = $state<Record<string, "pending" | "accepted" | "refused">>(
	{},
);

socket.send("list-game-rooms", {});

async function selectRoom(room: GameRoom) {
	selectedRoom = room;
	const infos = await getGameRoomNames(room.hostId);
	names = {
		...names,
		...infos,
	};
}

socket.addListener(
	"respond-join-room",
	({ hostId, accept }: { hostId: string; accept: boolean }) => {
		if (!joiningRooms[hostId]) return;
		joiningRooms = {
			...joiningRooms,
			[hostId]: accept ? "accepted" : "refused",
		};
	},
);

function joinRoom(hostId: string) {
	if (joiningRooms[hostId]) return;

	joiningRooms = {
		...joiningRooms,
		[hostId]: "pending",
	};

	socket.send("request-join-room", { hostId });
}

function setLoading(promise: Promise<void>) {
	loading = promise;
	return promise;
}
</script>

<ul class="md:p-2 flex flex-col gap-1">
    {#each rooms as room}
        <li class="">
            <button
                class="px-2 py-1 rounded-lg bg-gray-100/75 hover:bg-sand-100/70 text-black w-full flex flex-col"
                onclick={() => setLoading(selectRoom(room))}
            >
                <div class="flex flex-col md:flex-row items-center justify-between w-full">
                    <h3 class={["text-xl", selectedRoom?.hostId === room.hostId ? "font-semibold" : "xs:font-semibold"]}>{room.name}</h3>
                    <p class={["text-sm", selectedRoom?.hostId === room.hostId ? "block" : "hidden xs:block"]}>
                        {room.players.length} Joueur{room.players.length === 1
                            ? ""
                            : "s"}
                        {room.invites.length > 0
                            ? ` (+ ${room.invites.length} joueurs invités)`
                            : ""}
                    </p>
                    <!-- <p class="text-sm">
                        {room.public ? "Partie publique" : "Sur invitation"}
                    </p> -->
                    <!-- svelte-ignore a11y_invalid_attribute -->
                    <a
                        href="#"
                        onclick={() => joinRoom(room.hostId)}
                        class={[
                            "text-white font-medium rounded-lg px-4 py-2 text-center mr-2 items-center",
                            "bg-night-600 hover:bg-night-700 focus:ring-4 focus:ring-night-800 focus:m-1",
                            selectedRoom?.hostId === room.hostId ? "inline-flex" : "hidden xs:inline-flex"
                        ]}
                    >
                        {#if ["pending", "accepted"].includes(joiningRooms?.[room.hostId])}
                            <svg
                                aria-hidden="true"
                                role="status"
                                class="inline w-4 h-4 mr-3 text-white animate-spin"
                                viewBox="0 0 100 101"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                    fill="#E5E7EB"
                                ></path>
                                <path
                                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                    fill="currentColor"
                                ></path>
                            </svg>
                            {#if joiningRooms?.[room.hostId] === "pending"}
                                En attente d'acceptation...
                            {:else}
                                Demande acceptée, connexion...
                            {/if}
                        {:else if joiningRooms?.[room.hostId] === "refused"}
                            Demande refusée
                        {:else}
                            Rejoindre la partie
                        {/if}
                    </a>
                </div>
                {#if room.hostId === selectedRoom?.hostId}
                    {#await loading}
                        <p class="p-2">Chargement de la liste des joueurs...</p>
                    {:then}
                        <div class="flex flex-row items-center gap-4 w-full">
                            <p class="text-sm text-gray-500">
                                Hébergée par {names[room.hostId]?.username ??
                                    "?"}
                            </p>
                            <p class="text-sm text-gray-500">
                                Joueurs: {room.players
                                    .map(
                                        (id: string) =>
                                            names[id]?.username ?? "?",
                                    )
                                    .join(", ")}
                            </p>
                        </div>
                    {/await}
                {/if}
            </button>
        </li>
    {/each}
    {#if rooms.length < 1}
        <h3 class="md:text-xl text-center text-sand-200">
            Il n'y a pas de parties disponible
        </h3>
    {/if}
</ul>
