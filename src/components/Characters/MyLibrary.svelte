<script lang="ts">
import type { Character } from "@shared/types/Character";
import { listCharacters } from "../../models/characters";
import SmallPlayerCard from "../SmallPlayerCard.svelte";
import EditForm from "./EditForm.svelte";

// biome-ignore lint: username is modified on bind:value
let loading: Promise<Character[]> = $state(listCharacters());
// biome-ignore lint: username is modified on bind:value
let editing: Character | {} | undefined = $state(undefined);
// biome-ignore lint: username is modified on bind:value
let selected: Character | undefined = $state(undefined);
</script>

<div
    class="w-full p-8 bg-gray-700 text-white rounded-xl flex flex-col flex-wrap items-center justify-center"
>
    <h2 class="text-2xl text-center py-4">Ma Bibliothèque de personnages</h2>

    {#if editing}
        <EditForm
            source={editing}
            onclose={() => {
                loading = listCharacters();
                editing = undefined;
            }}
        />
    {:else}
        {#await loading}
            <div class="text-white text-lg">Chargement des personnages...</div>
        {:then characters}
            <div class="flex flex-row items-center justify-center w-full gap-8">
                {#each characters as character}
                    <SmallPlayerCard
                        customClass={selected?.id === character.id
                            ? "bg-gray-200 text-black border-5 border-blue-500"
                            : "bg-gray-200 text-black hover:bg-gray-400"}
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
            </div>
        {:catch error}
            <div class="text-red-500">
                Erreur lors du chargement des personnages: {error.message}
            </div>
        {/await}
    {/if}
</div>
