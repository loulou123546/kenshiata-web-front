<script lang="ts">
import { createCharacter, editCharacter } from "../../models/characters.ts";
import { Avatars, getAvatarSource } from "../../models/user.ts";
const { onclose, source } = $props();

// biome-ignore lint: username is modified on bind:value
let username: string = $state(source?.name ?? "");
let avatar: string = $state(
	source?.avatar ?? Avatars[Math.floor(Math.random() * Avatars.length)],
);

async function save() {
	if (source?.id && source?.userId) {
		await editCharacter({
			id: source.id,
			userId: source.userId,
			name: username,
			avatar: avatar,
		});
	} else {
		await createCharacter({
			name: username,
			avatar: avatar,
		});
	}
	onclose();
}

function setAvatarImage(avatarImg: string) {
	avatar = avatarImg;
}
</script>

<div
    class="p-4 m-8 rounded-xl bg-gray-300 text-black shadow-lg text-center relative"
>
    <h3 class="text-xl">
        {#if source}
            Modifier {source.name}
        {:else}
            Créer un personnage
        {/if}
    </h3>
    <button
        class="absolute top-3 right-5 text-2xl text-gray-700 hover:text-black"
        aria-label="Close"
        onclick={onclose}
    >
        <i class="fa fa-times"></i>
    </button>

    <div class="flex flex-wrap flex-row items-center justify-center py-2">
        {#each Avatars as avatarImg}
            <button onclick={() => setAvatarImage(avatarImg)}>
                <img
                    class={[
                        "w-24 h-24 rounded-full m-2 cursor-pointer",
                        avatar === avatarImg && "border-4 border-green-500",
                    ]}
                    src={getAvatarSource(avatarImg)}
                    alt="Avatar {avatarImg}"
                />
            </button>
        {/each}
    </div>

    <input
        class="p-2 my-2 rounded-lg border border-gray-400 min-w-1/2"
        type="text"
        placeholder="Nom du personnage"
        bind:value={username}
    />
    <br />
    <button
        class="mt-6 py-2 px-4 bg-green-600 text-white font-semibold"
        onclick={save}>Sauvegarder</button
    >
</div>
