<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { GameRoom } from "@shared/types/GameRoom";
import { GameSession as GameSessionModel } from "@shared/types/GameSession";
import { z } from "zod";
import { GameSession } from "../models/GameSession";
import { get_id, type User } from "../services/auth";
import notyf from "../services/notyf";
import SocketAPI from "../services/socketAPI";
import Create from "./GameRooms/create.svelte";
import InRoom from "./GameRooms/inRoom.svelte";
import List from "./GameRooms/list.svelte";

const { onJoinSession, onSocketReady } = $props<{
	onJoinSession: (session: GameSession) => void;
	onSocketReady: (socket: SocketAPI) => void;
}>();

faro.api.setView({
	name: "matchmaking",
});

const socketP: Promise<SocketAPI> = $state(SocketAPI.create());
let rooms: GameRoom[] = $state([]);
let me: User | undefined = $state(undefined);
get_id()
	.then((user) => {
		me = user;
	})
	.catch((err) => {
		faro.api.pushError(err as Error);
		notyf.error("Vous semblez ne pas être connecté");
	});
const currentRoom: GameRoom | undefined = $derived(
	// @ts-expect-error id can and will exist
	(me?.id && rooms.find((room) => room.players.includes(me?.id))) || undefined,
);

socketP
	.then((socket) => {
		socket.addListener("update-game-rooms", (data: unknown) => {
			try {
				const { updateRooms, removedRooms } = z
					.object({
						updateRooms: z.array(GameRoom).optional(),
						removedRooms: z.array(z.string()).optional(),
					})
					.parse(data);
				rooms = [
					...rooms.filter(
						(room) =>
							!updateRooms?.some((r) => r.hostId === room.hostId) &&
							!removedRooms?.includes(room.hostId),
					),
					...(updateRooms ?? []),
				];
			} catch (err) {
				faro.api.pushError(err as Error);
				notyf.warning("Echec de la mise à jour de la liste des parties");
			}
		});

		socket.addListener("start-game", (data: unknown) => {
			try {
				if (!me) return;
				const sessionInfo = GameSessionModel.extend({
					hostId: z.string(),
				}).parse(data);

				if (sessionInfo.hostId === currentRoom?.hostId) {
					const session = new GameSession(socket, sessionInfo, me.id);
					onJoinSession(session);
				} else if (currentRoom === undefined) {
					if (
						confirm(
							`Voulez-vous rejoindre maintenant la session de jeu ${sessionInfo.name} ?`,
						)
					) {
						const session = new GameSession(socket, sessionInfo, me.id);
						onJoinSession(session);
					}
				}
			} catch (err) {
				faro.api.pushError(err as Error);
			}
		});

		socket.addListener("join-running-game", (data: unknown) => {
			try {
				if (!me) return;
				const session = z
					.object({ session: GameSessionModel })
					.parse(data).session;
				if (!session.players.some((pl) => pl.userId === me?.id)) {
					notyf.error("La tentative de rejoindre une partie en cours à echoué");
				}

				const instance = new GameSession(socket, session, me.id, true);
				onJoinSession(instance);
			} catch (err) {
				faro.api.pushError(err as Error);
			}
		});

		onSocketReady(socket);
	})
	.catch((_err) => {
		notyf.error("Erreur lors de la connexion au serveur websocket");
	});

async function shareWithFriends() {
	const data = {
		url: "https://kenshiata.studio",
		title: "Viens explorer le far-west avec moi",
	};
	if (navigator?.canShare?.(data)) {
		navigator.share(data);
	} else {
		try {
			await navigator.clipboard.writeText("https://kenshiata.studio");
			notyf.success("Lien copié dans le presse-papier");
		} catch {
			notyf.warning("Votre navigateur ne supporte pas le partage de lien");
		}
	}
}
</script>

<div class="w-full py-4 md:p-4">
    <div class="bg-brown-700/75 text-white w-full p-3 md:p-8 rounded-xl">
        {#await socketP.then(async (socket) => {
            await socket.waitReady();
            return socket;
        })}
            <!-- https://uiverse.io/mobinkakei/pink-deer-76 -->
            <div id="wifi-loader" class="mx-auto pt-3">
                <svg class="circle-outer" viewBox="0 0 86 86">
                    <circle class="back" cx="43" cy="43" r="40"></circle>
                    <circle class="new" cx="43" cy="43" r="40"></circle>
                </svg>
                <svg class="circle-middle" viewBox="0 0 60 60">
                    <circle class="back" cx="30" cy="30" r="27"></circle>
                </svg>
                <svg class="circle-inner" viewBox="0 0 34 34">
                    <circle class="back" cx="17" cy="17" r="14"></circle>
                </svg>
            </div>

            <h2 class="text-lg md:text-2xl text-center py-4">Connexion au serveur...</h2>
        {:then socket}
            {#if currentRoom && me}
                <InRoom {socket} room={currentRoom} {me} />
            {:else}
                <h2 class="text-lg md:text-2xl text-center md:py-4">Commencer à jouer !</h2>

                <div class="w-full flex flex-col md:flex-row gap-y-2">
                    <div class="md:w-3/4">
                        <!-- <h3 class="text-xl text-center">
                            Rejoindre une partie
                        </h3> -->
                        <List {socket} {rooms} />
                        <div class="text-center pt-4">
                            <button class="bg-cactus-700 text-white hover:bg-cactus-800 px-4 py-2 rounded-lg" onclick={shareWithFriends}>
                                Inviter des amis <i class="fa fa-share-from-square ml-1"></i>
                            </button>
                        </div>
                    </div>
                    <div class="md:w-1/4">
                        <Create {socket} />
                    </div>
                </div>
            {/if}
        {:catch error}
            <h2 class="text-lg md:text-2xl text-center py-4 text-red-500">
                Erreur de connexion : {error.message}
            </h2>
        {/await}
    </div>
</div>

<style>
    #wifi-loader {
        --background: #62abff;
        --back-color: #d0d2df;
        --text-color: #414856;
        width: 64px;
        height: 64px;
        border-radius: 50px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #wifi-loader svg {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    #wifi-loader svg circle {
        position: absolute;
        fill: none;
        stroke-width: 6px;
        stroke-linecap: round;
        stroke-linejoin: round;
        transform: rotate(-100deg);
        transform-origin: center;
    }

    #wifi-loader svg circle.back {
        stroke: var(--back-color);
    }

    /* #wifi-loader svg circle.front {
        stroke: var(--front-color);
    } */

    #wifi-loader svg.circle-outer {
        height: 86px;
        width: 86px;
    }

    #wifi-loader svg.circle-outer circle {
        stroke-dasharray: 62.75 188.25;
    }

    #wifi-loader svg.circle-outer circle.back {
        animation: circle-outer135 1.8s ease infinite 0.3s;
    }

    /* #wifi-loader svg.circle-outer circle.front {
        animation: circle-outer135 1.8s ease infinite 0.15s;
    } */

    #wifi-loader svg.circle-middle {
        height: 60px;
        width: 60px;
    }

    #wifi-loader svg.circle-middle circle {
        stroke-dasharray: 42.5 127.5;
    }

    #wifi-loader svg.circle-middle circle.back {
        animation: circle-middle6123 1.8s ease infinite 0.25s;
    }

    /* #wifi-loader svg.circle-middle circle.front {
        animation: circle-middle6123 1.8s ease infinite 0.1s;
    } */

    #wifi-loader svg.circle-inner {
        height: 34px;
        width: 34px;
    }

    #wifi-loader svg.circle-inner circle {
        stroke-dasharray: 22 66;
    }

    #wifi-loader svg.circle-inner circle.back {
        animation: circle-inner162 1.8s ease infinite 0.2s;
    }

    /* #wifi-loader svg.circle-inner circle.front {
        animation: circle-inner162 1.8s ease infinite 0.05s;
    } */

    @keyframes circle-outer135 {
        0% {
            stroke-dashoffset: 25;
        }

        25% {
            stroke-dashoffset: 0;
        }

        65% {
            stroke-dashoffset: 301;
        }

        80% {
            stroke-dashoffset: 276;
        }

        100% {
            stroke-dashoffset: 276;
        }
    }

    @keyframes circle-middle6123 {
        0% {
            stroke-dashoffset: 17;
        }

        25% {
            stroke-dashoffset: 0;
        }

        65% {
            stroke-dashoffset: 204;
        }

        80% {
            stroke-dashoffset: 187;
        }

        100% {
            stroke-dashoffset: 187;
        }
    }

    @keyframes circle-inner162 {
        0% {
            stroke-dashoffset: 9;
        }

        25% {
            stroke-dashoffset: 0;
        }

        65% {
            stroke-dashoffset: 106;
        }

        80% {
            stroke-dashoffset: 97;
        }

        100% {
            stroke-dashoffset: 97;
        }
    }
</style>
