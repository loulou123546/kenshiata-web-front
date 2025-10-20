<script lang="ts">
import Achievement from "./Achievement.svelte";
</script>

<div
    class="w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center py-4 px-3 md:p-6"
>
    <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
        Mes succès
    </div>
    <div class="flex flex-col gap-2">
        <Achievement title="Haut les pattes !" description="Se faire attraper par le shérif après le braquage" disabled={false} notyf={false} />
        <Achievement title="Succès bloqué" description="Ce succès est caché, vous ne pouvez pas le voir avant de l'obtenir" disabled={true} notyf={false} />
    </div>
</div>
