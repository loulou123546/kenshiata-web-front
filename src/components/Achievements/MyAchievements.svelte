<script lang="ts">
import type { Achievement } from "@shared/types/Achievement";
import {
	getMyAchievements,
	getStoryAchievements,
	myAchievements,
} from "../../models/Achievements";
import notyf from "../../services/notyf";
import AchievementRender from "./Achievement.svelte";

const storyToShow = "0199435c-250a-74e9-b7e5-b937fde0fd78";
let storyPublicAchivements: Achievement[] = $state([]);

getMyAchievements()
	.then((res) => {
		$myAchievements = res;
	})
	.catch((_err) => {
		notyf.error("Erreur lors du chargements de vos succès obtenus");
	});

getStoryAchievements(storyToShow)
	.then((res) => {
		storyPublicAchivements = res;
	})
	.catch((_err) => {
		notyf.error("Erreur lors du chargements des succès disponibles");
	});
</script>

<div
    class="w-full rounded-b-xl bg-sand-400/70 shadow-lg flex flex-col flex-wrap items-center justify-center py-4 px-3 md:p-6"
>
    <div class="text-lg md:text-2xl text-center text-brown-900 font-semibold pb-2 md:pb-4">
        Mes succès
    </div>
    <div class="flex flex-col gap-2">
        {#each $myAchievements as achievement}
            <AchievementRender title={achievement.title} description={achievement.description} disabled={false} notyf={false} />
        {/each}
        {#each storyPublicAchivements as achievement}
            {#if !$myAchievements.some((el) => el.achievementId === achievement.id)}
                <AchievementRender title={achievement.title} description={achievement.description} disabled={true} notyf={false} />
            {/if}
        {/each}
        {#if $myAchievements.length < 1 && storyPublicAchivements.length < 1}
            <p>Chargement en cours <i class="fa fa-circle-notch fa-spin"></i></p>
        {/if}
    </div>
</div>
