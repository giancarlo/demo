import { Color, engine } from './engine.js';

const Black = [0, 0, 0, 255] as const;
const White = [255, 255, 255, 255] as const;

const cols = 320,
	rows = 240;

/**
 * Seed value for random cell placement.
 *
 * Determines the initial density of alive cells in the grid.
 * A value of 0.5 means approximately 50% of the cells will be alive initially.
 * Higher values result in denser initial populations.
 */
const seed = 0.5;
const width = 640;
const height = 480;
const LEN = cols * rows,
	map = new ImageData(cols, rows);
let points = new Int8Array(LEN);
let newPoints = new Int8Array(LEN);

/**
 * Normalizes an index `i` to ensure it wraps around the array bounds. If `i` is out of bounds,
 * it's adjusted to remain within 0 and `LEN - 1` using modular arithmetic.
 */
function get(i: number) {
	if (i < 0 || i >= LEN) i = ((i % LEN) + LEN) % LEN;
	return points[i];
}

/* Returns sum of alive cells */
function neighbours(i: number) {
	return (
		get(i - cols - 1) +
		get(i - cols) +
		get(i - cols + 1) +
		get(i + 1) +
		get(i + cols + 1) +
		get(i + cols) +
		get(i + cols - 1) +
		get(i - 1)
	);
}

/**
 * Sets the color of a pixel in the `map` ImageData.
 *
 * @param pos The index of the pixel to set.
 * @param color The color to set the pixel to, represented as an array of 4 numbers (RGBA).
 */
function setColor(pos: number, color: Color) {
	map.data.set(color, pos * 4);
}

/**
 * Initializes the canvas with a white background and randomly places black cells based on the seed value.
 * This sets up the initial state of the Game of Life simulation.
 * The `seed` value controls the initial randomness of the simulation. A higher seed will result in more initially alive cells.
 */
for (let y = 0; y < rows; y++)
	for (let x = 0; x < cols; x++) {
		const pos = y * cols + x;
		const isOn = Math.random() > seed ? 1 : 0;
		setColor(pos, isOn ? Black : White);
		points[pos] = isOn;
	}

engine({
	width,
	height,
	container: document.body,
	autoStart: true,
	root: {
		box: { w: width, h: height },
		texture: { src: map, magFilter: WebGL2RenderingContext.NEAREST },
		update: {
			interval: 400,
			/**
			 * Implements the core logic of Conway's Game of Life.
			 *
			 * For each cell in the grid, it calculates the number of live neighbors. Based on the rules of the game:
			 * - A live cell with 2 or 3 live neighbors stays alive.
			 * - A dead cell with exactly 3 live neighbors becomes alive.
			 * - All other cells die or remain dead.
			 *
			 * The `newPoints` array stores the state of the grid for the next generation. After processing all cells,
			 * the `points` array is updated with the new state. The texture is marked as dirty to ensure the changes
			 * are reflected on the canvas. Finally, `newPoints` is reset by referencing the old `points` array to avoid
			 * unnecessary memory allocation in each update.
			 */
			fn(node) {
				for (let i = 0; i < LEN; i++) {
					const a = neighbours(i);
					const live = (a === 2 && points[i]) || a === 3;
					newPoints[i] = live ? 1 : 0;
					setColor(i, live ? Black : White);
				}
				const a = points;
				points = newPoints;
				node.texture!.dirty = true;
				newPoints = a;
			},
		},
	},
});
