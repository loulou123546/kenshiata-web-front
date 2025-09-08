<script lang="ts">
import { Compiler, type Story } from "inkjs/full";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

interface Props {
	value?: string;
	class?: string;
}

const { value = "", class: className = "" }: Props = $props();

const story = $derived(new Compiler(value).Compile());

function storyToMermaid(story: Story): string {
	let result = "flowchart TD\n";
	let id = 0;
	while (story.canContinue) {
		if (id > 0)
			result += `node${id - 1} --> node${id}["${story.Continue()}"]\n`;
		else result += `node${id}["${story.Continue()}"]\n`;
		id++;
	}
	return result;
}

async function draw(graph: string) {
	const el = document.getElementById("mermaid-ref");
	if (!el) return alert("failed to find div by id to draw graph");
	const { svg } = await mermaid.render("graphDiv", graph);
	el.innerHTML = svg;
	console.log("drawing ok");
}
$effect(() => {
	draw(storyToMermaid(story));
});
</script>

<div class={`min-h-64 ${className}`} id="mermaid-ref">
    Diagram loading
</div>