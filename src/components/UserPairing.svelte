<script lang="ts">
    import { User, user } from "../models/user.ts";
    import SmallPlayerCard from "./SmallPlayerCard.svelte";

    const { me, target, step } = $props<{
        me: User;
        target: User;
        step: string;
    }>();

    const STEPS: { [key: string]: string[] } = {
        "game-request-sent": [
            "Demande de jeu envoyée",
            "En attente de sa réponse",
        ],
        "sending-webrtc-descriptor": [
            "Préparation du réseau",
            "Etablissement de la connexion",
        ],
        "waiting-for-webrtc-descriptor": [
            "Préparation du réseau",
            "En attente de l'hôte",
        ],
        "exchanging-webrtc-ice": [
            "Préparation du réseau",
            "Recherche de passerelle réseau",
        ],
    };

    const direction = $derived.by(() => {
        switch (step) {
            case "game-request-sent":
            case "sending-webrtc-descriptor":
                return "right";
            case "waiting-for-webrtc-descriptor":
                return "left";
            default:
                return "both";
        }
    });

    const label = $derived.by(() => {
        return STEPS?.[step]?.[0] ?? "En cours de connexion";
    });
    const label2 = $derived.by(() => {
        return STEPS?.[step]?.[1] ?? "";
    });
</script>

<div class="flex flex-row flex-wrap items-center justify-center gap-4 p-4">
    <SmallPlayerCard user={me} onclick={() => {}} />
    <!-- SVG of an arrow with a text label -->

    <div class="flex flex-col items-center justify-start">
        <h3 class="-mb-6 text-sm">{label}</h3>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="max-h-20 w-full text-gray-500"
            viewBox="0 0 75 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            {#if direction === "right"}
                <path d="M5,10 H68 M70,10 L62,2 M70,10 L62,18" />
            {:else if direction === "left"}
                <path d="M70,10 H7 M5,10 L13,2 M5,10 L13,18" />
            {:else if direction === "both"}
                <path
                    d="M7,10 H68 M70,10 L62,2 M5,10 L13,2 M70,10 L62,18 M5,10 L13,18"
                />
            {/if}
        </svg>
        <h4 class="-mt-6 text-sm">{label2}</h4>
    </div>

    <SmallPlayerCard user={target} onclick={() => {}} />
</div>
