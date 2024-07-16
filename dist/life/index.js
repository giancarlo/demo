import { engine } from '../engine/index.js';
const Black = [0, 0, 0, 255];
const White = [255, 255, 255, 255];
export default function (cols = 128, rows = 80, seed = 1000) {
    const width = 640;
    const height = 480;
    const W = (width / cols) | 0, H = (height / rows) | 0, LEN = cols * rows, map = [];
    let points = new Int8Array(LEN);
    let newPoints = new Int8Array(LEN);
    function get(i) {
        return i < 0 || i >= LEN ? 0 : points[i];
    }
    function neighbours(i) {
        return (get(i - cols - 1) +
            get(i - cols) +
            get(i - cols + 1) +
            get(i + 1) +
            get(i + cols + 1) +
            get(i + cols) +
            get(i + cols - 1) +
            get(i - 1));
    }
    for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
            const node = {
                box: { x: x * W, y: y * H, w: W, h: H },
                fill: White,
            };
            const pos = y * cols + x;
            map[pos] = node;
            points[pos] = 0;
        }
    while (seed--) {
        const pos = (Math.random() * LEN) | 0;
        map[pos].fill = Black;
        points[pos] = 1;
    }
    return engine({
        width,
        height,
        root: {
            children: map,
            update() {
                for (let i = 0; i < LEN; i++) {
                    const a = neighbours(i);
                    const live = (a === 2 && points[i]) || a === 3;
                    newPoints[i] = live ? 1 : 0;
                    map[i].fill = live ? Black : White;
                }
                const a = points;
                points = newPoints;
                newPoints = a;
            },
        },
    });
}
