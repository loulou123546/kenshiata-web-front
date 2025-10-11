<script lang="ts">
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup, EditorView } from "codemirror";
import { ink } from "../inkLang.js";

interface Props {
	value?: string;
	onchange?: (value: string) => void;
	class?: string;
}

const { value = "", onchange, class: className = "" }: Props = $props();

let editorElement: HTMLDivElement;
let editorView: EditorView;

$effect(() => {
	if (editorElement && !editorView) {
		const updateListener = EditorView.updateListener.of((update) => {
			if (update.docChanged && onchange) {
				onchange(update.state.doc.toString());
			}
		});

		editorView = new EditorView({
			state: EditorState.create({
				doc: value,
				extensions: [
					basicSetup,
					ink(),
					oneDark,
					updateListener,
					EditorView.theme({
						"&": { height: "100%" },
						".cm-scroller": { fontFamily: "monospace" },
						".cm-focused": { outline: "none" },
					}),
				],
			}),
			parent: editorElement,
		});
	}
});

$effect(() => {
	return () => {
		if (editorView) {
			editorView.destroy();
		}
	};
});

let lastExternalValue = value;
$effect(() => {
	if (
		editorView &&
		value !== lastExternalValue &&
		value !== editorView.state.doc.toString()
	) {
		editorView.dispatch({
			changes: {
				from: 0,
				to: editorView.state.doc.length,
				insert: value,
			},
		});
	}
	lastExternalValue = value;
});
</script>

<div bind:this={editorElement} class={`ink-editor ${className}`}></div>

<style>
.ink-editor {
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	overflow: hidden;
}
</style>