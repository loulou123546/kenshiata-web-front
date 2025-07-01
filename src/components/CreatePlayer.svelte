<script lang="ts">
import { Avatars, getAvatarSource, user } from "../models/user.ts";
const { whenready } = $props();

// biome-ignore lint: username is modified on bind:value
let username: string = $state(user.get().username);
let avatar: string = $state(user.get().avatar);

function save() {
	user.set({
		...user.get(),
		username: username,
		avatar: avatar,
	});
	whenready();
}

function setAvatarImage(avatarImg: string) {
	avatar = avatarImg;
}
</script>

<div class="p-4 m-8 rounded-xl bg-gray-200 shadow-lg text-center">
    <h3 class="text-xl">Créer mon avatar</h3>

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
        placeholder="Surnom"
        bind:value={username}
    />
    <br />
    <button
        class="mt-6 py-2 px-4 bg-green-600 text-white font-semibold"
        onclick={save}>Sauvegarder mon personnage</button
    >
</div>
