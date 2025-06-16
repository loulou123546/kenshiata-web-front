<script lang="ts">
    import SocketAPI, {
        prepareGameNetworkFromSocket,
        startUsingGameNetworkWithSocket,
    } from "../services/socketAPI.ts";
    import {
        type NetworkUser,
        listNetworkUsers,
    } from "../models/networkUsers.ts";
    import SmallPlayerCard from "./SmallPlayerCard.svelte";
    import UserPairing from "./UserPairing.svelte";
    import { NetworkFactory } from "../services/networkFactory.ts";
    import { user, getAvatarSource, players } from "../models/user.ts";
    import { GameNetwork } from "../models/GameNetwork.ts";

    const { socket, socketReady, onNetworkReady } = $props<{
        socket: SocketAPI;
        socketReady: boolean;
        onNetworkReady: (instance: GameNetwork) => void;
    }>();
    let users: NetworkUser[] = $state([]);
    let playerTarget: NetworkUser | undefined = $state(undefined);
    let receivedRequest: NetworkUser | undefined = $state(undefined);
    let stepPairing: string = $state("unknown");

    socket.addListener("play-together-request", (data: any) => {
        console.log("Requête de jeu reçue :", data);
        const { from, target } = data;
        if (playerTarget || receivedRequest) {
            socket.send("play-together-response", {
                from: target,
                target: from,
                accept: false,
            });
        } else {
            receivedRequest = from;
        }
    });

    (async () => {
        users = await listNetworkUsers();
        setInterval(async () => {
            users = await listNetworkUsers();
        }, 5000);
    })();

    function playWith(target: NetworkUser, isHost: boolean) {
        if (socketReady) {
            receivedRequest = undefined;
            playerTarget = target;
            const alernativeGN = prepareGameNetworkFromSocket(
                isHost,
                socket,
                target.socketId,
            );
            new NetworkFactory({
                isHost,
                socket,
                me: user.get(),
                target,
                onApproval: () => {
                    players.set([user.get(), target.user]);
                    console.log("Partie acceptée");
                },
                onRefusal: () => {
                    console.log("Refus de la partie");
                    playerTarget = undefined;
                    players.set([]);
                },
                onConnection: (inst: GameNetwork) => {
                    onNetworkReady(inst);
                },
                onError: (error: Error) => {
                    console.error("Erreur de connexion :", error);
                    onNetworkReady(
                        startUsingGameNetworkWithSocket(
                            alernativeGN,
                            socket,
                            target.socketId,
                        ),
                    );
                },
                onTimeout: () => {
                    onNetworkReady(
                        startUsingGameNetworkWithSocket(
                            alernativeGN,
                            socket,
                            target.socketId,
                        ),
                    );
                },
                onStepChange: (step: string) => {
                    stepPairing = step;
                },
                logger: console.log,
            });
        }
    }
</script>

<div class="w-full p-4">
    <div class="bg-gray-800 text-white w-full p-8 rounded-xl">
        {#if !socketReady}
            <h2 class="text-2xl text-center py-4">Connexion au serveur...</h2>
        {:else if playerTarget}
            <h2 class="text-2xl text-center py-4">Connexion en cours...</h2>
            <UserPairing
                me={user.get()}
                target={playerTarget.user}
                step={stepPairing}
            />
        {:else if receivedRequest}
            <h2 class="text-2xl text-center py-4">Demande de jeu reçue</h2>
            <div class="w-full flex flex-row items-center justify-center">
                <div
                    class="py-2 px-6 m-2 lg:m-8 rounded-xl shadow-lg flex flex-col w-fit bg-gray-200 text-black items-center justify-center gap-4"
                >
                    <div
                        class="flex flex-row items-center justify-center w-fit"
                    >
                        <img
                            class="w-14 h-14 rounded-full"
                            src={getAvatarSource(receivedRequest.user.avatar)}
                            alt="Avatar de {receivedRequest.user.username}"
                        />
                        <h3 class="text-xl mx-4">
                            {receivedRequest.user.username}
                        </h3>
                    </div>
                    <div
                        class="flex flex-row items-center justify-center gap-4"
                    >
                        <button
                            class="px-4 py-2 bg-green-500 hover:bg-green-600"
                            onclick={() =>
                                playWith(receivedRequest as NetworkUser, false)}
                        >
                            Accepter et jouer avec {receivedRequest.user
                                .username}
                        </button>
                        <button
                            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                            onclick={() => {
                                socket.send("play-together-response", {
                                    from: {
                                        socketId: socket.socketId,
                                        user: user.get(),
                                    },
                                    target: receivedRequest,
                                    accept: false,
                                });
                                receivedRequest = undefined;
                            }}
                        >
                            Refuser la demande de jeu
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <h2 class="text-2xl text-center py-4">Commencer à jouer !</h2>
            <h3 class="text-gray-300 text-center">
                Pour le moment, les parties sont limités à 2 joueurs.<br />
                Cliquez sur un joueur pour l'inviter à jouer avec vous.
            </h3>

            <div class="flex flex-row flex-wrap gap-6 p-8 justify-center">
                {#each users as user}
                    {#if user.socketId !== socket.socketId}
                        <button>
                            <SmallPlayerCard
                                user={user.user}
                                onclick={() => playWith(user, true)}
                                customClass="bg-gray-400 text-black hover:bg-gray-500"
                            />
                        </button>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
</div>
