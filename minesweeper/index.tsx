import { tsx } from 'ui/component.js';
import { Page } from 'ui/page.js';
import { Toolbar } from 'ui/toolbar.js';
import { Html } from 'ui/html.js';
import { Icon } from 'ui/icon.js';
import { Button } from 'ui/button.js';
import { IconButton } from 'ui/icon-button.js';
import { T } from 'ui/t.js';
import { TimeCounter } from 'ui/time-counter.js';
import { NavigationGrid } from 'ui/navigation-grid.js';
import { Row } from 'ui/row.js';
import { AriaLive } from 'ui/aria-live.js';

/*
This code is meant as demo for my blog. This post will focus on the rationale behind my UI component choices and, more importantly, the accessibility techniques that let Minesweeper be played entirely with the keyboard and work well with screen readers. I’ll call out which components are involved, how ARIA attributes are put to use, and how keyboard navigation is handled throughout the experience.
*/

interface Tile {
	element: HTMLElement;
	open: boolean;
	value: number;
	flag: boolean;
}

const BOMB = 9;
const BOMB_COUNT = 50;
const tileColors = [
	'#d7ccc8',
	'#0d47a1',
	'#1b5e20',
	'#b71c1c',
	'#1a237e',
	'#4e342e',
	'#00838f',
	'#37474f',
	'#424242',
	'#000',
];

let starting = false;

const pad = (n: number) =>
	(n < 0 ? '-' : '') + Math.abs(n).toString().padStart(3, '0');
const timer = tsx(TimeCounter);
const bombCount = tsx(T, { font: 'headline-small' }, '000');
const faceBtn = tsx(IconButton, {
	id: 'faceBtn',
	width: 32,
	icon: 'sentiment_satisfied',
	onclick: start,
});
const grid = tsx(NavigationGrid, {
	id: 'grid',
	selector: ':scope > c-row > *',
	onkeypress: ev => {
		if (ev.key === 'r' || ev.key === 'R') start();
	},
});

const status = <AriaLive assertive />;

<Html>
	{status}
	<style>
		{`
.tile { display: flex; align-items: center; justify-content: center; font: var(--cxl-font-label-large); }
#faceBtn { margin: auto; }
#grid { gap: 0; margin: auto;  }
#grid [role=gridcell] { min-width: 36px; min-height: 36px; border-radius: 4px; }
	`}
	</style>
	<Page>
		<Toolbar>
			<Icon name="flag" />
			{bombCount}
			{faceBtn}
			<Icon name="timer" />
			<T font="headline-small" id="time">
				{timer}
			</T>
		</Toolbar>
		{grid}
	</Page>
</Html>;

// Create a tile element based on its value
function tile(value: number) {
	const el = (
		<div className="tile" tabIndex={-1} role="gridcell" />
	) as HTMLElement;
	el.style.color = tileColors[value];

	if (value === BOMB) {
		el.ariaLabel = 'Bomb!';
		el.append(<Icon name="bomb" fill />);
	} else if (value) {
		el.ariaLabel = value.toString();
		el.textContent = value.toString();
	} else el.ariaLabel = `Empty Tile`;

	return el;
}

function board(columns: number, rows: number, bombs: number) {
	const tilesLen = columns * rows;
	const tiles: Tile[] = new Array(tilesLen);

	let isGameOver = false;
	let openTiles = 0;
	let bombsPlaced = bombs;

	timer.count = 0;
	timer.state = 'running';
	timer.format = pad;

	bombCount.textContent = pad(bombs);
	faceBtn.icon = 'sentiment_satisfied';
	faceBtn.ariaLabel = 'Restart Game';
	grid.columns = columns;
	grid.style.gridTemplateColumns = `repeat(${columns}, 36px)`;
	grid.innerHTML = '';
	status.textContent = '';

	if (tilesLen < bombs || columns < 0 || rows < 0)
		throw new Error('Invalid board');

	// Increments the value of a specific tile
	function add(index: number) {
		if (index >= 0 && index < tilesLen && tiles[index].value !== BOMB)
			tiles[index].value = (tiles[index].value ?? 0) + 1;
	}

	function updateBombCount() {
		const count = bombs - tiles.filter(t => t.flag).length;
		bombCount.textContent = pad(count);
	}

	// Flag or unflag a tile
	function flag(index: number) {
		if (isGameOver) return;

		const tile = tiles[index];
		const button = tile.element;

		if (tile.flag) {
			button.children[0].remove();
			button.ariaLabel = `Unrevealed tile`;
			tile.flag = false;
		} else {
			const el = tsx(Icon, { name: 'flag', fill: true });
			el.style.color = '#bf360c';
			button.ariaLabel = `Flag`;
			button.append(el);
			tile.flag = true;
		}
		updateBombCount();
	}

	// Create a button element for each tile
	function button(index: number) {
		const el = (
			<Button
				ariaLabel="Unrevealed tile"
				role="gridcell"
				oncontextmenu={ev => {
					flag(index);
					ev.preventDefault();
				}}
				onclick={() => {
					const cell = tiles[index];
					if (cell.flag) return;
					const el = open(index);
					if (!isGameOver || cell.value === BOMB) el?.focus();
					updateBombCount();
				}}
				onkeydown={ev => {
					if (ev.key === 'F' || ev.key === 'f') flag(index);
				}}
			/>
		) as Button;
		el.style.backgroundColor = '#9ccc65';

		return el;
	}

	// Handle game over (reveal bombs)
	function gameOver() {
		gameComplete(false);
	}

	// Handle game completion (all non-bomb tiles opened)
	function gameComplete(hasWon = true) {
		isGameOver = true;
		timer.state = 'paused';
		faceBtn.icon = hasWon
			? 'sentiment_very_satisfied'
			: 'sentiment_very_dissatisfied';

		status.textContent = hasWon
			? `You won! Game Completed in ${timer.count} seconds. Press R to restart game`
			: `Bomb! Game Over. Your time was ${timer.count} seconds. Press R to restart.`;

		for (const t of tiles)
			if (t.value === BOMB && !t.open) t.element.replaceWith(tile(BOMB));

		faceBtn.focus();
	}

	// Calls `fn` for each adjacent tile.
	function adjacent(index: number, fn: (i: number) => void) {
		const remainder = index % columns;
		if (remainder !== 0) {
			fn(index - 1);
			fn(index - columns - 1);
			fn(index + columns - 1);
		}
		if (remainder !== columns - 1) {
			fn(index + 1);
			fn(index - columns + 1);
			fn(index + columns + 1);
		}
		fn(index - columns);
		fn(index + columns);
	}

	// Open a tile and handle game logic
	function open(index: number) {
		if (isGameOver || index < 0 || index >= tilesLen) return;

		const cell = tiles[index];
		if (cell.open) return;
		cell.open = true;
		cell.flag = false;

		const button = cell.element;
		button.replaceWith((cell.element = tile(cell.value)));
		openTiles++;

		if (cell.value === BOMB) gameOver();
		else if (openTiles === tilesLen - bombs) gameComplete();
		else if (cell.value === 0) adjacent(index, open);

		return cell.element;
	}

	// Create buttons for each tile
	let row;
	for (let i = 0; i < tilesLen; i++) {
		// We create rows so the aria roles are valid for the grid
		if (i % columns === 0) {
			row = new Row();
			grid.append(row);
		}
		const element = button(i);
		tiles[i] = { element, open: false, value: 0, flag: false };
		row?.append(element);
	}

	// Randomly place bombs and initialize tiles
	while (bombsPlaced > 0) {
		const index = (Math.random() * tilesLen) | 0;
		if (tiles[index].value === BOMB) continue;
		tiles[index].value = BOMB;
		adjacent(index, add);
		bombsPlaced--;
	}
}

// Start the game with default dimensions (30x16 grid, 99 bombs)
function start() {
	if (starting) return;
	starting = true;
	board(25, 16, BOMB_COUNT);
	starting = false;
	grid.focus();
}

board(25, 16, BOMB_COUNT);
