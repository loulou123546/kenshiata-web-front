<script lang="ts">
    import {
        type GameSession,
        GamePlayerModel,
    } from "../../models/GameSession";
    import { type Character, characters } from "../../models/characters.ts";
    import SmallPlayerCard from "../SmallPlayerCard.svelte";

    const { gameSession } = $props<{
        gameSession: GameSession;
    }>();

    let roles: any[] = $state([
        {
            tag: "dad",
            name: "The dad of Tony",
        },
        {
            tag: "wolf",
            name: "Tony's domestic wolf",
        },
    ]);
    let assignedPlayer: Record<string, GamePlayerModel> = $state({});
    let myRole: string = $state("");
    let selectedCharacter: Character | undefined = $state(undefined);
    let readyToPlay: boolean = $state(false);

    // getStoryRoles()
    //     .then((data) => {
    //         roles = data;
    //     })
    //     .catch((err) => alert(err));

    function selectedRole(tag: string, user: GamePlayerModel) {
        // remove previous votes
        for (const tag in assignedPlayer) {
            if (assignedPlayer[tag]?.userId === user.userId) {
                delete assignedPlayer[tag];
            }
        }

        // add new vote
        assignedPlayer[tag] = user;
    }

    gameSession.addListener("player-ready", (data: any) => {
        const newData = GamePlayerModel.parse(data?.player);
        gameSession.setPlayer(newData);
        selectedRole(data.role?.tag, newData);
    });

    gameSession.addListener("reject-player-ready", (data: any) => {
        myRole = "";
        readyToPlay = false;
    });

    function readyPlay() {
        readyToPlay = true;
        gameSession.sendServer("player-ready", {
            character: selectedCharacter,
            role: { tag: myRole },
        });
    }
</script>

{#if !readyToPlay}
    <h2 class="text-2xl font-semibold pl-12 py-4">Rôles disponibles</h2>

    <div class="flex flex-wrap flex-row gap-4">
        {#each roles as role}
            <SmallPlayerCard
                customClass={myRole === role.tag
                    ? "bg-gray-200 text-black border-4 border-blue-500"
                    : "bg-gray-200 text-black hover:bg-gray-400"}
                user={{
                    avatar: assignedPlayer?.[role.tag]
                        ? assignedPlayer[role.tag]?.data?.avatar
                        : "add.png",
                    username: assignedPlayer?.[role.tag]
                        ? `${assignedPlayer[role.tag].data?.character_name} is ${role.name}`
                        : role.name,
                    online: assignedPlayer?.[role.tag] ? "yes" : "no",
                }}
                onclick={() => (myRole = role.tag)}
            />
        {/each}
    </div>

    <h2 class="text-2xl font-semibold pl-12 py-4">
        Jouer avec le personnage de
    </h2>

    <div class="flex flex-wrap flex-row gap-4">
        {#each $characters as character}
            <SmallPlayerCard
                customClass={selectedCharacter?.id === character.id
                    ? "bg-gray-200 text-black border-4 border-blue-500"
                    : "bg-gray-200 text-black hover:bg-gray-400"}
                user={{
                    avatar: character.avatar,
                    username: character.name,
                    online: "no",
                }}
                onclick={() => {
                    selectedCharacter = character;
                }}
            />
        {/each}
    </div>

    <div class="w-full text-center p-0 sm:p-8">
        {#if selectedCharacter && myRole}
            <button
                class="bg-blue-500 text-white p-4 font-semibold text-xl rounded-2xl"
                onclick={readyPlay}
            >
                Prêt à jouer
            </button>
        {/if}
    </div>
{:else}
    <h2 class="text-2xl font-semibold pl-12 py-4">
        En attente des autres joueurs
    </h2>

    <div class="flex flex-wrap flex-row gap-4">
        {#each roles as role}
            {#if assignedPlayer?.[role.tag]}
                <SmallPlayerCard
                    customClass={assignedPlayer[role.tag].userId ===
                    gameSession.myUserId
                        ? "bg-gray-200 text-black border-4 border-blue-500"
                        : "bg-gray-200 text-black hover:bg-gray-400"}
                    user={{
                        avatar: assignedPlayer[role.tag]?.data?.avatar,
                        username: `${assignedPlayer[role.tag].data?.character_name} is ${role.name}`,
                        online: "yes",
                    }}
                    onclick={() => {}}
                />
            {:else}
                <SmallPlayerCard
                    customClass="bg-gray-200 text-black hover:bg-gray-400"
                    user={{
                        avatar: "add.png",
                        username: role.name,
                        online: "no",
                    }}
                    onclick={() => {}}
                />
            {/if}
        {/each}
    </div>

    <div class="w-full text-center p-0 sm:p-8">
        <button
            class="bg-blue-500 text-white p-4 font-semibold text-xl rounded-2xl"
            onclick={() => {
                readyToPlay = false;
            }}
        >
            Modifier mon choix de personnage
        </button>
    </div>
{/if}
