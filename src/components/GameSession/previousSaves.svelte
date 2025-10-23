<script lang="ts">
import type { UserGameSession } from "@shared/types/GameSession";
import {
	deletePreviousGameSession,
	getMyGameSessions,
} from "../../models/GameSession";
import notyf from "../../services/notyf";
import type SocketAPI from "../../services/socketAPI";

const { socket, inSession } = $props<{
	socket: SocketAPI | undefined;
	inSession: boolean;
}>();

let previously: UserGameSession[] = $state([]);
let loading: string | undefined = $state(undefined);

getMyGameSessions()
	.then((res) => {
		previously = res;
	})
	.catch((_err) => {
		notyf.error("Erreur lors du chargements de vos précédantes parties");
	});

async function join(sessionId: string) {
	if (!socket) {
		notyf.error(
			"Veuillez attendre la connection au serveur avant de ré-essayer",
		);
		return;
	}
	if (inSession) {
		notyf.error(
			"Vous ne pouvez plus rejoindre une partie précédante, vous êtes déjà en jeu",
		);
		return;
	}
	loading = sessionId;
	if (!socket?.ready) await socket.waitReady();

	socket.send("game-join-back", { sessionId });
	setTimeout(() => {
		loading = undefined;
	}, 10000);
}

function remove(sessionId: string) {
	loading = "__delete";
	deletePreviousGameSession(sessionId)
		.then(() => {
			previously = previously.filter(
				(session) => session.sessionId !== sessionId,
			);
		})
		.catch((_err) => {
			notyf.error("Echec de suppression de la partie précédante");
		})
		.finally(() => {
			loading = undefined;
		});
}
</script>

<div
    class="w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center py-4 px-3 md:p-6"
>
    {#if inSession}
        <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
            Vous êtes en jeu
        </div>
        <p class="md:text-lg text-center text-brown-900 py-2 max-w-[640px] text-justify">
            Si vous quittez cette partie, le jeu sera mis en pause pour tous les autres joueurs.
            Vous pouvez revenir dans une partie en utilisant le menu <i class="fa fa-floppy-disk" aria-label="menu des parties"></i> depuis la page de création de partie.
            La partie reprend automatiquement quand tous les joueurs sont présent et votent de nouveau.
        </p>
        <button class="bg-red-700/80 hover:bg-red-800 px-2 py-1 text-white rounded-lg" onclick={() => {window.location.reload()}}>Quitter la partie</button>
    {:else}
        <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
            Mes précédentes parties
        </div>
        <ul class="w-full max-w-[640px] flex flex-col gap-1">
            {#each previously as session}
                <li class="w-full flex flex-row bg-gray-100/60 gap-2 px-2 py-1 rounded-lg items-center">
                    <button
                        aria-label="delete this game from your saved games"
                        class="bg-red-700 hover:bg-red-800 px-2 py-1 rounded-lg text-white"
                        disabled={loading !== undefined}
                        onclick={() => {remove(session.sessionId)}}
                    >
                        <i class="fa fa-trash"></i>
                    </button>
                    <div class="flex-none text-gray-700">[{new Date(session.last_joined).toLocaleString(undefined, {month: 'short', day: "2-digit", hour: "numeric", minute: "numeric"})}]</div>
                    <div class="grow font-semibold text-center">{session.sessionName}</div>
                    <button
                        class="flex-none bg-night-600 hover:bg-night-800 px-2 py-1 rounded-lg text-white"
                        onclick={() => {join(session.sessionId)}}
                        disabled={loading !== undefined}
                    >
                        Rejoindre
                        {#if loading === session.sessionId}
                            <i class="fa fa-circle-notch fa-spin ml-1"></i>
                        {/if}
                    </button>
                </li>
            {/each}
            {#if previously.length < 1}
                <li class="md:text-xl text-center text-brown-800/80">
                    Vous n'avez aucune partie récente encore en cours
                </li>
            {/if}
        </ul>
    {/if}
</div>
