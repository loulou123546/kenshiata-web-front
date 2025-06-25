<script lang="ts">
    import SocketAPI from "../../services/socketAPI";
    import { type GameRoom, getGameRoomNames } from "../../models/gameRoom";
    import type { UserIdentity } from "../../models/user";

    const { socket } = $props<{
        socket: SocketAPI;
    }>();

    let rooms: GameRoom[] = $state([]);
    let selectedRoom: GameRoom | undefined = $state(undefined);
    let names: Record<string, UserIdentity> = $state({});
    let loading: Promise<any> = $state(Promise.resolve());

    socket.addListener(
        "update-game-rooms",
        ({ updateRooms }: { updateRooms: GameRoom[] }) => {
            rooms = [
                ...rooms.filter(
                    (room) =>
                        !updateRooms.some((r) => r.hostId === room.hostId),
                ),
                ...updateRooms,
            ];
        },
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
</script>

<ul class="p-2 flex flex-col gap-1">
    {#each rooms as room}
        <li class="">
            <button
                class="px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-black w-full flex flex-col"
                onclick={() => (loading = selectRoom(room))}
            >
                <div class="flex flex-row items-center justify-between w-full">
                    <h3 class="text-xl font-semibold">{room.name}</h3>
                    <p class="text-sm">
                        {room.players.length} Joueur{room.players.length === 1
                            ? ""
                            : "s"}
                        {room.invites.length > 0
                            ? ` (+ ${room.invites.length} joueurs invités)`
                            : ""}
                    </p>
                    <p class="text-sm">
                        {room.public ? "Partie publique" : "Sur invitation"}
                    </p>
                    <a
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        onclick={() => {}}
                        href="#"
                    >
                        Rejoindre
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
                                    .map((id) => names[id]?.username ?? "?")
                                    .join(", ")}
                            </p>
                        </div>
                    {/await}
                {/if}
            </button>
        </li>
    {/each}
</ul>
