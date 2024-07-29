export const identity = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);
export const whiteColor = [255, 255, 255, 255];
export function Matrix(m) {
    return m ? new Float32Array(m) : identity.slice(0);
}
export function createCanvas(width, height) {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    return element;
}
export function createCanvasContext(width, height) {
    const canvas = createCanvas(width, height);
    const gl = canvas.getContext('webgl2');
    if (!gl)
        throw new Error('Could not create webgl2 canvas context');
    return gl;
}
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', () => reject(img));
    });
}
export function Shader(gl, source, type) {
    const result = gl.createShader(type);
    if (!result)
        throw new Error(`Could not create shader.`);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(result);
        throw new Error(`Could not compile shader.\n${info}`);
    }
    return result;
}
export function orthographic(left, right, bottom, top, near, far) {
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
export function Program({ frag, vtx, width, height, }) {
    const gl = createCanvasContext(width, height);
    const glProgram = gl.createProgram();
    if (!glProgram)
        throw new Error('Could not create WebGL Program');
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
export function multiply(a, b, dst = new Float32Array(16)) {
    const [a0, a1, a2, a3, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33,] = a;
    const [b0, b1, b2, b3, b10, b11, b12, b13, b20, b21, b22, b23, b30, b31, b32, b33,] = b;
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
export function updateTexture(gl, texture, { internalFormat, src }) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat ?? gl.RGBA, internalFormat ?? gl.RGBA, gl.UNSIGNED_BYTE, src);
}
export function Texture(gl, o) {
    o.wrapS ??= gl.CLAMP_TO_EDGE;
    o.wrapT ??= o.wrapS;
    const texture = gl.createTexture();
    if (!texture)
        throw new Error('Could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, o.minFilter ?? gl.NEAREST);
    if (o.magFilter)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o.magFilter);
    if (o.src)
        gl.texImage2D(gl.TEXTURE_2D, 0, o.internalFormat ?? gl.RGBA, o.internalFormat ?? gl.RGBA, gl.UNSIGNED_BYTE, o.src);
    return texture;
}
function ColorTexture(gl, color) {
    return Texture(gl, {
        src: new ImageData(new Uint8ClampedArray(color), 1, 1),
        minFilter: gl.NEAREST,
    });
}
export function webgl2({ width, height }) {
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
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const pmatrixLocation = gl.getUniformLocation(glProgram, 'p_matrix');
    const matrixLocation = gl.getUniformLocation(glProgram, 'u_matrix');
    const positionLocation = gl.getAttribLocation(glProgram, 'a_position');
    const texCoordLocation = gl.getAttribLocation(glProgram, 'a_texcoord');
    const texMatrixLocation = gl.getUniformLocation(glProgram, 'u_textureMatrix');
    const colorLocation = gl.getUniformLocation(glProgram, 'u_color');
    const positionBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();
    let u_color = whiteColor;
    let u_texture;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    let M = identity;
    const matrixStack = [];
    gl.uniformMatrix4fv(texMatrixLocation, false, M);
    gl.uniformMatrix4fv(matrixLocation, false, M);
    gl.uniform4fv(colorLocation, u_color);
    gl.viewport(0, 0, width, height);
    gl.uniformMatrix4fv(pmatrixLocation, false, orthographic(0, width, height, 0, -1, 1));
    gl.activeTexture(gl.TEXTURE0);
    function setTexture(texture) {
        if (u_texture !== texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            u_texture = texture;
        }
    }
    return {
        canvas: gl.canvas,
        pushMatrix(m) {
            matrixStack.push(M);
            if (m !== identity) {
                M = M === identity ? m : multiply(M, m);
                gl.uniformMatrix4fv(matrixLocation, false, M);
            }
        },
        popMatrix() {
            const M2 = matrixStack.pop();
            if (!M2)
                throw new Error('Matrix stack empty');
            M = M2;
            gl.uniformMatrix4fv(matrixLocation, false, M2);
        },
        get color() {
            return u_color;
        },
        set color(color) {
            if (color !== u_color)
                gl.uniform4fv(colorLocation, (u_color = color));
        },
        setTexture,
        createTexture: Texture.bind(0, gl),
        createColorTexture: ColorTexture.bind(0, gl),
        updateTexture(texture, p) {
            setTexture(texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, p.internalFormat ?? gl.RGBA, p.internalFormat ?? gl.RGBA, gl.UNSIGNED_BYTE, p.src);
        },
        draw() {
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
    };
}
export function composeBox(box, dst = new Float32Array(16)) {
    const { x, y, sx, sy, cx, cy, w, h, rotation } = box;
    dst[2] = dst[3] = dst[6] = dst[7] = dst[8] = dst[9] = dst[11] = dst[14] = 0;
    dst[10] = dst[15] = 1;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    dst[0] = sx * cos;
    dst[1] = sx * sin;
    dst[4] = sy * -sin;
    dst[5] = sy * cos;
    dst[12] = dst[0] * -cx + dst[4] * -cy + x;
    dst[13] = dst[1] * -cx + dst[5] * -cy + y;
    dst[0] *= w;
    dst[1] *= w;
    dst[4] *= h;
    dst[5] *= h;
    return dst;
}
export function Box(box) {
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
export async function engine(p) {
    const program = webgl2(p);
    const { render, start, stop } = renderer();
    const whiteTexture = program.createColorTexture([255, 255, 255, 255]);
    const canvas = program.canvas;
    if (p.container)
        p.container.append(canvas);
    async function image(p) {
        const img = typeof p.src === 'string' ? await loadImage(p.src) : p.src;
        texture({ ...p, src: img });
    }
    function texture(p) {
        const texture = program.createTexture(p);
        render(() => {
            if (p.dirty)
                program.updateTexture(texture, p);
            program.setTexture(texture);
            program.color = whiteColor;
            program.draw();
        });
    }
    function fill(p) {
        render(() => {
            program.color = p.color || whiteColor;
            program.setTexture(whiteTexture);
            program.draw();
        });
    }
    function boxComponent(box) {
        let M = composeBox(Box(box));
        render(() => {
            if (box.dirty)
                M = composeBox(Box(box));
            program.pushMatrix(M);
        });
    }
    async function load(node) {
        const { children, update } = node;
        if (update)
            render(() => update(node));
        if (node.box)
            boxComponent(node.box);
        if (node.fill)
            fill(node.fill);
        if (node.texture)
            texture(node.texture);
        if (node.image)
            await image(node.image);
        if (children) {
            const nodes = Array.isArray(children)
                ? children
                : Object.values(children);
            for (const child of nodes)
                await load(child);
        }
        if (node.box)
            render(() => program.popMatrix());
    }
    await load(p.root);
    if (p.autoStart)
        start();
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
export function renderer() {
    const render = [];
    let af;
    function renderLoop() {
        for (const p of render)
            p();
        af = requestAnimationFrame(renderLoop);
    }
    return {
        render(cb) {
            render.push(cb);
        },
        start() {
            renderLoop();
        },
        stop() {
            cancelAnimationFrame(af);
        },
    };
}
