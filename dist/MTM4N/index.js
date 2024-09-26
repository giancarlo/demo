import { Chip } from '@cxl/ui/chip.js';
import { Field } from '@cxl/ui/field.js';
import { T } from '@cxl/ui/typography.js';
import { TextArea } from '@cxl/ui/textarea.js';
import { dom } from '@cxl/ui/tsx.js';
import { debounceFunction } from '@cxl/ui/rx.js';
import { handleKeyboard, normalize } from '@cxl/keyboard';
document.body.append(dom(dom, null,
    dom("style", null, `
			#bindings { font: 16px var(--cxl-font-monospace); }
			#output { display: flex; gap: 4px 8px; flex-wrap:wrap; }
		`),
    dom(T, { font: "h5" }, " Key Strokes "),
    dom("div", { id: "output" },
        dom(T, { font: "h6", center: true },
            "Click here to start. Keep this window active and press any key.",
            dom("br", null),
            "If you press a key that matches one of the bindings below, the corresponding text value will appear in the output.")),
    dom("br", null),
    dom("br", null),
    dom(T, { font: "h5" }, " Bindings "),
    dom(Field, { outline: true },
        dom(TextArea, { id: "bindings", rules: "json", value: '{\n\t"enter": "hello",\n\t"a b c": "ABC",\n\t"ctrl+alt+shift+enter": "MULTIKEY",\n\t"shift+a shift+d": "SHIFT KEY",\n\t"alt+a alt+b": "ALT Combination",\n\t"up up down down left right left right b a": "KONAMI",\n\t":": "COLON"\n}' }))));
const bindings = document.getElementById('bindings');
const output = document.getElementById('output');
let keymap, lastSequence, kbd;
function handle(name, sequence) {
    if (!lastSequence)
        output.innerHTML = '';
    const found = keymap[name];
    if (sequence !== lastSequence) {
        kbd = (dom(Chip, { color: "primary" }, found || name));
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
window.addEventListener('keydown', ev => ev.preventDefault());
bindings.addEventListener('keydown', ev => ev.stopPropagation(), true);
bindings.addEventListener('change', debounceFunction(parse, 500));
parse();
