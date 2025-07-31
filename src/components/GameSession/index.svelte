<script lang="ts">
	import type {
		GamePlayerModel,
		GameSession,
		GameSessionModel,
	} from "../../models/GameSession";
	import { GameStory } from "../../models/gameStory";
	import PlayGame from "./PlayGame.svelte";
	import CharacterSelection from "./characterSelection.svelte";
	import StoriesList from "./storiesList.svelte";

	const { gameSession } = $props<{
		gameSession: GameSession;
	}>();

	let story: GameStory | undefined = $state(undefined);
	let playing: boolean = $state(false);

	gameSession.addListener(
		"start-story",
		(data: { session_data: GameSessionModel["data"] }) => {
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
			data.session.players.forEach((el: GamePlayerModel) => {
				gameSession.setPlayer(el);
			});
			playing = true;
		},
	);
</script>

{#if !story}
	<StoriesList {gameSession} />
{:else if !playing}
	Running {story.name} !
	<CharacterSelection {gameSession} storyId={story.id} />
{:else}
	<PlayGame {gameSession} />
{/if}
