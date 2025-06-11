<script lang="ts">
    import { user, type User, getAvatarSource } from "../../models/user.ts";
    import CreatePlayer from "../../components/CreatePlayer.svelte";
    import SmallPlayerCard from "../../components/SmallPlayerCard.svelte";
    import MatchMaking from "../../components/MatchMaking.svelte";
    import SocketAPI from "../../services/socketAPI.ts";

    let me: User = $state(user.get());
    let editingUser: boolean = $state(user.get().username === "");
    let socket = $state<SocketAPI>(new SocketAPI());
    let authentificationDone: boolean = $state(false);

    async function onSaveUser() {
        authentificationDone = false;
        me = user.get();
        editingUser = false;
        await socket.connected();
        await socket.authenticate(me);
        authentificationDone = true;
    }

    // svelte-ignore state_referenced_locally
    if (!editingUser) {
        onSaveUser();
    }
</script>

<main>
    {#if editingUser}
        <CreatePlayer whenready={onSaveUser} />
    {:else}
        <header class="flex flex-row justify-end">
            <SmallPlayerCard user={me} onclick={() => (editingUser = true)} />
        </header>
        <MatchMaking {socket} socketReady={authentificationDone} />
    {/if}
</main>
