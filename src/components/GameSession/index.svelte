<script lang="ts">
    import type { GameSession } from "../../models/GameSession";
    import { GameStory } from "../../models/gameStory";
    import StoriesList from "./storiesList.svelte";
    import CharacterSelection from "./characterSelection.svelte";

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
    <CharacterSelection {gameSession} />
{/if}
