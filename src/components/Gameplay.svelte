<script lang="ts">
    import { GameNetwork } from "../models/GameNetwork.ts";
    import GameChoice from "./GameChoice.svelte";
    import { Story } from "inkjs";
    // https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api

    const { gameNetwork, gameFile } = $props<{
        gameNetwork: GameNetwork;
        gameFile: string;
    }>();
    let texts: string[] = $state([]);
    let choices: { title: string; index: number }[] = $state([]);
    let onChoiceChange: () => void = $state(() => {});

    let story: Story;

    gameNetwork.addListener("game-update", (data: any) => {
        if (Array.isArray(data.texts)) {
            data.texts.forEach((text: string) => {
                texts.push(text);
            });
        }
        if (Array.isArray(data.choices)) {
            onChoiceChange();
            choices = data.choices.map((choice: any) => ({
                title: choice.title,
                index: choice.index,
            }));
        }
    });

    function runStory(selectIndex?: number) {
        if (!story) return;
        if (selectIndex !== undefined) {
            story.ChooseChoiceIndex(selectIndex);
        }

        const toSend: {
            texts: string[];
            choices: { index: number; title: string }[];
        } = {
            texts: [],
            choices: [],
        };
        while (story.canContinue) {
            choices = [];
            const txt = story.Continue();
            if (txt) {
                texts.push(txt);
                toSend.texts.push(txt);
            }
        }
        if (story.currentChoices.length > 0) {
            onChoiceChange();
            choices.push(
                ...story.currentChoices.map((choice, index) => ({
                    title: choice.text,
                    index: index,
                })),
            );
            toSend.choices = story.currentChoices.map((choice, index) => ({
                title: choice.text,
                index: index,
            }));
        }
        if (gameNetwork.isHost) {
            gameNetwork.send("game-update", toSend);
        }
    }

    if (gameNetwork.isHost) {
        setTimeout(() => {
            fetch("/" + gameFile)
                .then((response) => response.text())
                .then((storyContent) => {
                    story = new Story(storyContent);
                    runStory();
                })
                .catch((error) => {
                    alert("Error loading story:" + error);
                });
        }, 100);
    } else {
        console.log("Waiting for host to start the story...");
    }

    function exportState() {
        localStorage.setItem("storyContent", JSON.stringify(texts.slice(-10)));
        localStorage.setItem("storyState", story.state.toJson());
    }
    function restoreState() {
        texts = [
            "[...]",
            ...JSON.parse(localStorage.getItem("storyContent") || "[]"),
        ];
        choices = [];
        const savedState = localStorage.getItem("storyState");
        if (savedState) {
            story.state.LoadJson(savedState);
            runStory();
        }
    }
</script>

{#if gameNetwork.isHost}
    <h2 class="text-2xl font-bold mb-4">Host</h2>
    <div>
        <button onclick={exportState}> Save state </button>
        <button onclick={restoreState}> Restore state </button>
    </div>
{:else}
    <h2 class="text-2xl font-bold mb-4">Player</h2>
{/if}
<div class="p-8 bg-gray-300">
    {#each texts as text}
        <p class="mb-2">{text}</p>
    {/each}

    <GameChoice
        {gameNetwork}
        {choices}
        voteMode="all-must-approve"
        onValidated={runStory}
        provideResetFunction={(reset) => (onChoiceChange = reset)}
    />
</div>
