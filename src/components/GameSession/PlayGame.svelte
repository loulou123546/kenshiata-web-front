<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import { Achievement } from "@shared/types/Achievement";
import { GamePlayer } from "@shared/types/GamePlayer";
import {
	type Storychoice,
	type StoryLine,
	StorySituation,
} from "@shared/types/InkStory";
import { z } from "zod";
import AchivementNotyf from "../../components/Achievements/Achievement.svelte";
import { myAchievements } from "../../models/Achievements";
import { getAvatarSource } from "../../models/characters";
import type { GameSession } from "../../models/GameSession";
import notyf from "../../services/notyf";

const { gameSession }: { gameSession: GameSession } = $props<{
	gameSession: GameSession;
}>();

let texts: StoryLine[] = $state([]);
let choices: Storychoice[] = $state([]);
let votes: GamePlayer[][] = $state([]);
const render_achievements: Achievement[] = $state([]);

faro.api.setView({
	name: "game",
});

function resetPlayerVote(userId: string) {
	votes = votes.map((players) =>
		players.filter((player) => player.userId !== userId),
	);
}
function setPlayerVote(player: GamePlayer, index: number) {
	votes = votes.map((players, ind) => {
		if (ind === index) return [...players, player];
		else return players;
	});
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

gameSession.addListener("update-player", (raw: unknown) => {
	try {
		const player = z.object({ player: GamePlayer }).parse(raw).player;
		gameSession.setPlayer(player);
	} catch (err) {
		faro.api.pushError(err as Error);
	}
});

gameSession.addListener("player-join-left", (raw: unknown) => {
	try {
		const data = z.object({ join: z.boolean(), name: z.string() }).parse(raw);
		if (data.join) notyf.info(`Le joueur ${data.name} à rejoint la partie`);
		else
			notyf.warning({
				message: `Le joueur ${data.name} à quitter la partie, le jeu est en pause en attendant son retour`,
				duration: 10000,
				dismissible: true,
			});
	} catch (err) {
		faro.api.pushError(err as Error);
	}
});

gameSession.addListener("game-choice", (raw: unknown) => {
	try {
		const data = z
			.object({ userId: z.string(), choiceIndex: z.number() })
			.parse(raw);
		faro.api.pushEvent("received game-choice with", {
			userId: data.userId,
			choiceIndex: `${data.choiceIndex}`,
		});

		const player = gameSession.getPlayer(data.userId);
		if (player) {
			resetPlayerVote(player.userId);
			setPlayerVote(player, data.choiceIndex);
		} else {
			faro.api.pushError(
				new Error(
					`Received vote from player id ${data.userId} but cannot find player in gameSession`,
				),
			);
			// console.error(
			// 	`Received vote from player id ${data.userId} but cannot find player in gameSession`,
			// );
		}
	} catch (err) {
		faro.api.pushEvent("received game-choice with", {
			data: JSON.stringify(raw),
		});
		faro.api.pushError(err as Error);
		// console.error(err);
	}
});

function loop_over_achievements() {
	render_achievements.pop();
	if (render_achievements.length >= 1) {
		setTimeout(loop_over_achievements, 12000);
	}
}

gameSession.addListener("earn-achievements", (raw: unknown) => {
	const achievements = z
		.object({ achievements: z.array(Achievement) })
		.parse(raw).achievements;
	achievements.forEach((ach) => {
		if (render_achievements.length < 1) {
			// setup loop if it's first item in array
			setTimeout(loop_over_achievements, 12000);
		}
		render_achievements.push(ach);
		myAchievements.set([
			...$myAchievements,
			{
				userId: gameSession.myUserId,
				storyId: ach.storyId,
				achievementId: ach.id,
				title: ach.title,
				description: ach.description,
				public: ach.public,
				firstEarned: new Date().toISOString(),
			},
		]);
	});
});

function voteForChoice(index: number) {
	const me = gameSession.getMyPlayer();
	if (me === undefined) return;
	resetPlayerVote(me.userId);
	setPlayerVote(me, index);

	gameSession.sendServer("game-choice", {
		choiceIndex: index,
	});
}
</script>

<div class="p-8 max-w-[640px] mx-auto text-justify">
    {#each texts as text}
        <p class="mb-2">
            {text.text}
            <!-- <i class="opacity-60">
                {text.tags.map((el) => `#${el}`).join(" ")}
            </i> -->
        </p>
    {/each}

    <div class="flex flex-col flex-wrap">
        {#each choices as choice}
            <button
                class="m-2 p-2 bg-cactus-600 text-white rounded hover:bg-cactus-700 w-fit"
                onclick={() => voteForChoice(choice.index)}
            >
                <div class="flex flex-row items-center justify-center">
                    <span class="px-2">{choice.text}</span>
                    {#each votes[choice.index] as player}
                        <img
                            src={getAvatarSource({
								userId: player.userId,
								id: player?.data?.character_id ?? "",
								avatar: player?.data?.avatar ?? "add.png",
								name: player?.data?.character_name ?? player.username
							})}
                            alt={player?.data?.character_name ??
                                player.username}
                            class="inline-block w-8 h-8 rounded-full -mr-3 last:mr-0"
                        />
                    {/each}
                </div>
            </button>
        {/each}
    </div>

	{#if render_achievements.length >= 1}
		<AchivementNotyf title={render_achievements[0].title} description={render_achievements[0].description} disabled={false} notyf={true} />
	{/if}
</div>
