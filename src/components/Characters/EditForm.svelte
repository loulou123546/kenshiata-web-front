<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import imageCompression from "browser-image-compression";
import {
	Avatars,
	createCharacter,
	editCharacter,
	getAvatarSource,
} from "../../models/characters";

const { onclose, source } = $props();

// biome-ignore lint: username is modified on bind:value
let username: string = $state(source?.name ?? "");
let avatar: string = $state(
	source?.avatar ?? Avatars[Math.floor(Math.random() * Avatars.length)],
);
// biome-ignore lint: username is modified on bind:value
let custom_avatar: FileList | undefined = $state();
let avatar_as_b64: string = $state("");

async function save() {
	if (source?.id && source?.userId) {
		await editCharacter({
			id: source.id,
			userId: source.userId,
			name: username,
			avatar: avatar === "new-custom" ? "custom" : avatar,
			avatar_base64:
				avatar === "new-custom" && avatar_as_b64 ? avatar_as_b64 : undefined,
		});
	} else {
		await createCharacter({
			name: username,
			avatar: avatar === "new-custom" ? "custom" : avatar,
			avatar_base64:
				avatar === "new-custom" && avatar_as_b64 ? avatar_as_b64 : undefined,
		});
	}
	onclose();
}

function setAvatarImage(avatarImg: string) {
	avatar = avatarImg;
}

async function prepareCustomAvatar() {
	avatar_as_b64 = "";
	if (!custom_avatar || custom_avatar?.length !== 1) return;
	const file = custom_avatar.item(0);
	if (!file) return;
	try {
		const compressed = await imageCompression(file, {
			maxSizeMB: 1,
			maxWidthOrHeight: 2000,
			useWebWorker: true,
			preserveExif: false,
		});
		avatar_as_b64 = await imageCompression.getDataUrlFromFile(compressed);
		console.log(
			"file as b64 weigth:",
			avatar_as_b64.length,
			"| while original is:",
			file.size,
			"| ratio is",
			(file.size / avatar_as_b64.length).toFixed(2),
			"x smaller",
		);
	} catch (err) {
		console.error(err);
		faro.api.pushError(err as Error);
		avatar_as_b64 = "";
		custom_avatar = undefined;
	}
}
</script>

<div
    class="p-4 m-8 rounded-xl bg-gray-300/40 text-black shadow-lg text-center relative"
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
                        avatar === avatarImg && "border-4 border-cactus-600",
                    ]}
                    src={getAvatarSource(avatarImg)}
                    alt="Avatar {avatarImg}"
                />
            </button>
        {/each}
        {#if source?.avatar === "custom"}
            <button onclick={() => setAvatarImage("custom")}>
                <img
                    class={[
                        "w-24 h-24 rounded-full m-2 cursor-pointer",
                        avatar === "custom" && "border-4 border-cactus-600",
                    ]}
                    src={getAvatarSource(source)}
                    alt="Avatar custom"
                />
            </button>
        {/if}
        <label>
            <input bind:files={custom_avatar} class="hidden" type="file" accept="image/png, image/jpeg" onclick={() => setAvatarImage("new-custom")} onchange={() => prepareCustomAvatar()}>
            <img
                class={[
                    "w-24 h-24 rounded-full m-2 cursor-pointer",
                    avatar === "new-custom" && "border-4 border-cactus-600",
                ]}
                src={avatar_as_b64 ? avatar_as_b64 : getAvatarSource("upload.png")}
                alt="Upload your avatar"
            />
        </label>
    </div>

    <input
        class="p-2 my-2 rounded-lg bg-gray-100/70 min-w-1/2"
        type="text"
        placeholder="Nom du personnage"
        bind:value={username}
    />
    <br />
    <button
        class="mt-6 py-2 px-4 rounded-lg bg-cactus-600 hover:bg-cactus-700 text-white font-semibold"
        onclick={save}>Sauvegarder</button
    >
</div>
