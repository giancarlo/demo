import { Chip } from '@cxl/ui/chip.js';
import { FieldOutlined } from '@cxl/ui/field-outlined.js';
import { T } from '@cxl/ui/t.js';
import { TextArea } from '@cxl/ui/textarea.js';
import { tsx } from '@cxl/ui/component.js';
import { debounceFunction } from '@cxl/ui/rx.js';
import { handleKeyboard, normalize } from '@cxl/keyboard';
import { Card } from '@cxl/ui/card.js';

document.body.append(
	<Card pad={16}>
		<style>{`
			#bindings { font: 16px var(--cxl-font-monospace); }
			#output { display: flex; gap: 4px 8px; flex-wrap:wrap; }
		`}</style>
		<T font="h5"> Key Strokes </T>
		<div id="output" tabIndex={0} aria-live="polite">
			<T font="h6">
				Click here to start. Keep this window active and press any key.
				<br />
				If you press a key that matches one of the bindings below, the
				corresponding text value will appear in the output.
			</T>
		</div>
		<br />
		<br />
		<T font="h5"> Bindings </T>
		<FieldOutlined>
			<TextArea
				id="bindings"
				rules="json"
				value='{
	"enter": "hello",
	"a b c": "ABC",
	"ctrl+alt+shift+enter": "MULTIKEY",
	"shift+a shift+d": "SHIFT KEY",
	"alt+a alt+b": "ALT Combination",
	"up up down down left right left right b a": "KONAMI",
	":": "COLON"
}'
			></TextArea>
		</FieldOutlined>
	</Card>,
);

const bindings = document.getElementById('bindings') as HTMLInputElement;
const output = document.getElementById('output') as HTMLElement;
let keymap: Record<string, string>,
	lastSequence: string[] | undefined,
	kbd: Chip;

/**
 * Set up key detection and handling:
 * - `output` starts with a prompt to press any key, clearing when a sequence starts.
 * - Checks for new or repeated sequences, updating display as needed.
 * - Displays a `Chip` with the key or mapped text (from `keymap`) in `output`.
 * - Sets `lastSequence` to prevent unnecessary updates for the same sequence.
 */
function handle(name: string, sequence: string[]) {
	if (!lastSequence) output.innerHTML = '';
	const found = keymap[name];
	if (sequence !== lastSequence) {
		kbd = (
			<Chip tabIndex={-1} color="primary">
				{found || name}
			</Chip>
		) as Chip;
		lastSequence = sequence;
		output.insertBefore(kbd, output.children[0]);
	} else {
		kbd.textContent = found || sequence.join(' ');
	}

	return !!found;
}

/**
 * Updates the `keymap` on changes to input.
 * Parses `bindings` textarea as JSON, logging errors and ensuring `keymap` is always an object.
 */
function parse() {
	const val = bindings.value;
	try {
		if (val)
			keymap = Object.entries(JSON.parse(val)).reduce(
				(acc, [key, value]) => {
					// The shortcuts are normalized to ensure the library recognizes them correctly.
					acc[normalize(key)] = value as string;
					return acc;
				},
				{} as Record<string, string>,
			);
	} catch (e) {
		console.error(e);
	}

	keymap = keymap || {};
}

// Keyboard handling is continuous with `handleKeyboard`, responding to key sequences based on the `bindings` map.
handleKeyboard({ element: document.body, onKey: handle });

// The `bindings` input element has event listeners to intercept key actions:
//     - `keydown` prevents default behavior to manage global shortcuts without interference.
//     - Events are set to not propagate when changing `bindings`, isolating it from affecting the main app.
window.addEventListener('keydown', ev => {
	if (ev.key !== 'Tab') ev.preventDefault();
});
bindings.addEventListener('keydown', ev => ev.stopPropagation(), true);

// `debounceFunction` on change ensures efficient updates, parsing input with minimal lag upon changes.
bindings.addEventListener('change', debounceFunction(parse, 500));

// Initial `parse` call primes the keymap for immediate key handling based on the current `bindings` value.
parse();
