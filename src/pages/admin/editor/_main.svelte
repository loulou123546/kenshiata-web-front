<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import type { Stories, Story } from "@shared/types/Story";
import debounce from "lodash/debounce";
import InkEditor from "../../../components/AdminEditor/InkEditor.svelte";
// import InkGraph from "../../../components/InkGraph.svelte";
import InkPlayer from "../../../components/AdminEditor/InkPlayer.svelte";
import LoginWall from "../../../components/LoginWall.svelte";
import {
	createStory,
	editStory,
	getStory,
	listStoriesByAuthor,
} from "../../../models/stories";

let okLogin: boolean = $state(false);
let loading: boolean = $state(true);
let saving: number = $state(Date.now());
let latest_save: number = $state(Date.now());
let stories: Stories = $state([]);
let selected_story: Story | undefined = $state(undefined);
let inkContent: string = $state("");

function loginDone() {
	okLogin = true;
}

listStoriesByAuthor("me")
	.then((data) => {
		stories = data;
		loading = false;
	})
	.catch((err) => {
		faro.api.pushError(err);
		loading = false;
	});

async function newStory() {
	const name = prompt(
		"Donner un nom à votre histoire",
		`Brouillon du ${(new Date()).toLocaleString()}`,
	);
	if (!name) return;
	loading = true;
	const story = await createStory(name);
	if (story) stories.push(story);
	loading = false;
}

function selectStory(id: string) {
	loading = true;
	getStory(id)
		.then((el) => {
			selected_story = el;
			inkContent = el?.ink || "";
			loading = false;
		})
		.catch((err) => {
			faro.api.pushError(err);
			loading = false;
		});
}

const saveStory = debounce(
	() => {
		const saved_at = Date.now();
		if (!selected_story) return;
		return editStory(selected_story)
			.then(() => {
				latest_save = saved_at;
			})
			.catch((err) => faro.api.pushError(err));
	},
	3500,
	{ trailing: true },
);

function handleInkChange(value: string) {
	saving = Date.now();
	inkContent = value;
	if (!selected_story) return;
	selected_story.ink = value;
	saveStory();
}

async function forceSaveBack() {
	await saveStory.flush();
	selected_story = undefined;
}
</script>

<main class="p-8">
	{#if !okLogin}
        <LoginWall whenLoginOK={loginDone} />
    {:else}
		{#if !selected_story}
			<section class="p-6 border border-gray-400 rounded-xl">
				<h2 class="text-xl text-center pb-4 font-semibold">Mes histoires</h2>
				<div class="flex flex-row flex-wrap gap-x-4 gap-y-2">
					{#each stories as story}
						<button onclick={() => selectStory(story.id)} class="bg-gray-200/85 hover:bg-gray-300 px-4 py-2 rounded-lg">{story.name}</button>
					{/each}
					<button onclick={newStory} class="bg-gray-200/85 hover:bg-gray-300 px-4 py-2 rounded-lg"><i class="fa fa-plus pr-1"></i> Nouvelle histoire</button>
				</div>
			</section>

		{:else}
			<button onclick={forceSaveBack} class="bg-gray-200/85 hover:bg-gray-300 px-4 py-2 mb-2 rounded-lg"><i class="fa fa-arrow-left pr-1"></i> Retour</button>
			
			<section class="w-full p-6 border border-gray-400 rounded-xl">
				<h3 class="text-lg font-semibold mb-4">{selected_story.name}
					{#if saving <= latest_save}
					<i class="fa-regular fa-circle-check text-green-600"></i>
					{:else}
					<i class="fa-solid fa-rotate text-gray-700 fa-spin"></i>
					{/if}
				</h3>
				<div class="w-full flex flex-row flex-wrap">
					<InkEditor 
						value={inkContent} 
						onchange={handleInkChange} 
						class="h-[50vh] w-1/2" 
					/>
					<InkPlayer value={inkContent} class="w-1/2" />
				</div>
					<!-- <InkGraph value={inkContent} class="w-full" /> -->
			</section>
		{/if}

	{/if}
</main>
