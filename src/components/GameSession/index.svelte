<script lang="ts">
import type {
	GameSessionData,
	GameSession as GameSessionModel,
} from "@shared/types/GameSession";
import { GameStory } from "@shared/types/GameStory";
import type { GameSession } from "../../models/GameSession";
import CharacterSelection from "./characterSelection.svelte";
import PlayGame from "./PlayGame.svelte";
import StoriesList from "./storiesList.svelte";

const { gameSession } = $props<{
	gameSession: GameSession;
}>();

let story: GameStory | undefined = $state(undefined);
let playing: boolean = $state(false);

gameSession.addListener(
	"start-story",
	(data: { session_data: GameSessionData }) => {
		const sd = data.session_data;
		gameSession.data = sd;
		story = GameStory.parse(sd?.story);
	},
);

gameSession.addListener(
	"game-running",
	(data: { session: GameSessionModel }) => {
		gameSession.sessionId = data.session.id;
		gameSession.name = data.session.name;
		gameSession.data = data.session.data;
		for (const player of data.session.players) {
			gameSession.setPlayer(player);
		}
		playing = true;
	},
);
</script>

{#if !story}
	<StoriesList {gameSession} />
{:else if !playing}
	<!-- Running {story.name} ! -->
	<CharacterSelection {gameSession} storyId={story.id} />
{:else}
	<PlayGame {gameSession} />
{/if}
