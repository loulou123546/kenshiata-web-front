<script lang="ts">
    import { type User, getAvatarSource } from "../models/user.ts";
    let { user, onclick, customClass } = $props<{
        user: User;
        onclick: () => void;
        customClass?: string;
    }>();

    if (!customClass) {
        customClass = "bg-gray-200 text-black";
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
</button>
