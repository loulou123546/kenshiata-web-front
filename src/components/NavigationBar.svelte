<script lang="ts">
// biome-ignore lint/correctness/noUnusedImports: used on button click
import { disconnect } from "../services/auth";

const { setPanel }: { setPanel: (panel: string) => void } = $props<{
	setPanel: (panel: string) => void;
}>();

let menu_opened: boolean = $state(true);
let last_opened_menu: string = $state("characters");

function openOrClose() {
	menu_opened = !menu_opened;
	setPanel(menu_opened ? last_opened_menu : "close");
}

function openTab(name: string) {
	last_opened_menu = name;
	menu_opened = true;
	setPanel(name);
}

// init
setPanel(menu_opened ? last_opened_menu : "close");
</script>

<nav class="w-full bg-brown-900 text-sand-100 flex flex-row justify-around">
    <button class="p-1" aria-label="Afficher / Cacher le menu" onclick={openOrClose}>
        {#if menu_opened}
            <i class="fa fa-chevron-up fa-lg"></i>
        {:else}
            <i class="fa fa-chevron-down fa-lg"></i>
        {/if}
    </button>
    <button class="p-1" aria-label="Accès à la librairie de personnages" onclick={() => {openTab("characters")}}>
        <i class="fa fa-users fa-lg"></i>
    </button>
    <button class="p-1" aria-label="Accès au succès / achievements" onclick={() => {openTab("achievements")}}>
        <i class="fa fa-trophy fa-lg"></i>
    </button>
    <button class="p-1" aria-label="Se déconnecter" onclick={() => {openTab("disconnect")}}>
        <i class="fa fa-right-from-bracket fa-lg"></i>
    </button>
</nav>

{#if menu_opened && last_opened_menu === "disconnect"}
    <div
        class="w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center p-4 md:p-8"
    >
        <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
            Êtes vous sûr de vouloir vous déconnecter ?
        </div>
        <button class="bg-brown-600 hover:bg-brown-700/80 text-white px-4 py-2 rounded-lg mb-2" onclick={openOrClose}>Annuler</button>
        <button class="bg-red-700/60 hover:bg-red-700/80 text-white px-4 py-2 rounded-lg" onclick={disconnect}>Se déconnecter</button>
    </div>
{/if}
