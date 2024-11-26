function uriToBuffer(url) {
    return fetch(url).then(r => r.arrayBuffer());
}
const M = new Float32Array([1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1]);
export async function gltf(ctx, data) {
    if (!data.scenes || data.scene === undefined)
        return () => { };
    const scene = data.scenes[data.scene];
    const buffers = data.buffers &&
        (await Promise.all(data.buffers.map(b => {
            if (b.uri)
                return uriToBuffer(b.uri);
        })));
    const views = buffers &&
        data.bufferViews?.map(b => {
            const buffer = buffers[b.buffer];
            return (buffer &&
                new Uint8Array(buffer, b.byteOffset ?? 0, b.byteLength));
        });
    const accessors = data.accessors?.map(a => {
        const bufferView = a.bufferView !== undefined && views?.[a.bufferView];
        if (!bufferView)
            throw 'Invalid bufferView';
        return {
            ...a,
            bufferView,
        };
    });
    const nodes = data.nodes?.map(loadNode) ?? [];
    function loadNode(n) {
        const matrix = n.matrix && new Float32Array(n.matrix);
        const mesh = n.mesh !== undefined ? data.meshes?.[n.mesh] : undefined;
        return { ...n, mesh, matrix };
    }
    function mapNode(n) {
        renderNode(nodes[n]);
    }
    function renderAttribute(name, index) {
        if (name === 'POSITION') {
            const accessor = accessors?.[index];
            if (accessor)
                ctx.setPosition(accessor.bufferView, 3);
        }
    }
    function renderPrimitive(p) {
        if (p.attributes)
            for (const a in p.attributes)
                renderAttribute(a, p.attributes[a]);
        if (p.indices !== undefined) {
            const accessor = accessors?.[p.indices];
            if (accessor) {
                ctx.setIndices(accessor.bufferView);
                ctx.drawElements(p.mode ?? WebGL2RenderingContext.TRIANGLES, accessor.count, accessor.componentType, accessor.byteOffset ?? 0);
            }
        }
    }
    function renderMesh(n) {
        if (n.primitives)
            for (const p of n.primitives)
                renderPrimitive(p);
    }
    function renderNode(n) {
        if (n.matrix)
            ctx.pushMatrix(n.matrix);
        if (n.mesh)
            renderMesh(n.mesh);
        n.children?.forEach(mapNode);
        if (n.matrix)
            ctx.popMatrix();
    }
    return () => {
        ctx.pushMatrix(M);
        scene?.nodes?.forEach(mapNode);
        ctx.popMatrix();
        ctx.resetPosition();
    };
}
