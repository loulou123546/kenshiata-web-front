<script lang="ts">
import { faro } from "@grafana/faro-web-sdk";
import MyAchievements from "../../components/Achievements/MyAchievements.svelte";
import CharacterLibrary from "../../components/Characters/MyLibrary.svelte";
import GameSessionPage from "../../components/GameSession/index.svelte";
import PreviousSaves from "../../components/GameSession/previousSaves.svelte";
import LoginSignup from "../../components/Login-Signup/index.svelte";
import MatchMaking from "../../components/MatchMaking.svelte";
import NavigationBar from "../../components/NavigationBar.svelte";
import type { GameSession } from "../../models/GameSession.ts";
import { currentUser, gameStatus } from "../../services/auth.ts";
import type SocketAPI from "../../services/socketAPI.ts";

let okLogin: boolean = $state(false);
let socket: SocketAPI | undefined = $state(undefined);
let gameSession: GameSession | undefined = $state(undefined);
// biome-ignore lint/style/useConst: used and modified by component
let panel: string = $state("close");

faro.api.setView({
	name: "auth",
});

currentUser.subscribe((value) => {
	okLogin = Boolean(value.id && value.username);
});

function onJoinSession(session: GameSession) {
	gameStatus.set("game");
	gameSession = session;
}

function onSocketReady(sok: SocketAPI) {
	socket = sok;
}
</script>

<main class="bg-sand-200 min-h-full">
    {#if !okLogin}
        <LoginSignup />
    {:else}
        <NavigationBar setPanel={(name: string) => {panel = name}} />
        {#if panel === "characters"}
            <CharacterLibrary />
        {:else if panel === "achievements"}
            <MyAchievements />
        {:else if panel === "saves"}
            <PreviousSaves {socket} />
        {/if}
        <section class="p-2 xs:p-8">
            {#if gameSession}
                <!-- <h1>
                    Game {gameSession.name} running with {gameSession.players
                        .map((p) => p.username)
                        .join(", ")} !
                </h1> -->
                <GameSessionPage {gameSession} />
            {:else}
                <MatchMaking {onJoinSession} {onSocketReady} />
            {/if}
        </section>
    {/if}
</main>
