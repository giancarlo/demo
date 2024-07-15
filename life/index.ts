import { Node, engine } from '../engine2/index.js';

const Black = [0, 0, 0, 255] as const;
const White = [255, 255, 255, 255] as const;

export default function (cols = 128, rows = 80, seed = 1000) {
	const width = 640;
	const height = 480;
	const W = (width / cols) | 0,
		H = (height / rows) | 0,
		LEN = cols * rows,
		map: Node[] = [];
	let points = new Int8Array(LEN);
	let newPoints = new Int8Array(LEN);

	/* Returns 1 if cell is alive */
	function get(i: number) {
		return i < 0 || i >= LEN ? 0 : points[i];
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
			children: map as Record<number, Node>,
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
