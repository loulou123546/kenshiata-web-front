<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import type { Character } from "@shared/types/Character";
import { GamePlayer } from "@shared/types/GamePlayer";
import { z } from "zod";
import { characters } from "../../models/characters";
import type { GameSession } from "../../models/GameSession";
import { getStoryMetadata } from "../../models/gameStory";
import SmallPlayerCard from "../SmallPlayerCard.svelte";

const { gameSession, storyId } = $props<{
	gameSession: GameSession;
	storyId: string;
}>();

let roles: { tag: string; name: string }[] = $state([]);
let gamemode: string | undefined = $state(undefined);
const assignedPlayer: Record<string, GamePlayer> = $state({});
let myRole: string = $state("");
let selectedCharacter: Character | undefined = $state(undefined);
let readyToPlay: boolean = $state(false);

getStoryMetadata(storyId)
	.then((data) => {
		gamemode = data.gamemode;
		roles = data.roles;
		if (gamemode === "no-roles") {
			myRole = gameSession.myUserId;
		}
	})
	.catch((err) => {
		faro.api.pushError(err);
		alert(err);
	});

function selectedRole(tag: string, user: GamePlayer) {
	// remove previous votes
	for (const tag in assignedPlayer) {
		if (assignedPlayer[tag]?.userId === user.userId) {
			delete assignedPlayer[tag];
		}
	}

	// add new vote
	assignedPlayer[tag] = user;
}

gameSession.addListener("player-ready", (data: unknown) => {
	const newData = z
		.object({
			player: GamePlayer,
			role: z.object({ tag: z.string() }),
		})
		.parse(data);
	gameSession.setPlayer(newData.player);
	selectedRole(newData.role.tag, newData.player);
});

gameSession.addListener("reject-player-ready", (_data: unknown) => {
	myRole = gamemode === "no-roles" ? gameSession.myUserId : "";
	readyToPlay = false;
});

function readyPlay() {
	readyToPlay = true;
	gameSession.sendServer("player-ready", {
		character: selectedCharacter,
		role: { tag: myRole },
	});
}

function select_character(char: Character) {
	selectedCharacter = char;
}
</script>

{#if !readyToPlay}
    {#if gamemode && gamemode !== "no-roles"}
        <h2 class="text-2xl font-semibold pl-12 py-4">Rôles disponibles</h2>

        <div class="flex flex-wrap flex-row gap-4">
            {#each roles as role}
                {#if assignedPlayer?.[role.tag]}
                    <SmallPlayerCard
                        customClass={myRole === role.tag
                            ? "bg-cactus-700/70 text-white border-4 border-cactus-900"
                            : "bg-cactus-700/70 text-white hover:bg-cactus-800/85"}
                        user={{
                            userId: assignedPlayer[role.tag]?.userId,
                            id: assignedPlayer[role.tag]?.data?.character_id,
                            avatar: assignedPlayer[role.tag]?.data?.avatar ?? "add.png",
                            name: `${assignedPlayer[role.tag].data?.character_name} is ${role.name}`,
                        }}
                        onclick={() => {}}
                    />
                {:else}
                    <SmallPlayerCard
                        customClass={myRole === role.tag
                            ? "bg-cactus-700/70 text-white border-4 border-cactus-900"
                            : "bg-cactus-700/70 text-white hover:bg-cactus-800/85"}
                        user={{
                            avatar: "add.png",
                            name: role.name,
                        }}
                        onclick={() => (myRole = role.tag)}
                    />
                {/if}
            {/each}
        </div>
    {/if}

    <h2 class="text-xl xs:text-2xl font-semibold text-center xs:text-left xs:pl-12 py-4">
        {#if $characters.length >= 1}
            Jouer avec le personnage de
        {:else}
            Utiliser la bibliothèque de personnage ci-dessus pour créer votre personnage
        {/if}
    </h2>

    <div class="flex flex-wrap flex-col xs:flex-row gap-4 items-center xs:items-start">
        {#each $characters as character}
            <SmallPlayerCard
                customClass={selectedCharacter?.id === character.id
                    ? "bg-cactus-700/70 text-white border-4 border-cactus-900"
                    : "bg-cactus-700/70 text-white hover:bg-cactus-800/85"}
                user={character}
                onclick={() => select_character(character)}
            />
        {/each}
    </div>

    <div class="w-full text-center py-4 sm:p-8">
        {#if selectedCharacter && myRole}
            <button
                class="bg-night-600 text-white p-4 font-semibold text-lg xs:text-xl rounded-2xl hover:bg-night-700"
                onclick={readyPlay}
            >
                Prêt à jouer
            </button>
        {/if}
    </div>
{:else}
    <h2 class="text-xl xs:text-2xl font-semibold text-center xs:text-left xs:pl-12 py-4">
        En attente des autres joueurs
    </h2>

    {#if gamemode && gamemode !== "no-roles"}
        <div class="flex flex-wrap flex-row gap-4">
            {#each roles as role}
                {#if assignedPlayer?.[role.tag]}
                    <SmallPlayerCard
                        customClass={assignedPlayer[role.tag].userId ===
                        gameSession.myUserId
                            ? "bg-cactus-700/70 text-white border-4 border-cactus-900"
                            : "bg-cactus-700/70 text-white hover:bg-cactus-800/85"}
                        user={{
                            userId: assignedPlayer[role.tag]?.userId,
                            id: assignedPlayer[role.tag]?.data?.character_id,
                            avatar: assignedPlayer[role.tag]?.data?.avatar ?? "add.png",
                            name: `${assignedPlayer[role.tag].data?.character_name} is ${role.name}`,
                        }}
                        onclick={() => {}}
                    />
                {:else}
                    <SmallPlayerCard
                        customClass="bg-cactus-700/70 text-white hover:bg-cactus-800/85"
                        user={{
                            avatar: "add.png",
                            name: role.name,
                        }}
                        onclick={() => {}}
                    />
                {/if}
            {/each}
        </div>
    {:else}
        <div class="flex flex-wrap flex-row gap-4">
            {#each gameSession.players as player}
                {#if assignedPlayer?.[player.userId]}
                    <SmallPlayerCard
                        customClass={player.userId ===
                        gameSession.myUserId
                            ? "bg-cactus-700/70 text-white border-4 border-cactus-900"
                            : "bg-cactus-700/70 text-white hover:bg-cactus-800/85"}
                        user={{
                            userId: player.userId,
                            id: assignedPlayer[player.userId]?.data?.character_id,
                            avatar: assignedPlayer[player.userId]?.data?.avatar ?? "add.png",
                            name: `${assignedPlayer[player.userId].username} is ${assignedPlayer[player.userId]?.data?.character_name}`,
                        }}
                        onclick={() => {}}
                    />
                {:else}
                    <SmallPlayerCard
                        customClass="bg-cactus-700/70 text-white hover:bg-cactus-800/85"
                        user={{
                            avatar: "add.png",
                            name: player.username,
                        }}
                        onclick={() => {}}
                    />
                {/if}
            {/each}
        </div>
    {/if}

    <div class="w-full text-center py-4 sm:p-8">
        <button
            class="bg-night-600 text-white p-2 px-4 xs:p-4 font-semibold text-lg xs:text-xl rounded-2xl hover:bg-night-700"
            onclick={() => {
                readyToPlay = false;
            }}
        >
            Modifier mon choix de personnage
        </button>
    </div>
{/if}
