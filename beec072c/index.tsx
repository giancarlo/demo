import { C } from '@cxl/ui/layout.js';
import { Field, Label } from '@cxl/ui/field.js';
import { TextArea } from '@cxl/ui/textarea.js';
import { dom } from '@cxl/ui/tsx.js';

interface Position {
	start: number;
	end: number;
	line: number;
	source: string;
}

interface Token<Kind> extends Position {
	kind: Kind;
}

type MatchFn = (ch: string) => boolean;
type MapToToken<T extends string> = T extends infer U ? Token<U> : never;
type ScanFn<Node extends Token<string>> = () => Node;

class CompilerError {
	constructor(
		public message: string,
		public position: Position,
	) {}
}

const _ident = /\w/;
const digit = (ch: string) => (ch >= '0' && ch <= '9') || ch === '_';
const hexDigit = (ch: string) =>
	digit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
const binaryDigit = (ch: string) => ch === '0' || ch === '1' || ch === '_';
const ident = (ch: string) => ch === '_' || _ident.test(ch);
const notIdent = (ch: string) => ch === undefined || !ident(ch);
const alpha = (ch: string) =>
	(ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
const identFirst = (ch: string) => ch === '_' || alpha(ch);

const keywords = [
	'done',
	'export',
	'import',
	'loop',
	'main',
	'next',
	'type',
	'fn',
	'var',
] as const;

type TrieNode = { [K in string]: TrieNode } & { [TrieMatch]?: string };
const TrieMatch = Symbol('TrieMatch');

/**
 * Builds a trie from the input map and
 */
function createTrie<T extends string>(...map: T[]) {
	const trie: TrieNode = {};

	// Build the trie from the input map
	for (const token of map) {
		let current: TrieNode = trie;
		for (const char of token) current = current[char] ??= {};
		current[TrieMatch] = token;
	}
	return trie;
}

export function scan(source: string) {
	const length = source.length;
	let index = 0;
	let line = 0;
	let endLine = 0;

	const keywordMatcher = createTrieMatcher(keywords, notIdent);
	const current = (offset = 0) => source.charAt(index + offset);

	function tk<Kind extends string>(kind: Kind, consume: number): Token<Kind> {
		return {
			kind,
			start: index,
			end: (index += consume),
			line,
			source,
		};
	}

	function matchWhile(match: MatchFn, consumed = 0) {
		while (index + consumed < length && match(source[index + consumed]))
			consumed++;
		return consumed;
	}

	function error(message: string, consumed = 0, start = index) {
		index += consumed;
		return new CompilerError(message, {
			start,
			end: index,
			line,
			source,
		});
	}

	function skipWhitespace() {
		for (let ch = source[index]; index < length; ch = source[++index]) {
			if (ch === '\n') endLine++;
			else if (ch !== '\r' && ch !== ' ' && ch !== '\t') break;
		}
	}

	function backtrack(pos: Position) {
		index = pos.end;
		endLine = line = pos.line;
	}

	function createTrieMatcher<T extends string>(
		map: readonly T[],
		end: MatchFn,
	) {
		const trie = createTrie(...map);
		return (): MapToToken<T> | undefined => {
			let ch = source[index];
			let consumed = 0;
			let node = trie;
			while ((node = node[ch])) {
				consumed++;
				ch = source[index + consumed];
				if (node[TrieMatch] && end(ch))
					return tk(node[TrieMatch], consumed) as MapToToken<T>;
			}
		};
	}

	function next() {
		skipWhitespace();
		line = endLine;

		if (index >= length) return tk('eof', 0);

		const ch = source[index];
		const la = source[index + 1];

		/* eslint no-fallthrough: off */
		switch (ch) {
			// 2-char operators
			case '=':
				return la === '='
					? tk('==', 2)
					: la === '>'
					? tk('=>', 2)
					: tk('=', 1);
			case '|':
				return la === '|' ? tk('||', 2) : tk('|', 1);
			case '&':
				return la === '&' ? tk('&&', 2) : tk('&', 1);
			case '>':
				return la === '='
					? tk('>=', 2)
					: la === '>'
					? tk('>>', 2)
					: tk('>', 1);
			case '<':
				return la === '='
					? tk('<=', 2)
					: la === '<'
					? tk('<<', 2)
					: la === ':'
					? tk('<:', 2)
					: tk('<', 1);
			case '!':
				return la === '=' ? tk('!=', 2) : tk('!', 1);
			case '+':
				return la === '+' ? tk('++', 2) : tk('+', 1);
			case '-':
				return la === '-' ? tk('--', 2) : tk('-', 1);
			case ':':
				return la === '>' ? tk(':>', 2) : tk(':', 1);
			// 1-char operators
			case '{':
			case '}':
			case '.':
			case ',':
			case '?':
			case '*':
			case '/':
			case '~':
			case '(':
			case ')':
			case '^':
			case '$':
			case '@':
			case '[':
			case ']':
				return tk(ch, 1);
			case "'": {
				let n = 1;
				while (
					index + n < length &&
					(source[index + n] !== "'" ||
						source[index + n - 1] === '\\')
				) {
					if (source[index + n] === '\n') endLine++;
					n++;
				}

				if (source[index + n] !== "'")
					throw error('Unterminated string', n);

				return tk('string', n + 1);
			}
			case '#': {
				let n = 1;
				while (index + n < length && source[index + n] !== '\n') n++;
				return tk('comment', n);
			}

			// Number
			case '0':
				if (la === 'x') {
					const consumed = matchWhile(hexDigit, 2);
					if (consumed === 2 || ident(current(consumed)))
						throw error('Expected hexadecimal digit', consumed + 1);
					return tk('number', consumed);
				}
				if (la === 'b') {
					const consumed = matchWhile(binaryDigit, 2);
					if (consumed === 2 || ident(current(consumed)))
						throw error('Expected binary digit', consumed + 1);
					return tk('number', consumed);
				}
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9': {
				let consumed = matchWhile(digit, 1);
				if (consumed && current(consumed) === '.') {
					const decimals = matchWhile(digit, ++consumed);
					if (decimals === consumed)
						throw error('Expected digit', consumed);
					consumed = decimals;
				}
				if (ident(current(consumed)))
					throw error('Expected digit', consumed + 1);

				return tk('number', consumed);
			}
			default: {
				// Keywords
				const keywordToken = keywordMatcher();
				if (keywordToken) return keywordToken;

				// Identifiers
				if (identFirst(ch)) return tk('ident', matchWhile(ident, 1));

				throw error(`Invalid character "${ch}"`, 1);
			}
		}
	}

	return { next, backtrack };
}

function each<Node extends Token<string>>(scan: ScanFn<Node>) {
	return {
		[Symbol.iterator]() {
			return {
				next() {
					const value = scan();
					return value.kind === 'eof'
						? { done: true, value }
						: { value };
				},
			};
		},
	};
}

export function text({ source, start, end }: Position) {
	return source.slice(start, end);
}

const input = (<TextArea id="input" className="mono"></TextArea>) as TextArea;
const output = (<C id="output" className="mono"></C>) as C;

document.body.append(
	<style>{`
		.mono { font: var(--cxl-font-code); height: 164px; }
	`}</style>,
	<C pad={16}>
		<Field outline>
			<Label>Input Text</Label>
			{input}
		</Field>
		<br />
		<br />
		<Field outline>
			<Label>Output</Label>
			{output}
		</Field>
	</C>,
);

input.onchange = () => {
	let outText = '';
	const scanner = scan(input.value);
	const next = () => {
		try {
			return scanner.next();
		} catch (e) {
			return e instanceof Error || e instanceof CompilerError
				? {
						kind: 'error',
						start: 0,
						end: e.message.length,
						source: e.message,
						line: 0,
				  }
				: { kind: 'error', start: 0, end: 0, source: '', line: 0 };
		}
	};

	for (const token of each(next)) {
		const tkText =
			token.kind === 'string' ? JSON.stringify(text(token)) : text(token);
		outText += `(${token.kind}: ${tkText}) `;
	}
	output.innerText = outText;
};
input.value = `10.3 0xff  0b1010
'Hello World' 'Escaped \\'String\\''
'Multi
Line'
# Comment
main var
# Errors
0x 0b 0.
' Unterminated String`;
