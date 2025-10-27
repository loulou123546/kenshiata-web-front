<script lang="ts">
import { Compiler, type Story } from "inkjs/full";
import { untrack } from "svelte";

interface Props {
	value?: string;
	class?: string;
}

const { value = "", class: className = "" }: Props = $props();

let texts: string[] = $state([]);
let choices: { text: string; index: number }[] = $state([]);
let story: Story | undefined = $state(undefined);
let errors: { message: string; type: number }[] = $state([]);
let show_warnings: boolean = $state(false);

$effect(() => {
	errors = [];
	try {
		const compiled = new Compiler(value, {
			errorHandler: (message: string, type: number) => {
				errors.push({ message, type });
			},
		}).Compile();
		story = compiled;
	} catch (err) {
		if (errors.length < 1) {
			errors.push({ message: `${err?.name}: ${err?.message}`, type: -1 });
		}
		story = undefined;
	}
});

function playScript() {
	if (!story || Array.isArray(story)) return;
	while (story.canContinue) {
		texts.push(story.Continue() ?? "--- no more text ---");
	}
	choices = story.currentChoices;
}

function playChoice(index: number) {
	if (!story || Array.isArray(story)) return;
	story.ChooseChoiceIndex(index);
	choices = [];
	playScript();
}

function reset() {
	texts = [];
	choices = [];
	if (!story || Array.isArray(story)) return;
	story.ResetState();
	playScript();
}

function toggleWarnings() {
	show_warnings = !show_warnings;
}

$effect(() => {
	if (value)
		// track ink text change
		untrack(() => reset()); // but don't track all variables modified by reset
});
</script>

<div class={`flex flex-col ${className}`}>
    <div class="w-full bg-gray-100 flex flex-row p-2">
        <button onclick={reset} class="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg">Reset</button>
		{#if errors.length >= 1}
			<p class="py-2 px-4">There are {errors.length} errors / warnings</p>
		{/if}
        <button onclick={toggleWarnings} class="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-lg">{show_warnings ? "Hide warnings" : "Show warnings"}</button>
    </div>

    <div class="p-4 w-full">
		{#if (show_warnings && errors.length >= 1) || !story}
			{#each errors as error}
				<p class="py-2 px-4">{error.message}</p>
			{/each}
		{:else}
			{#each texts as text}
				<p>{text}</p>
			{/each}
			{#each choices as choice}
				<button class="font-semibold text-gray-700 hover:text-gray-950 block" onclick={() => playChoice(choice.index)}>{choice.text}</button>
			{/each}
		{/if}
    </div>
</div>