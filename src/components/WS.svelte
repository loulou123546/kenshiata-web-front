<script lang="ts">
import NetworkSync, {
	listNetworkUsers,
	type NetworkUser,
} from "../services/networkSync.ts";
import { myPlayer } from "../services/players";
import Player from "./Player.svelte";

const me: string = $derived(myPlayer.get().username);
let users: NetworkUser[] = $state([]);
const conn: NetworkSync = $state(new NetworkSync());
let started: boolean = $state(false);
let gameStarted: boolean = $state(false);

conn.addListener("ping", (data: any) => {
	conn.send("pong", {
		data: data,
	});
});

conn.addListener("pong", (data: any) => {
	console.log("Received pong, connexion established !");
	gameStarted = true;
});

async function joinNetwork() {
	started = true;
	await conn.start(myPlayer.get());
}

async function playWith(user: NetworkUser) {
	await conn.askToConnectTo(user);
	// TODO: find a way to await sucessful connection or handling error
}

$effect(() => {
	return () => {
		conn?.close();
	};
});

(async () => {
	users = await listNetworkUsers();
	setInterval(async () => {
		users = await listNetworkUsers();
	}, 5000);
})();
</script>

<div class="pl-8">
    {#if !started}
        <button class="p-4 bg-green-500 text-white" onclick={joinNetwork}>
            Join Network
        </button>
    {:else}
        <h3 class="text-lg">Liste des joueurs en ligne</h3>
        <ul>
            {#each users as user}
                {#if user.player.username !== me}
                    <li class="py-2">
                        <button
                            class="p-4 bg-blue-500 text-white"
                            onclick={() => playWith(user)}
                            >Play with {user.player.username} ({user.socketId})</button
                        >
                    </li>
                {/if}
            {/each}
        </ul>
    {/if}
    {#if gameStarted}
        <Player
            send={(action: string, data: any) => conn.send(action, data)}
            listen={(action: string, data: any) =>
                conn.addListener(action, data)}
            isHost={conn.host}
        />
    {/if}
</div>
