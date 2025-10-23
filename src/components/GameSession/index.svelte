<script lang="ts">
import {
	GameSessionData,
	GameSession as GameSessionModel,
} from "@shared/types/GameSession";
import { GameStory } from "@shared/types/GameStory";
import { z } from "zod";
import type { GameSession } from "../../models/GameSession";
import CharacterSelection from "./characterSelection.svelte";
import PlayGame from "./PlayGame.svelte";
import StoriesList from "./storiesList.svelte";

const { gameSession }: { gameSession: GameSession } = $props<{
	gameSession: GameSession;
}>();

let story: GameStory | undefined = $state(undefined);
let playing: boolean = $state(false);

if (gameSession.already_running) {
	story = {
		id: gameSession.data.story?.id ?? "",
		name: gameSession.data.story?.name ?? "",
	};
	playing = true;
} else {
	gameSession.addListener("start-story", (data: unknown) => {
		const sd = z
			.object({ session_data: GameSessionData })
			.parse(data).session_data;
		gameSession.data = sd;
		story = GameStory.parse(sd?.story);
	});

	gameSession.addListener("game-running", (data: unknown) => {
		const session = z.object({ session: GameSessionModel }).parse(data).session;
		gameSession.sessionId = session.id;
		gameSession.name = session.name;
		if (session.data) gameSession.data = session.data;
		for (const player of session.players) {
			gameSession.setPlayer(player);
		}
		playing = true;
	});
}
</script>

{#if !story}
	<StoriesList {gameSession} />
{:else if !playing}
	<!-- Running {story.name} ! -->
	<CharacterSelection {gameSession} storyId={story.id} />
{:else}
	<PlayGame {gameSession} />
{/if}
