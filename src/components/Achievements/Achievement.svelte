<script lang="ts">
const {
	title,
	description,
	disabled,
	notyf,
}: { title: string; description: string; disabled: boolean; notyf: boolean } =
	$props<{
		title: string;
		description: string;
		disabled: boolean;
		notyf: boolean;
	}>();
</script>

<div class={[
    "text-white px-2 py-1 md:pr-4 flex flex-row items-center gap-2",
    disabled ? "bg-gray-600/90" : "bg-gray-700",
    notyf ? "fixed right-0 top-24 animate-achievement" : ""
]} style="animation-fill-mode: forwards;">
    <div class="">
        <img src="/achievement_icon.png" alt="" class={["w-14", disabled ? "grayscale" : ""]}>
    </div>
    <div class="flex flex-col">
        <h3 class={[disabled ? "text-gray-200" : "text-white"]}>
            {#if disabled}
                <i class="fa fa-lock mr-1"></i>
            {/if}
            {title}
        </h3>
        <p class={["text-xs xs:text-sm", disabled ? "text-gray-300" : "text-gray-200"]}>{description}</p>
    </div>
</div>
