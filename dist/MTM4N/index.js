import { Chip } from '@cxl/ui/chip.js';
import { FieldOutlined } from '@cxl/ui/field-outlined.js';
import { T } from '@cxl/ui/t.js';
import { TextArea } from '@cxl/ui/textarea.js';
import { tsx } from '@cxl/ui/component.js';
import { debounceFunction } from '@cxl/ui/rx.js';
import { handleKeyboard, normalize } from '@cxl/keyboard';
import { Card } from '@cxl/ui/card.js';
document.body.append(tsx(Card, { pad: 16 },
    tsx("style", null, `
			#bindings { font: 16px var(--cxl-font-monospace); }
			#output { display: flex; gap: 4px 8px; flex-wrap:wrap; }
		`),
    tsx(T, { font: "h5" }, " Key Strokes "),
    tsx("div", { id: "output", tabIndex: 0, "aria-live": "polite" },
        tsx(T, { font: "h6" },
            "Click here to start. Keep this window active and press any key.",
            tsx("br", null),
            "If you press a key that matches one of the bindings below, the corresponding text value will appear in the output.")),
    tsx("br", null),
    tsx("br", null),
    tsx(T, { font: "h5" }, " Bindings "),
    tsx(FieldOutlined, null,
        tsx(TextArea, { id: "bindings", rules: "json", value: '{\n\t"enter": "hello",\n\t"a b c": "ABC",\n\t"ctrl+alt+shift+enter": "MULTIKEY",\n\t"shift+a shift+d": "SHIFT KEY",\n\t"alt+a alt+b": "ALT Combination",\n\t"up up down down left right left right b a": "KONAMI",\n\t":": "COLON"\n}' }))));
const bindings = document.getElementById('bindings');
const output = document.getElementById('output');
let keymap, lastSequence, kbd;
function handle(name, sequence) {
    if (!lastSequence)
        output.innerHTML = '';
    const found = keymap[name];
    if (sequence !== lastSequence) {
        kbd = (tsx(Chip, { tabIndex: -1, color: "primary" }, found || name));
        lastSequence = sequence;
        output.insertBefore(kbd, output.children[0]);
    }
    else {
        kbd.textContent = found || sequence.join(' ');
    }
    return !!found;
}
function parse() {
    const val = bindings.value;
    try {
        if (val)
            keymap = Object.entries(JSON.parse(val)).reduce((acc, [key, value]) => {
                acc[normalize(key)] = value;
                return acc;
            }, {});
    }
    catch (e) {
        console.error(e);
    }
    keymap = keymap || {};
}
handleKeyboard({ element: document.body, onKey: handle });
window.addEventListener('keydown', ev => {
    if (ev.key !== 'Tab')
        ev.preventDefault();
});
bindings.addEventListener('keydown', ev => ev.stopPropagation(), true);
bindings.addEventListener('change', debounceFunction(parse, 500));
parse();
