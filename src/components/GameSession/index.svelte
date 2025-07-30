<script lang="ts">
import type { GameSession } from "../../models/GameSession";
import { GameStory } from "../../models/gameStory";
import CharacterSelection from "./characterSelection.svelte";
import StoriesList from "./storiesList.svelte";

const { gameSession } = $props<{
	gameSession: GameSession;
}>();

let story: GameStory | undefined = $state(undefined);

gameSession.addListener("start-story", (data: any) => {
	story = GameStory.parse(data.story);
});
</script>

{#if !story}
    <StoriesList {gameSession} />
{:else}
    Running {story.name} !
    <CharacterSelection {gameSession} storyId={story.id} />
{/if}
