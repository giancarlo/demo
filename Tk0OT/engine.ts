///<amd-module name="@j5g3/core"/>
import type { Gltf } from './gltf.js';

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface Box extends Rect {
	sx: number;
	sy: number;
	/** Offset X for rotation. */
	cx: number;
	/** Offset Y for rotation */
	cy: number;
	rotation: number;
}

export type Matrix = Float32Array;
export type Color = [number, number, number, number];

export const identity = new Float32Array([
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]) as Readonly<Matrix>;
export const whiteColor: Color = [255, 255, 255, 255];

export function Matrix(m?: number[]) {
	return m ? new Float32Array(m) : identity.slice(0);
}

export function createCanvas(width: number, height: number) {
	const element = document.createElement('canvas');
	element.width = width;
	element.height = height;
	return element;
}

export function createCanvasContext(width: number, height: number) {
	const canvas = createCanvas(width, height);
	const gl = canvas.getContext('webgl2')!;
	if (!gl) throw new Error('Could not create webgl2 canvas context');
	return gl;
}

export function loadImage(src: string) {
	return new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.src = src;
		img.addEventListener('load', () => resolve(img));
		img.addEventListener('error', () => reject(img));
	});
}

/**
 * Compiles a shader using the given source code and type.
 *
 * It takes a WebGLRenderingContext, source code string, and shader type as input.
 * Creates a shader object, sets its source code, compiles it, and returns the compiled shader object.
 * If the compilation fails, an error is thrown with the compilation log.
 */
export function Shader(
	gl: WebGLRenderingContext,
	source: string,
	type: number,
) {
	const result = gl.createShader(type);
	if (!result) throw new Error(`Could not create shader.`);
	gl.shaderSource(result, source);
	gl.compileShader(result);

	if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(result);
		throw new Error(`Could not compile shader.\n${info}`);
	}

	return result;
}

/**
 * Creates a perspective projection matrix.
 * It returns a `Float32Array` representing a 4x4 matrix that maps 3D points in the specified orthogonal
 * frustum to normalized device coordinates.
 * It allows you to define the viewing area for your scene and map 3D points to 2D coordinates on the screen.
 */
export function orthographic(
	left: number,
	right: number,
	bottom: number,
	top: number,
	near: number,
	far: number,
) {
	return new Float32Array([
		2 / (right - left),
		0,
		0,
		0,
		0,
		2 / (top - bottom),
		0,
		0,
		0,
		0,
		2 / (near - far),
		0,
		(left + right) / (left - right),
		(bottom + top) / (bottom - top),
		(near + far) / (near - far),
		1,
	]);
}

/**
 * Creates a WebGL program with the given fragment and vertex shaders.
 *
 * It initializes a WebGL context, sets up the rendering pipeline with basic configurations,
 * compiles the shaders, links the program, and returns an object containing the WebGL context and program.
 * It also handles error scenarios during shader compilation and program linking.
 *
 */
export function Program({
	frag,
	vtx,
	width,
	height,
}: {
	frag: string;
	vtx: string;
	width: number;
	height: number;
}) {
	const gl = createCanvasContext(width, height);
	const glProgram = gl.createProgram();
	if (!glProgram) throw new Error('Could not create WebGL Program');

	const vertexShader = Shader(gl, vtx, gl.VERTEX_SHADER);
	const fragShader = Shader(gl, frag, gl.FRAGMENT_SHADER);

	gl.attachShader(glProgram, vertexShader);
	gl.attachShader(glProgram, fragShader);
	gl.linkProgram(glProgram);

	if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
		gl.deleteProgram(glProgram);
		throw new Error('Could not create WebGL Program');
	}

	return { gl, glProgram };
}

/**
 * Multiplies two matrices, `a` and `b`, and stores the result in the `dst` matrix.
 * It assumes that the matrices are 4x4 matrices.
 */
export function multiply(
	a: Matrix,
	b: Matrix,
	dst: Matrix = new Float32Array(16),
) {
	const [
		a0,
		a1,
		a2,
		a3,
		a10,
		a11,
		a12,
		a13,
		a20,
		a21,
		a22,
		a23,
		a30,
		a31,
		a32,
		a33,
	] = a;
	const [
		b0,
		b1,
		b2,
		b3,
		b10,
		b11,
		b12,
		b13,
		b20,
		b21,
		b22,
		b23,
		b30,
		b31,
		b32,
		b33,
	] = b;
	dst[0] = b0 * a0 + b1 * a10 + b2 * a20 + b3 * a30;
	dst[1] = b0 * a1 + b1 * a11 + b2 * a21 + b3 * a31;
	dst[2] = b0 * a2 + b1 * a12 + b2 * a22 + b3 * a32;
	dst[3] = b0 * a3 + b1 * a13 + b2 * a23 + b3 * a33;
	dst[4] = b10 * a0 + b11 * a10 + b12 * a20 + b13 * a30;
	dst[5] = b10 * a1 + b11 * a11 + b12 * a21 + b13 * a31;
	dst[6] = b10 * a2 + b11 * a12 + b12 * a22 + b13 * a32;
	dst[7] = b10 * a3 + b11 * a13 + b12 * a23 + b13 * a33;
	dst[8] = b20 * a0 + b21 * a10 + b22 * a20 + b23 * a30;
	dst[9] = b20 * a1 + b21 * a11 + b22 * a21 + b23 * a31;
	dst[10] = b20 * a2 + b21 * a12 + b22 * a22 + b23 * a32;
	dst[11] = b20 * a3 + b21 * a13 + b22 * a23 + b23 * a33;
	dst[12] = b30 * a0 + b31 * a10 + b32 * a20 + b33 * a30;
	dst[13] = b30 * a1 + b31 * a11 + b32 * a21 + b33 * a31;
	dst[14] = b30 * a2 + b31 * a12 + b32 * a22 + b33 * a32;
	dst[15] = b30 * a3 + b31 * a13 + b32 * a23 + b33 * a33;
	return dst;
}

export function updateTexture(
	gl: WebGL2RenderingContext,
	texture: WebGLTexture,
	{ internalFormat, src }: { internalFormat?: GLenum; src: TexImageSource },
) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		internalFormat ?? gl.RGBA,
		internalFormat ?? gl.RGBA,
		gl.UNSIGNED_BYTE,
		src,
	);
}

export interface TextureOptions {
	src?: TexImageSource;
	internalFormat?: GLenum;
	minFilter?: GLenum;
	magFilter?: GLenum;
	wrapS?: GLenum;
	wrapT?: GLenum;
}

/**
 * This function creates a WebGL texture, sets its parameters, and optionally uploads the provided image source.
 */
export function Texture(gl: WebGL2RenderingContext, o: TextureOptions) {
	o.wrapS ??= gl.CLAMP_TO_EDGE;
	o.wrapT ??= o.wrapS;

	const texture = gl.createTexture();
	if (!texture) throw new Error('Could not create texture');
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o.wrapS);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.wrapT);
	gl.texParameteri(
		gl.TEXTURE_2D,
		gl.TEXTURE_MIN_FILTER,
		o.minFilter ?? gl.NEAREST,
	);
	if (o.magFilter)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o.magFilter);

	if (o.src)
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			o.internalFormat ?? gl.RGBA,
			o.internalFormat ?? gl.RGBA,
			gl.UNSIGNED_BYTE,
			o.src,
		);

	return texture;
}

/**
 * Creates a WebGL texture with a single pixel of the given color, used for filling shapes with color.
 */
function ColorTexture(gl: WebGL2RenderingContext, color: Color) {
	return Texture(gl, {
		src: new ImageData(new Uint8ClampedArray(color), 1, 1),
		minFilter: gl.NEAREST,
	});
}

/**
 * Creates a WebGL 2.0 context with default shaders.
 *
 * This function initializes a WebGL 2.0 context, sets up a default shader program,
 * creates and binds buffers for vertex position and texture coordinates, and configures
 * initial state for rendering.
 * It also provides methods for manipulating the model-view matrix (`pushMatrix` and `popMatrix`)
 * for transformations.
 */
export function webgl2({ width, height }: { width: number; height: number }) {
	const { gl, glProgram } = Program({
		frag: `#version 300 es
precision mediump float;

uniform sampler2D u_texture;
in vec2 v_texcoord;
uniform vec4 u_color;

out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texcoord) * (u_color / 255.0);
}
		`,
		vtx: `#version 300 es
precision mediump float;

in vec4 a_position;
in vec2 a_texcoord;
uniform mat4 u_matrix;
uniform mat4 p_matrix;
uniform mat4 u_textureMatrix;

out vec2 v_texcoord;

void main() {
   gl_Position = p_matrix * u_matrix * a_position;
   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
}
		`,
		width,
		height,
	});

	gl.useProgram(glProgram);

	// Set the clear color to transparent black.
	gl.clearColor(0, 0, 0, 0);
	// Clear the color and depth buffers.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// Enable blending to allow transparency in the shader.
	gl.enable(gl.BLEND);

	// Tell WebGL to pre-multiply alpha so that we can use the alpha value as the
	// final color weight.
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

	// Enable blending to allow transparency in the shader.
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	const pmatrixLocation = gl.getUniformLocation(glProgram, 'p_matrix');
	const matrixLocation = gl.getUniformLocation(glProgram, 'u_matrix');
	const positionLocation = gl.getAttribLocation(glProgram, 'a_position');
	const texCoordLocation = gl.getAttribLocation(glProgram, 'a_texcoord');
	const texMatrixLocation = gl.getUniformLocation(
		glProgram,
		'u_textureMatrix',
	);
	const colorLocation = gl.getUniformLocation(glProgram, 'u_color');
	const positionBuffer = gl.createBuffer();
	const texCoordBuffer = gl.createBuffer();
	const indicesBuffer = gl.createBuffer();
	const orthographicM = orthographic(0, width, height, 0, -1, 1);

	// The data represents the vertices of a unit square in normalized device coordinates.
	const positionBufferData = new Float32Array([
		0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1,
	]);

	let u_color = whiteColor;
	let u_texture: WebGLTexture;

	// Initialize the buffer with vertex position data.
	setPosition(positionBufferData);

	// Initialize the buffer with texture coordinate data.
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		// The data represents the vertices of a unit square in normalized texture coordinates.
		new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]),
		gl.STATIC_DRAW,
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.enableVertexAttribArray(positionLocation);
	//gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	gl.enableVertexAttribArray(texCoordLocation);
	gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

	let M = identity;
	const matrixStack: Matrix[] = [];

	gl.uniformMatrix4fv(texMatrixLocation, false, M);
	gl.uniformMatrix4fv(matrixLocation, false, M);

	gl.uniform4fv(colorLocation, u_color);

	gl.viewport(0, 0, width, height);
	setProjectionMatrix(orthographicM);
	gl.activeTexture(gl.TEXTURE0);

	function setProjectionMatrix(m: Matrix) {
		gl.uniformMatrix4fv(pmatrixLocation, false, m);
	}

	function setPosition(data: ArrayBuffer | ArrayBufferView, size = 2) {
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(positionLocation, size, gl.FLOAT, false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	}

	function setIndices(data: ArrayBuffer | ArrayBufferView) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
	}

	function setTexture(texture: WebGLTexture) {
		if (u_texture !== texture) {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			u_texture = texture;
		}
	}

	return {
		canvas: gl.canvas,
		pushMatrix(m: Matrix) {
			matrixStack.push(M);
			if (m !== identity) {
				M = M === identity ? m : multiply(M, m);
				gl.uniformMatrix4fv(matrixLocation, false, M);
			}
		},
		popMatrix() {
			const M2 = matrixStack.pop();
			if (!M2) throw new Error('Matrix stack empty');
			M = M2;
			gl.uniformMatrix4fv(matrixLocation, false, M2);
		},
		get color() {
			return u_color;
		},
		set color(color: Color) {
			if (color !== u_color)
				gl.uniform4fv(colorLocation, (u_color = color));
		},
		resetPosition() {
			setPosition(positionBufferData);
		},
		setIndices,
		setPosition,
		setProjectionMatrix,
		resetProjectionMatrix() {
			setProjectionMatrix(orthographicM);
		},
		setTexture,
		createTexture: Texture.bind(0, gl),
		createColorTexture: ColorTexture.bind(0, gl),
		updateTexture(
			texture: WebGLTexture,
			p: { internalFormat?: GLenum; src: TexImageSource },
		) {
			setTexture(texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				p.internalFormat ?? gl.RGBA,
				p.internalFormat ?? gl.RGBA,
				gl.UNSIGNED_BYTE,
				p.src,
			);
		},
		draw() {
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		},
		drawElements: gl.drawElements.bind(gl),
	};
}

/**
 * Creates a matrix that transforms a `Box` to a transformation matrix.
 *
 * This function takes a `Box` object and optionally a destination `Matrix`. It populates the `dst` matrix with the
 * transformations specified by the `Box`. The transformations include:
 * - Rotation: Rotates the box around its center `cx`, `cy` by `rotation` radians.
 * - Scaling: Scales the box by `sx` and `sy` along the x and y axes.
 * - Translation: Translates the box to the position `x`, `y`.
 */
export function composeBox(box: Box, dst: Matrix = new Float32Array(16)) {
	const { x, y, sx, sy, cx, cy, w, h, rotation } = box;
	dst[2] = dst[3] = dst[6] = dst[7] = dst[8] = dst[9] = dst[11] = dst[14] = 0;
	dst[10] = dst[15] = 1;

	// Rotate
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	dst[0] = sx * cos;
	dst[1] = sx * sin;
	dst[4] = sy * -sin;
	dst[5] = sy * cos;

	// Translate negative origin
	dst[12] = dst[0] * -cx + dst[4] * -cy + x;
	dst[13] = dst[1] * -cx + dst[5] * -cy + y;

	// Scale w and h
	dst[0] *= w;
	dst[1] *= w;
	dst[4] *= h;
	dst[5] *= h;

	return dst;
}

export function Box(box?: Partial<Box>) {
	return {
		x: 0,
		y: 0,
		w: 0,
		h: 0,
		sx: 1,
		sy: 1,
		cx: 0,
		cy: 0,
		rotation: 0,
		...box,
	};
}

export type Mutable = { dirty?: boolean };
export type TextureComponent = TextureOptions & {
	src: TexImageSource;
} & Mutable;
export type ImageComponent = Omit<TextureOptions, 'src'> & {
	readonly src: string | TexImageSource;
};
export type FillComponent = {
	color: Color;
} & Mutable;
export type BoxComponent = Partial<Box> & Mutable;
export type UpdateFn = string | ((node: Node) => void);
export type WebglContext = ReturnType<typeof webgl2>;

export interface Node {
	box?: BoxComponent;
	image?: ImageComponent;
	texture?: TextureComponent;
	children?: Record<string | number, Node>;
	update?: UpdateFn;
	fill?: FillComponent;
	model?: ModelComponent;
}

export interface ModelComponent {
	gltf: Gltf;
}

export interface EngineOptions<T> {
	width: number;
	height: number;
	readonly root: T;
	// Defaults to false
	autoStart?: boolean;
	// If present the canvas will be attached to the specified element.
	container?: HTMLElement | string;
}

export async function engine<T extends Node>(p: EngineOptions<T>) {
	const program = webgl2(p);
	const { render, start, stop } = renderer();
	const whiteTexture = program.createColorTexture([255, 255, 255, 255]);
	const canvas = program.canvas as HTMLCanvasElement;

	if (p.container) {
		const container =
			typeof p.container === 'string'
				? document.querySelector(p.container)
				: p.container;
		if (!container)
			throw new Error('Could not find container element: ' + p.container);
		container.append(canvas);
	}

	/**
	 * Renders an image at the specified location.
	 * Takes an image source (`src`) as input.
	 */
	async function image(p: ImageComponent) {
		const img = typeof p.src === 'string' ? await loadImage(p.src) : p.src;
		texture({ ...p, src: img });
	}

	/**
	 * Renders a texture to the screen.
	 * It creates a WebGL texture, uploads the image data, sets the texture parameters, and draws the texture to the screen.
	 * It also handles updating the texture if the `dirty` flag is set in the `TextureComponent` object.
	 */
	function texture(p: TextureComponent) {
		const texture = program.createTexture(p);

		render(() => {
			if (p.dirty) program.updateTexture(texture, p);
			program.setTexture(texture);
			program.color = whiteColor;
			program.draw();
		});
	}

	function fill(p: FillComponent) {
		render(() => {
			program.color = p.color || whiteColor;
			program.setTexture(whiteTexture);
			program.draw();
		});
	}

	function boxComponent(box: BoxComponent) {
		let M = composeBox(Box(box));
		render(() => {
			if (box.dirty) M = composeBox(Box(box));
			program.pushMatrix(M);
		});
	}

	async function model(model: ModelComponent) {
		const { gltf } = await import('./gltf.js');
		render(await gltf(program, model.gltf));
	}

	async function load(node: Node) {
		const { update } = node;

		if (update) {
			const fn =
				typeof update === 'function'
					? update
					: new Function('node', update);
			render(() => fn(node));
		}
		if (node.box) boxComponent(node.box);
		if (node.fill) fill(node.fill);
		if (node.texture) texture(node.texture);
		if (node.image) await image(node.image);
		if (node.model) await model(node.model);

		if (node.children) {
			const nodes = Array.isArray(node.children)
				? node.children
				: Object.values(node.children);
			for (const child of nodes) await load(child);
		}
		if (node.box) render(() => program.popMatrix());
	}

	await load(p.root);

	if (p.autoStart) start();

	return {
		canvas,
		start,
		pause: stop,
		destroy() {
			stop();
			canvas.remove();
		},
	};
}

/**
 * Creates a render context that provides a `render` function to add rendering callbacks to a queue.
 * The `render` function accepts a callback function that will be executed during the render loop.
 */
export function renderer() {
	const render: (() => void)[] = [];
	let af: number;
	let running = false;

	function renderLoop() {
		for (const p of render) p();
		af = requestAnimationFrame(renderLoop);
	}

	return {
		render(cb: () => void) {
			render.push(cb);
		},
		start() {
			if (running) throw 'Engine already started';
			renderLoop();
			running = true;
		},
		stop() {
			cancelAnimationFrame(af);
			running = false;
		},
	};
}
