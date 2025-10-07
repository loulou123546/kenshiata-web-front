import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

const inkLanguage = StreamLanguage.define({
	token(stream, state) {
		// Comments
		if (stream.match(/\/\/.*$/)) {
			return "comment";
		}
		if (stream.match(/\/\*[\s\S]*?\*\//)) {
			return "comment";
		}

		// Choices
		if (stream.match(/^\s*\*+\s/)) {
			return "keyword";
		}
		if (stream.match(/^\s*-+\s/)) {
			return "keyword";
		}
		if (stream.match(/<>/)) {
			return "keyword";
		}

		// Knots and stitches
		if (stream.match(/^===?\s*\w+\s*===?/)) {
			return "heading";
		}
		if (stream.match(/^=\s*\w+/)) {
			return "heading";
		}

		// Diverts and tunnels
		if (stream.match(/->|<-/)) {
			return "operator";
		}

		// Variables and logic
		if (stream.match(/\{[^}]*\}/)) {
			return "string";
		}
		if (stream.match(/\[[^\]]*\]/)) {
			return "string";
		}

		// Tags
		if (stream.match(/[^\\]#.+/)) {
			return "meta";
		}

		// Conditionals and logic operators
		if (stream.match(/\b(not|&&|\|\||and|or|mod|VAR|else)\b/)) {
			return "keyword";
		}

		// Functions
		if (
			stream.match(
				/\b(INCLUDE|END|DONE|CHOICE_COUNT|TURNS|TURNS_SINCE|SEED_RANDOM|RANDOM|INT|FLOOR|FLOAT|LIST_\w+)\b/,
			)
		) {
			return "builtin";
		}

		// Strings
		if (stream.match(/"([^"\\]|\\.)*"/)) {
			return "string";
		}

		// Numbers
		if (stream.match(/\b\d+(\.\d+)?\b/)) {
			return "number";
		}

		// Default: advance one character
		stream.next();
		return null;
	},
});

export function ink() {
	return new LanguageSupport(inkLanguage);
}
