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
export function updateTexture(gl, { texture, internalFormat, src, }) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat ?? gl.RGBA, internalFormat ?? gl.RGBA, gl.UNSIGNED_BYTE, src);
}
export function Texture(gl, { src, internalFormat, minFilter, }) {
    minFilter ??= gl.LINEAR;
    const texture = gl.createTexture();
    if (!texture)
        throw new Error('Could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minFilter);
    if (src)
        updateTexture(gl, { texture, internalFormat, src });
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
        frag: `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texcoord;
uniform vec4 u_color;

void main() {
   gl_FragColor = texture2D(u_texture, v_texcoord) * (u_color/255.0);
}
		`,
        vtx: `
attribute vec4 a_position;
attribute vec2 a_texcoord;
uniform mat4 u_matrix;
uniform mat4 p_matrix;
varying vec2 v_texcoord;
uniform mat4 u_textureMatrix;

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
    let M = Matrix();
    const matrixStack = [];
    gl.uniformMatrix4fv(texMatrixLocation, false, M);
    gl.uniformMatrix4fv(matrixLocation, false, M);
    gl.uniform4fv(colorLocation, u_color);
    gl.viewport(0, 0, width, height);
    gl.uniformMatrix4fv(pmatrixLocation, false, orthographic(0, width, height, 0, -1, 1));
    return {
        webgl2: {
            gl,
            pushMatrix(m) {
                matrixStack.push(M);
                if (m !== identity) {
                    M = multiply(M, m);
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
                gl.uniform4fv(colorLocation, (u_color = color));
            },
            texture: Texture.bind(0, gl),
            colorTexture: ColorTexture.bind(0, gl),
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
export function image({ src }) {
    return async ({ webgl2, renderer, }) => {
        const gl = webgl2.gl;
        const img = typeof src === 'string' ? await loadImage(src) : src;
        const texture = webgl2.texture({ src: img });
        renderer.render(() => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            webgl2.color = whiteColor;
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        });
    };
}
const components = {
    image,
};
export async function engine(p) {
    const ctx = {
        ...webgl2(p),
        ...renderer(),
    };
    const whiteTexture = ctx.webgl2.colorTexture([255, 255, 255, 255]);
    const render = ctx.renderer.render;
    document.body.append(ctx.webgl2.gl.canvas);
    async function load(node) {
        const { box, image, children, update, fill } = node;
        if (update)
            render(() => update(node));
        if (box) {
            render(() => {
                const M = composeBox(Box(node.box));
                ctx.webgl2.pushMatrix(M);
            });
        }
        if (fill) {
            render(() => {
                const gl = ctx.webgl2.gl;
                ctx.webgl2.color = node.fill || whiteColor;
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            });
        }
        if (image)
            await components.image(image)(ctx);
        if (children) {
            const nodes = Array.isArray(children)
                ? children
                : Object.values(children);
            for (const child of nodes)
                await load(child);
        }
        if (box)
            render(() => ctx.webgl2.popMatrix());
    }
    await load(p.root);
    ctx.renderer.start();
    return {
        start: ctx.renderer.start,
        pause: ctx.renderer.stop,
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
        renderer: {
            render(cb) {
                render.push(cb);
            },
            start() {
                renderLoop();
            },
            stop() {
                cancelAnimationFrame(af);
            },
        },
    };
}
