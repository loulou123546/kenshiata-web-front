<script lang="ts">
import { Story } from "inkjs";
// https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api

const { send, listen, isHost } = $props();
let texts: string[] = $state([]);
let choices: { title: string; index: number }[] = $state([]);

let story: Story;

listen("game-update", (data: any) => {
	if (Array.isArray(data.texts)) {
		data.texts.forEach((text: string) => {
			texts.push(text);
		});
	}
	if (Array.isArray(data.choices)) {
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
	if (isHost) {
		send("game-update", toSend);
	}
}

if (isHost) {
	fetch("/intercept.json")
		.then((response) => response.text())
		.then((storyContent) => {
			story = new Story(storyContent);
			runStory();
		});
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

{#if isHost}
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

	<div class="flex flex-row flex-wrap">
		{#each choices as choice}
			<button
				class="m-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
				onclick={() => runStory(choice.index)}
			>
				{choice.title}
			</button>
		{/each}
	</div>
</div>
