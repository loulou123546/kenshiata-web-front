<script lang="ts">
import type { GamePlayerModel, GameSession } from "../../models/GameSession";
    import { type GameStory, getGameStories } from "../../models/gameStory";
    const { gameSession } = $props<{
        gameSession: GameSession;
    }>();

    let stories: GameStory[] = $state([]);
    let votes: Record<string, GamePlayerModel[]> = $state({});
    let myvote: string = $state("");

    getGameStories()
        .then((data) => {
            stories = data;
        })
        .catch((err) => alert(err));

    function saveVote(storyId: string, user: GamePlayerModel) {
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

    gameSession.addListener("vote-story", (data: any) => {
        const target = gameSession.getPlayer(data.userId);
        saveVote(data.storyId, target);
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
                "size-32 border shadow-xl rounded-2xl p-4 bg-gray-100 hover:bg-gray-200",
                myvote === story.id
                    ? "border-blue-500 border-4"
                    : "border-gray-300",
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
                    class="p-1 m-1 rounded bg-blue-500 text-white text-xs whitespace-nowrap"
                >
                    + {voter.username}
                </span>
            {/each}
        </button>
    {/each}
</div>
