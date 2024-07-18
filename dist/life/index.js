import { engine } from '../engine/index2.js';
const Black = [0, 0, 0, 255];
const White = [255, 255, 255, 255];
export default async function (cols = 320, rows = 240, seed = 100000) {
    const width = 640;
    const height = 480;
    const LEN = cols * rows, map = new ImageData(cols, rows);
    let points = new Int8Array(LEN);
    let newPoints = new Int8Array(LEN);
    function get(i) {
        if (i < 0 || i >= LEN)
            i = ((i % LEN) + LEN) % LEN;
        return points[i];
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
    function setColor(pos, color) {
        map.data.set(color, pos * 4);
    }
    for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
            const pos = y * cols + x;
            setColor(pos, White);
            points[pos] = 0;
        }
    while (seed--) {
        const pos = (Math.random() * LEN) | 0;
        setColor(pos, Black);
        points[pos] = 1;
    }
    const { canvas, start } = await engine({
        width,
        height,
        root: {
            box: { w: width, h: height },
            texture: { src: map, magFilter: WebGL2RenderingContext.LINEAR },
            update(node) {
                for (let i = 0; i < LEN; i++) {
                    const a = neighbours(i);
                    const live = (a === 2 && points[i]) || a === 3;
                    newPoints[i] = live ? 1 : 0;
                    setColor(i, live ? Black : White);
                }
                const a = points;
                points = newPoints;
                node.texture.dirty = true;
                newPoints = a;
            },
        },
    });
    document.body.append(canvas);
    start();
}
