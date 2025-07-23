<script lang="ts">
import type { GameNetwork } from "../models/GameNetwork.ts";
import GameChoice from "./GameChoice.svelte";

const { gameNetwork, onGameFileSelected, stories } = $props<{
	gameNetwork: GameNetwork;
	onGameFileSelected: (file: string) => void;
	stories: string[];
}>();

function onSelected(choiceIndex: number) {
	if (!gameNetwork.isHost) return;
	gameNetwork.send("load-gameplay", {
		gameplayFile: stories[choiceIndex],
	});
	onGameFileSelected(stories[choiceIndex]);
}

gameNetwork.addListener("load-gameplay", (data: any) => {
	if (data.gameplayFile) {
		onGameFileSelected(data.gameplayFile);
	}
});
</script>

<GameChoice
    {gameNetwork}
    choices={stories.map((story: string, index: number) => ({
        title: story.replace(".json", ""),
        index: index,
    }))}
    voteMode="host-win"
    onValidated={onSelected}
    provideResetFunction={() => {}}
/>
