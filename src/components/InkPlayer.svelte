<script lang="ts">
import { Compiler } from "inkjs/full";

interface Props {
	value?: string;
	class?: string;
}

const { value = "", class: className = "" }: Props = $props();

const story = $derived(new Compiler(value).Compile());

let texts: string[] = $state([]);
let choices: { text: string; index: number }[] = $state([]);

function playScript() {
	while (story.canContinue) {
		texts.push(story.Continue() ?? "--- no more text ---");
	}
	choices = story.currentChoices;
}

function playChoice(index: number) {
	story.ChooseChoiceIndex(index);
	choices = [];
	playScript();
}
playScript();

function reset() {
	texts = [];
	choices = [];
	story.ResetState();
	playScript();
}
</script>

<div class={`flex flex-col ${className}`}>
    <div class="w-full bg-gray-100 flex flex-row p-2">
        <button onclick={reset} class="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg">Reset</button>
    </div>

    <div class="p-4 w-full">
        {#each texts as text}
            <p>{text}</p>
        {/each}
        {#each choices as choice}
            <button class="font-semibold text-gray-700 hover:text-gray-950 block" onclick={() => playChoice(choice.index)}>{choice.text}</button>
        {/each}
    </div>
</div>