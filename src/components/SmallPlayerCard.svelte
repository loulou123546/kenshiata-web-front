<script lang="ts">
import { type User, getAvatarSource } from "../models/user.ts";
let { user, onclick, onedit, customClass } = $props<{
	user: User;
	onclick: () => void;
	onedit?: () => void;
	customClass?: string;
}>();

if (!customClass) {
	customClass = "bg-gray-200 text-black hover:bg-gray-400";
}
</script>

<button
    class={[
        "py-2 px-6 m-2 lg:m-8 rounded-xl shadow-lg flex flex-row items-center justify-center w-fit",
        customClass,
    ]}
    {onclick}
>
    <img
        class="w-14 h-14 rounded-full"
        src={getAvatarSource(user.avatar)}
        alt="Avatar de {user.username}"
    />
    <h3 class="text-xl mx-4">{user.username}</h3>
    {#if onedit}
        <a
            class="text-gray-600 hover:text-gray-900"
            href="#"
            onclick={onedit}
            aria-label="Edit User"
        >
            <i class="fa fa-pen"></i>
        </a>
    {/if}
</button>
