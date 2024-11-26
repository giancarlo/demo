///<amd-module name="@j5g3/core/gltf.js"/>
import type { Matrix, WebglContext } from './engine.js';

export interface Gltf {
	accessors?: Accessor[];
	asset: { version: string };
	nodes?: Node[];
	scene?: number;
	scenes?: Scene[];
	meshes?: Mesh[];
	buffers?: Buffer[];
	bufferViews?: BufferView[];
}

export interface Scene {
	nodes?: number[];
	name?: string;
}

export interface Node {
	matrix?: number[];
	children?: number[];
	mesh?: number;
}

type ResolvedNode = Omit<Node, 'matrix' | 'mesh'> & {
	matrix?: Matrix;
	mesh?: Mesh;
};

export interface MeshPrimitive {
	attributes: Record<string, number>;
	indices?: number;
	material?: number;
	mode?: number;
}

export interface Mesh {
	name?: string;
	primitives?: MeshPrimitive[];
}

export interface Accessor {
	bufferView?: number;
	byteOffset?: number;
	componentType: number;
	count: number;
	type: string;
}

export type ResolvedAccessor = Omit<Accessor, 'bufferView'> & {
	bufferView: ArrayBufferView;
};

export interface Buffer {
	uri?: string;
	byteLength: number;
}

export interface BufferView {
	buffer: number;
	byteOffset?: number;
	byteLength: number;
	byteStride?: number;
	target?: number;
	name?: string;
}

function uriToBuffer(url: string) {
	return fetch(url).then(r => r.arrayBuffer());
}

// The orthographic camera in the engine uses a different coordinate system.
// Therefore, we apply this matrix to adjust the y-coordinates of the model, ensuring they align properly.
const M = new Float32Array([1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);

/*
 * The `gltf` function is an asynchronous function that takes a WebGL context
 * and a GLTF data object. The function returns a render function.
 */
export async function gltf(ctx: WebglContext, data: Gltf) {
	if (!data.scenes || data.scene === undefined) return () => {};

	const scene = data.scenes[data.scene];

	const buffers =
		data.buffers &&
		(await Promise.all(
			data.buffers.map(b => {
				if (b.uri) return uriToBuffer(b.uri);
			}),
		));
	const views =
		buffers &&
		data.bufferViews?.map(b => {
			const buffer = buffers[b.buffer];
			return (
				buffer &&
				new Uint8Array(buffer, b.byteOffset ?? 0, b.byteLength)
			);
		});
	const accessors = data.accessors?.map(a => {
		const bufferView = a.bufferView !== undefined && views?.[a.bufferView];
		if (!bufferView) throw 'Invalid bufferView';
		return {
			...a,
			bufferView,
		};
	});

	const nodes = data.nodes?.map(loadNode) ?? [];

	/*
	 * The `loadNode` function takes a `Node` from the GLTF data and resolves its
	 * matrix and mesh properties. If a matrix exists, it is converted to a
	 * `Float32Array`. The function also
	 * resolves the mesh based on its index in the GLTF meshes array.
	 */
	function loadNode(n: Node) {
		const matrix = n.matrix && new Float32Array(n.matrix);
		const mesh = n.mesh !== undefined ? data.meshes?.[n.mesh] : undefined;
		return { ...n, mesh, matrix };
	}

	function mapNode(n: number) {
		renderNode(nodes[n]);
	}

	/*
	 * The `renderAttribute` function processes individual mesh attributes for rendering.
	 */
	function renderAttribute(name: string, index: number) {
		if (name === 'POSITION') {
			const accessor = accessors?.[index];
			if (accessor) ctx.setPosition(accessor.bufferView, 3);
		}
	}

	/*
	 * The `renderPrimitive` function begins by iterating through the primitive's
	 * attributes.
	 * If the primitive has indices (defining the order of vertices for drawing),
	 * it retrieves the corresponding accessor, updates the context with this
	 * index data, and calls the appropriate WebGL draw function to render the
	 * elements. This function is critical for drawing the geometry defined by
	 * the primitive information from the GLTF data.
	 */
	function renderPrimitive(p: MeshPrimitive) {
		if (p.attributes)
			for (const a in p.attributes) renderAttribute(a, p.attributes[a]);

		if (p.indices !== undefined) {
			const accessor = accessors?.[p.indices];
			if (accessor) {
				ctx.setIndices(accessor.bufferView);
				ctx.drawElements(
					p.mode ?? WebGL2RenderingContext.TRIANGLES,
					accessor.count,
					accessor.componentType,
					accessor.byteOffset ?? 0,
				);
			}
		}
	}

	function renderMesh(n: Mesh) {
		if (n.primitives) for (const p of n.primitives) renderPrimitive(p);
	}

	function renderNode(n: ResolvedNode) {
		if (n.matrix) ctx.pushMatrix(n.matrix);
		if (n.mesh) renderMesh(n.mesh);

		n.children?.forEach(mapNode);

		if (n.matrix) ctx.popMatrix();
	}

	return () => {
		ctx.pushMatrix(M);
		scene?.nodes?.forEach(mapNode);
		ctx.popMatrix();
		ctx.resetPosition();
	};
}
