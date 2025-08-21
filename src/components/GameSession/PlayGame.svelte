<script lang="ts">
import type { GamePlayer } from "@shared/types/GamePlayer";
import {
	type StoryLine,
	StorySituation,
	type Storychoice,
} from "@shared/types/InkStory";
import { z } from "zod";
import type { GameSession } from "../../models/GameSession";
import { getAvatarSource } from "../../models/characters";

const { gameSession }: { gameSession: GameSession } = $props<{
	gameSession: GameSession;
}>();

let texts: StoryLine[] = $state([]);
let choices: Storychoice[] = $state([]);
let votes: GamePlayer[][] = $state([]);

function resetPlayerVote(userId: string) {
	votes = votes.map((players) =>
		players.filter((player) => player.userId !== userId),
	);
}

gameSession.addListener("game-continue", (raw: unknown) => {
	const data = z.object({ ink_data: StorySituation }).parse(raw).ink_data;
	texts = [...texts, ...data.lines];
	choices = data.choices;
	votes = [];
	for (let i = 0; i < choices.length; i++) {
		votes[i] = [];
	}
});

function voteForChoice(index: number) {
	const me = gameSession.getMyPlayer();
	if (me === undefined) return;
	resetPlayerVote(me.userId);
	votes[index].push(me);

	gameSession.sendServer("game-choice", {
		choiceIndex: index,
	});
}
</script>

<div class="p-8 bg-gray-300">
    {#each texts as text}
        <p class="mb-2">
            {text.text}
            <i class="opacity-60">
                {text.tags.map((el) => `#${el}`).join(" ")}
            </i>
        </p>
    {/each}

    <div class="flex flex-row flex-wrap">
        {#each choices as choice}
            <button
                class="m-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                onclick={() => voteForChoice(choice.index)}
            >
                <div class="flex flex-row items-center justify-center">
                    <span class="px-2">{choice.text}</span>
                    {#each votes[choice.index] as player}
                        <img
                            src={getAvatarSource(player?.data?.avatar)}
                            alt={player?.data?.character_name ??
                                player.username}
                            class="inline-block w-8 h-8 rounded-full -mr-3 last:mr-0"
                        />
                    {/each}
                </div>
            </button>
        {/each}
    </div>
</div>
