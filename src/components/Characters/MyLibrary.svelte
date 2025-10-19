<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import type { Character } from "@shared/types/Character";
import { listCharacters } from "../../models/characters";
import notyf from "../../services/notyf";
import SmallPlayerCard from "../SmallPlayerCard.svelte";
import EditForm from "./EditForm.svelte";

// biome-ignore lint: username is modified on bind:value
let loading: Promise<Character[]> = $state(listCharacters());

$effect(() => {
	loading.catch((_err) => {
		notyf.error("Erreur lors du chargement des personnages");
	});
});
// biome-ignore lint: username is modified on bind:value
let editing: Character | {} | undefined = $state(undefined);
// biome-ignore lint: username is modified on bind:value
let selected: Character | undefined = $state(undefined);

let reduce: boolean = $state(false);

function toogleReduce() {
	reduce = !reduce;
}
</script>

<div
    class={[
        "w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center",
        reduce ? "pt-2" : "p-4 md:p-8"
    ]}
>
    <button class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4" onclick={toogleReduce}>Ma Bibliothèque <span class="hidden xs:inline">de personnages</span>
        {#if reduce}
            <i class="fa fa-chevron-down"></i>
        {/if}
    </button>

    {#if editing}
        <EditForm
            source={editing}
            onclose={() => {
                loading = listCharacters();
                editing = undefined;
                loading.catch((err) => {
                    faro.api.pushError(err);
                });
            }}
        />
    {:else if !reduce}
        {#await loading}
            <div class="text-brown-800 md:text-lg">Chargement des personnages <i class="fa fa-spin fa-circle-notch ml-2"></i></div>
        {:then characters}
            <div class="flex flex-col md:flex-row items-center justify-center w-full gap-2 md:gap-x-8 md:gap-y-4">
                {#each characters as character}
                    <SmallPlayerCard
                        customClass={selected?.id === character.id
                            ? "bg-gray-300/40 text-black border-5 border-cactus-700"
                            : "bg-gray-300/40 text-black hover:bg-gray-100/40"}
                        user={character}
                        onclick={() => {
                            selected = character;
                        }}
                        onedit={() => {
                            editing = character;
                        }}
                    />
                {/each}
                <SmallPlayerCard
                    user={{
                        avatar: "add.png",
                        name: "Ajouter",
                    }}
                    onclick={() => {
                        editing = {};
                    }}
                />
                <button class="md:hidden text-sm text-brown-800/70" onclick={toogleReduce}>
                    <i class="fa fa-chevron-up"></i>
                    <span class="underline">Cacher la liste</span>
                    <i class="fa fa-chevron-up"></i>
                </button>
            </div>
        {:catch error}
            <div class="text-red-500">
                Erreur lors du chargement des personnages: {error.message}
            </div>
        {/await}
    {/if}
</div>
