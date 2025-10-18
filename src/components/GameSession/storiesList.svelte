<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import type { GamePlayer } from "@shared/types/GamePlayer";
import type { GameSession } from "@shared/types/GameSession";
import type { Stories } from "@shared/types/Story";
import { z } from "zod";
import { getGameStories } from "../../models/gameStory";

const { gameSession } = $props<{
	gameSession: GameSession;
}>();

let stories: Stories = $state([]);
const votes: Record<string, GamePlayer[]> = $state({});
let myvote: string = $state("");

getGameStories()
	.then((data) => {
		stories = data;
	})
	.catch((err) => {
		faro.api.pushError(err);
		alert(err);
	});

function saveVote(storyId: string, user: GamePlayer) {
	// remove previous votes
	for (const storyId in votes) {
		if (Array.isArray(votes?.[storyId])) {
			votes[storyId] = votes[storyId].filter((el) => el.userId !== user.userId);
		}
	}

	// add new vote
	if (!votes?.[storyId]) votes[storyId] = [];
	votes[storyId].push(user);
}

gameSession.addListener("vote-story", (data: unknown) => {
	const { userId, storyId } = z
		.object({ userId: z.string(), storyId: z.string() })
		.parse(data);
	const target = gameSession.getPlayer(userId);
	saveVote(storyId, target);
});

function vote(storyId: string) {
	gameSession.sendServer("vote-story", {
		storyId,
	});
	myvote = storyId;
}
</script>

<h2 class="text-2xl font-semibold pl-12 py-4">Aventures disponibles</h2>

<div class="flex flex-wrap flex-row gap-4">
    {#each stories as story}
        <button
            class={[
                "h-32 min-w-32 shadow-xl rounded-2xl p-4 text-white font-semibold bg-cactus-700/60 hover:bg-cactus-800/70",
                myvote === story.id
                    ? "border-cactus-900 border-4"
                    : "",
            ]}
            onclick={() => vote(story.id)}
        >
            {story.name}

            <!-- {#if votes?.[story.id]?.length >= 1}
                <span
                    class="px-1 py-px m-2 rounded bg-red-500 text-white font-semibold"
                >
                    +{votes[story.id].length}
                </span>
            {/if} -->

            {#each votes?.[story.id] as voter}
                <span
                    class="p-1 m-1 rounded bg-night-700 text-white text-xs whitespace-nowrap"
                >
                    + {voter.username}
                </span>
            {/each}
        </button>
    {/each}
</div>
