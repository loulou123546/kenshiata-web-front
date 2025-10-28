<script lang="ts">
import posthog, { DisplaySurveyType } from "posthog-js";
import { untrack } from "svelte";

const { showId, userId, userData } = $props<{
	showId: string;
	userId: string;
	userData: Record<string, string | undefined>;
}>();

let loaded: boolean = $state(posthog.__loaded || false);

const POSTHOG_SURVEY_ID = import.meta.env.PUBLIC_POSTHOG_SURVEY_ID;

$effect(() => {
	posthog.init(POSTHOG_SURVEY_ID, {
		api_host: "https://kily.kenshiata.studio",
		ui_host: "https://eu.posthog.com",
		defaults: "2025-05-24",
		person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
		loaded: (instance) => {
			instance.identify(userId, userData);
		},
	});
	posthog.onSurveysLoaded(() => {
		console.log("Posthog surveys loaded");
		untrack(() => {
			loaded = true;
		});
		if (showId) {
			posthog.displaySurvey(showId, {
				displayType: DisplaySurveyType.Popover,
				ignoreConditions: true,
				ignoreDelay: true,
			});
		}
	});
});

$effect(() => {
	console.log("PosthogSurvey effect:", { loaded, showId });
	if (loaded && showId) {
		posthog.displaySurvey(showId, {
			displayType: DisplaySurveyType.Popover,
			ignoreConditions: true,
			ignoreDelay: true,
		});
	}
});
</script>
<div>

</div>