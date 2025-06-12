import { C } from '@cxl/ui/c.js';
import { FieldOutlined } from '@cxl/ui/field-outlined.js';
import { Label } from '@cxl/ui/label.js';
import { TextArea } from '@cxl/ui/textarea.js';
import { tsx } from '@cxl/ui/component.js';
class CompilerError {
    message;
    position;
    constructor(message, position) {
        this.message = message;
        this.position = position;
    }
}
const _ident = /\w/;
const digit = (ch) => (ch >= '0' && ch <= '9') || ch === '_';
const hexDigit = (ch) => digit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
const binaryDigit = (ch) => ch === '0' || ch === '1' || ch === '_';
const ident = (ch) => ch === '_' || _ident.test(ch);
const notIdent = (ch) => ch === undefined || !ident(ch);
const alpha = (ch) => (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
const identFirst = (ch) => ch === '_' || alpha(ch);
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
];
const TrieMatch = Symbol('TrieMatch');
function createTrie(...map) {
    const trie = {};
    for (const token of map) {
        let current = trie;
        for (const char of token)
            current = current[char] ??= {};
        current[TrieMatch] = token;
    }
    return trie;
}
export function scan(source) {
    const length = source.length;
    let index = 0;
    let line = 0;
    let endLine = 0;
    const keywordMatcher = createTrieMatcher(keywords, notIdent);
    const current = (offset = 0) => source.charAt(index + offset);
    function tk(kind, consume) {
        return {
            kind,
            start: index,
            end: (index += consume),
            line,
            source,
        };
    }
    function matchWhile(match, consumed = 0) {
        while (index + consumed < length && match(source[index + consumed]))
            consumed++;
        return consumed;
    }
    function error(message, consumed = 0, start = index) {
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
            if (ch === '\n')
                endLine++;
            else if (ch !== '\r' && ch !== ' ' && ch !== '\t')
                break;
        }
    }
    function backtrack(pos) {
        index = pos.end;
        endLine = line = pos.line;
    }
    function createTrieMatcher(map, end) {
        const trie = createTrie(...map);
        return () => {
            let ch = source[index];
            let consumed = 0;
            let node = trie;
            while ((node = node[ch])) {
                consumed++;
                ch = source[index + consumed];
                if (node[TrieMatch] && end(ch))
                    return tk(node[TrieMatch], consumed);
            }
        };
    }
    function next() {
        skipWhitespace();
        line = endLine;
        if (index >= length)
            return tk('eof', 0);
        const ch = source[index];
        const la = source[index + 1];
        switch (ch) {
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
                while (index + n < length &&
                    (source[index + n] !== "'" ||
                        source[index + n - 1] === '\\')) {
                    if (source[index + n] === '\n')
                        endLine++;
                    n++;
                }
                if (source[index + n] !== "'")
                    throw error('Unterminated string', n);
                return tk('string', n + 1);
            }
            case '#': {
                let n = 1;
                while (index + n < length && source[index + n] !== '\n')
                    n++;
                return tk('comment', n);
            }
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
                const keywordToken = keywordMatcher();
                if (keywordToken)
                    return keywordToken;
                if (identFirst(ch))
                    return tk('ident', matchWhile(ident, 1));
                throw error(`Invalid character "${ch}"`, 1);
            }
        }
    }
    return { next, backtrack };
}
function each(scan) {
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
export function text({ source, start, end }) {
    return source.slice(start, end);
}
const input = (tsx(TextArea, { id: "input", className: "mono" }));
const output = (tsx(C, { id: "output", className: "mono" }));
document.body.append(tsx("style", null, `
		.mono { font: var(--cxl-font-code); height: 164px; }
	`), tsx(C, { pad: 16 },
    tsx(FieldOutlined, null,
        tsx(Label, null, "Input Text"),
        input),
    tsx("br", null),
    tsx("br", null),
    tsx(FieldOutlined, null,
        tsx(Label, null, "Output"),
        output)));
const onInput = () => {
    let outText = '';
    const scanner = scan(input.value);
    const next = () => {
        try {
            return scanner.next();
        }
        catch (e) {
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
        const tkText = token.kind === 'string' ? JSON.stringify(text(token)) : text(token);
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
input.oninput = onInput;
onInput();
