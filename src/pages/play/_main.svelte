<script lang="ts">
    import { user, type User, getAvatarSource } from "../../models/user.ts";
    import CreatePlayer from "../../components/CreatePlayer.svelte";
    import SmallPlayerCard from "../../components/SmallPlayerCard.svelte";
    import MatchMaking from "../../components/MatchMaking.svelte";
    import Gameplay from "../../components/Gameplay.svelte";
    import ChooseGameFile from "../../components/ChooseGameFile.svelte";
    import LoginWall from "../../components/LoginWall.svelte";
    import CharacterLibrary from "../../components/Characters/MyLibrary.svelte";
    import SocketAPI from "../../services/socketAPI.ts";
    import type { GameNetwork } from "../../models/GameNetwork.ts";
    import { getUserData } from "../../services/auth.ts";

    const { stories } = $props<{
        stories: string[];
    }>();

    let okLogin: boolean = $state(false);

    let me: User = $state(user.get());
    let editingUser: boolean = $state(user.get().username === "");
    // let socket = $state<SocketAPI>(new SocketAPI());
    let authentificationDone: boolean = $state(false);
    let gameNetwork: GameNetwork | undefined = $state(undefined);
    let gameFile: string | undefined = $state(undefined);

    async function onSaveUser() {
        authentificationDone = false;
        me = user.get();
        editingUser = false;
        // await socket.connected();
        // await socket.authenticate(me);
        authentificationDone = true;
    }

    // svelte-ignore state_referenced_locally
    if (!editingUser) {
        onSaveUser();
    }
</script>

<main class="p-8">
    {#if !okLogin}
        <LoginWall whenLoginOK={() => (okLogin = true)} />
        <!-- {:else if editingUser}
        <CreatePlayer whenready={onSaveUser} /> -->
    {:else}
        <header class="flex flex-row justify-center items-center">
            {#if gameFile}
                <h1 class="text-2xl font-semibold pl-16 pr-4">
                    {gameFile.replace(".json", "")}
                </h1>
            {/if}
            <div class="grow"></div>
            <!-- <SmallPlayerCard user={me} onclick={() => (editingUser = true)} /> -->
        </header>
        <CharacterLibrary />
        {#if gameNetwork}
            {#if gameFile}
                <Gameplay {gameNetwork} {gameFile} />
            {:else}
                <ChooseGameFile
                    {gameNetwork}
                    {stories}
                    onGameFileSelected={(file: string) => (gameFile = file)}
                />
            {/if}
        {:else}
            <!-- <MatchMaking
                socketReady={authentificationDone}
                onNetworkReady={(instance) => (gameNetwork = instance)}
            /> -->
            <MatchMaking />
        {/if}
    {/if}
</main>
