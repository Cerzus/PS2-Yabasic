'use strict';

class GraphicsScreen {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // graphics back buffer
        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const backBuffer = canvas;

        // graphics front buffer
        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;
        canvas.width = this.width;
        canvas.height = this.height;
        const frontBuffer = canvas;

        // dom element
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.append(backBuffer);
        div.append(frontBuffer);
        this.domElement = div;

        this.gl = backBuffer.getContext('webgl', {
            antialias: false,
            preserveDrawingBuffer: true,
        });

        this.frontBufferContext = frontBuffer.getContext('2d');

        const tempBuffer = document.createElement('canvas');
        tempBuffer.width = this.width;
        tempBuffer.height = this.height;
        this.tempBufferContext = tempBuffer.getContext('2d');

        this.shapesProgram = this.createShapesProgram(this.gl);
        this.shapesCoordsBuffer = this.gl.createBuffer();
        this.shapesColorBuffer = this.gl.createBuffer();
        this.shapesTexCoordsBuffer = this.gl.createBuffer();
        this.shapesUseTextureBuffer = this.gl.createBuffer();

        this.bufferSwapProgram = this.createBufferSwapProgram(this.gl);
        this.bufferSwapCoordsBuffer = this.gl.createBuffer();
        this.bufferSwapTexCoordsBuffer = this.gl.createBuffer();

        this.gl.viewport(0, 0, this.width, this.height);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.maxCoordsBeforeSend = 5000;

        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        var context = canvas.getContext('2d');
        context.font = '16px Lucida Console';
        context.textBaseline = 'top';
        context.fillStyle = 'white';

        for (let i = 0; i < 16; i++) {
            if (i & 0x6) {
                for (let j = 0; j < 16; j++) {
                    context.fillText(String.fromCharCode(i * 16 + j), 16 * j + 1, 16 * i);
                }
            }
        }

        this.textTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.ALPHA, this.gl.ALPHA, this.gl.UNSIGNED_BYTE, canvas);
    }

    getDomElement() {
        return this.domElement;
    }

    reset(r, g, b) {
        this.frontBufferContext.canvas.style.display = 'none';
        this.frontBufferContext.fillStyle = 'rgb(' + r * 255 + ',' + g * 255 + ',' + b * 255 + ')';
        this.frontBufferContext.fillRect(0, 0, this.width, this.height);
        this.bufferState = 0;
        this.gl.clearColor(r, g, b, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.coords = [];
        this.colors = [];
        this.texCoords = [];
    }

    sendToGraphicsCard() {
        const numberOfCoordinates = this.coords.length / 2;

        if (numberOfCoordinates > 0) {
            this.useShapesProgram(this.coords, this.colors, this.texCoords);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, numberOfCoordinates);
            this.coords = [];
            this.colors = [];
            this.texCoords = [];
        }
    }

    update() {
        this.sendToGraphicsCard();
    }

    clearWindow(r, g, b) {
        this.gl.clearColor(r, g, b, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    setDrawBuf(buffer) {
        this.updateBufferState(
            !!buffer ? (this.bufferState | 2) : (this.bufferState & 1)
        );
    }

    setDispBuf(buffer) {
        this.updateBufferState(
            !!buffer ? (this.bufferState | 1) : (this.bufferState & 2)
        );
    }

    circle(x, y, radius, color, fill) {
        const angle = 2 * Math.PI / radius;

        if (fill) {
            const xc = (x - 320 + 0.5) / 320;
            const yc = (256 - y - 0.5) / 256;

            let x1 = xc;
            let y1 = yc - radius / 256;

            const r = color[0];
            const g = color[1];
            const b = color[2];

            const scaledRadiusX = radius / 320;
            const scaledRadiusY = radius / 256;

            let colorsIndex = this.colors.length;
            let coordsIndex = this.coords.length;
            let texCoordsIndex = this.texCoords.length;

            for (let i = 1; i <= radius; i++) {
                let x2 = xc + Math.sin(i * angle) * scaledRadiusX;
                let y2 = yc - Math.cos(i * angle) * scaledRadiusY;

                this.coords[coordsIndex++] = x1;
                this.coords[coordsIndex++] = y1;
                this.coords[coordsIndex++] = x2;
                this.coords[coordsIndex++] = y2;
                this.coords[coordsIndex++] = xc;
                this.coords[coordsIndex++] = yc;

                this.texCoords[texCoordsIndex++] = 0;
                this.texCoords[texCoordsIndex++] = 0;
                this.texCoords[texCoordsIndex++] = 0;
                this.texCoords[texCoordsIndex++] = 0;
                this.texCoords[texCoordsIndex++] = 0;
                this.texCoords[texCoordsIndex++] = 0;

                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;

                x1 = x2;
                y1 = y2;
            }
        } else {
            let x1 = x;
            let y1 = y + radius;

            for (let i = 1; i <= radius; i++) {
                let x2 = x + Math.sin(i * angle) * radius;
                let y2 = y + Math.cos(i * angle) * radius;

                this.line(x1, y1, x2, y2, color);

                x1 = x2;
                y1 = y2;
            }
        }

        if (this.coords.length >= this.maxCoordsBeforeSend) {
            this.sendToGraphicsCard();
        }
    }

    text(text, x, y, color, alignment) {
        let textWidth = 0;
        for (let i = 0; i < text.length; i++) {
            textWidth = Math.max(textWidth, text[i].replace(/[^\S ]/g, '').length);
        }

        if (alignment[0] === 'c') x -= Math.ceil(textWidth / 2) * 10;
        if (alignment[0] === 'r') x -= textWidth * 10;
        y = y + 6;
        if (alignment[1] === 'c') y -= Math.ceil(text.length / 2) * 18;
        if (alignment[1] === 'b') y -= text.length * 18;

        const oneOver320 = 1 / 320;
        const oneOver256 = 1 / 256;

        const x1 = (x - 320) * oneOver320;
        const y1 = (256 - y) * oneOver256;

        const r = color[0];
        const g = color[1];
        const b = color[2];

        let colorsIndex = this.colors.length;
        let coordsIndex = this.coords.length;
        let texCoordsIndex = this.texCoords.length;

        const pxInc = 10 * oneOver320;
        const pyInc = -18 * oneOver256;

        let py1 = y1;
        let py2 = py1 - 16 * oneOver256;

        for (let i = 0; i < text.length; i++) {
            const line = text[i];

            let px1 = x1;
            let px2 = px1 + 12 * oneOver320;

            for (let j = 0; j < line.length; j++) {
                const ascii = line.charCodeAt(j);

                const tx1 = (ascii & 0x0f) * oneOver256 * 16;
                const ty1 = (ascii & 0xf0) * oneOver256;
                const tx2 = tx1 + oneOver256 * 12;
                const ty2 = ty1 + oneOver256 * 16;

                this.coords[coordsIndex++] = px1;
                this.coords[coordsIndex++] = py1;
                this.coords[coordsIndex++] = px2;
                this.coords[coordsIndex++] = py1;
                this.coords[coordsIndex++] = px1;
                this.coords[coordsIndex++] = py2;
                this.coords[coordsIndex++] = px2;
                this.coords[coordsIndex++] = py1;
                this.coords[coordsIndex++] = px1;
                this.coords[coordsIndex++] = py2;
                this.coords[coordsIndex++] = px2;
                this.coords[coordsIndex++] = py2;

                this.texCoords[texCoordsIndex++] = tx1;
                this.texCoords[texCoordsIndex++] = ty1;
                this.texCoords[texCoordsIndex++] = tx2;
                this.texCoords[texCoordsIndex++] = ty1;
                this.texCoords[texCoordsIndex++] = tx1;
                this.texCoords[texCoordsIndex++] = ty2;
                this.texCoords[texCoordsIndex++] = tx2;
                this.texCoords[texCoordsIndex++] = ty1;
                this.texCoords[texCoordsIndex++] = tx1;
                this.texCoords[texCoordsIndex++] = ty2;
                this.texCoords[texCoordsIndex++] = tx2;
                this.texCoords[texCoordsIndex++] = ty2;

                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;
                this.colors[colorsIndex++] = r;
                this.colors[colorsIndex++] = g;
                this.colors[colorsIndex++] = b;

                px1 += pxInc;
                px2 += pxInc;
            }

            py1 += pyInc;
            py2 += pyInc;
        }

        if (this.coords.length >= this.maxCoordsBeforeSend) {
            this.sendToGraphicsCard();
        }
    }

    dot(x, y, color) {
        x = (x - 320 + 0.498) / 320;
        y = (256 - y - 0.498) / 256;

        const r = color[0];
        const g = color[1];
        const b = color[2];

        let colorsIndex = this.colors.length;
        let coordsIndex = this.coords.length;
        let texCoordsIndex = this.texCoords.length;

        this.coords[coordsIndex++] = x;
        this.coords[coordsIndex++] = y;
        this.coords[coordsIndex++] = x + 1 / 320;
        this.coords[coordsIndex++] = y;
        this.coords[coordsIndex++] = x;
        this.coords[coordsIndex++] = y - 1 / 256;

        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;

        this.colors[colorsIndex++] = r;
        this.colors[colorsIndex++] = g;
        this.colors[colorsIndex++] = b;
        this.colors[colorsIndex++] = r;
        this.colors[colorsIndex++] = g;
        this.colors[colorsIndex++] = b;
        this.colors[colorsIndex++] = r;
        this.colors[colorsIndex++] = g;
        this.colors[colorsIndex++] = b;

        if (this.coords.length >= this.maxCoordsBeforeSend) {
            this.sendToGraphicsCard();
        }
    }

    line(x1, y1, x2, y2, color) {
        if (y1 === y2) {
            this.rectangle(x1, y1 - 0.5, x2, y1 + 0.5, color, true);
        } else if (x1 === x2) {
            this.rectangle(x1 - 0.5, y1, x1 + 0.5, y2, color, true);
        } else {
            const slope = (x2 - x1) / (y2 - y1);

            // more horizontal
            if (Math.abs(slope) > 1) {
                var px1 = x1;
                var py1 = y1 - 0.5;
                var px2 = x1;
                var py2 = y1 + 0.5;
                var px3 = x2;
                var py3 = y2 - 0.5;
                var px4 = x2;
                var py4 = y2 + 0.5;
            }
            // more vertical
            else {
                var px1 = x1 - 0.5;
                var py1 = y1;
                var px2 = x1 + 0.5;
                var py2 = y1;
                var px3 = x2 - 0.5;
                var py3 = y2;
                var px4 = x2 + 0.5;
                var py4 = y2;
            }

            px1 = (px1 - 320 + 0.498) / 320;
            py1 = (256 - py1 - 0.498) / 256;
            px2 = (px2 - 320 + 0.498) / 320;
            py2 = (256 - py2 - 0.498) / 256;
            px3 = (px3 - 320 + 0.498) / 320;
            py3 = (256 - py3 - 0.498) / 256;
            px4 = (px4 - 320 + 0.498) / 320;
            py4 = (256 - py4 - 0.498) / 256;

            const r = color[0];
            const g = color[1];
            const b = color[2];

            let colorsIndex = this.colors.length;
            let coordsIndex = this.coords.length;
            let texCoordsIndex = this.texCoords.length;

            this.coords[coordsIndex++] = px1;
            this.coords[coordsIndex++] = py1;
            this.coords[coordsIndex++] = px2;
            this.coords[coordsIndex++] = py2;
            this.coords[coordsIndex++] = px3;
            this.coords[coordsIndex++] = py3;
            this.coords[coordsIndex++] = px2;
            this.coords[coordsIndex++] = py2;
            this.coords[coordsIndex++] = px3;
            this.coords[coordsIndex++] = py3;
            this.coords[coordsIndex++] = px4;
            this.coords[coordsIndex++] = py4;

            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;

            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
        }
    }

    rectangle(x1, y1, x2, y2, color, fill) {
        if (fill) {
            x1 = (x1 - 320 + 0.498) / 320;
            y1 = (256 - y1 - 0.498) / 256;
            x2 = (x2 - 320 + 0.498) / 320;
            y2 = (256 - y2 - 0.498) / 256;

            const r = color[0];
            const g = color[1];
            const b = color[2];

            let colorsIndex = this.colors.length;
            let coordsIndex = this.coords.length;
            let texCoordsIndex = this.texCoords.length;

            this.coords[coordsIndex++] = x1;
            this.coords[coordsIndex++] = y1;
            this.coords[coordsIndex++] = x2;
            this.coords[coordsIndex++] = y1;
            this.coords[coordsIndex++] = x1;
            this.coords[coordsIndex++] = y2;
            this.coords[coordsIndex++] = x2;
            this.coords[coordsIndex++] = y1;
            this.coords[coordsIndex++] = x1;
            this.coords[coordsIndex++] = y2;
            this.coords[coordsIndex++] = x2;
            this.coords[coordsIndex++] = y2;

            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;

            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;

            if (this.coords.length >= this.maxCoordsBeforeSend) {
                this.sendToGraphicsCard();
            }
        } else {
            this.line(x1, y1, x2, y1, color);
            this.line(x1, y1, x1, y2, color);
            this.line(x2, y1, x2, y2, color);
            this.line(x1, y2, x2, y2, color);
        }
    }

    triangle(x1, y1, x2, y2, x3, y3, color, fill) {
        if (fill) {
            x1 = (x1 - 320 + 0.498) / 320;
            y1 = (256 - y1 - 0.498) / 256;
            x2 = (x2 - 320 + 0.498) / 320;
            y2 = (256 - y2 - 0.498) / 256;
            x3 = (x3 - 320 + 0.498) / 320;
            y3 = (256 - y3 - 0.498) / 256;

            const r = color[0];
            const g = color[1];
            const b = color[2];

            let colorsIndex = this.colors.length;
            let coordsIndex = this.coords.length;
            let texCoordsIndex = this.texCoords.length;

            this.coords[coordsIndex++] = x1;
            this.coords[coordsIndex++] = y1;
            this.coords[coordsIndex++] = x2;
            this.coords[coordsIndex++] = y2;
            this.coords[coordsIndex++] = x3;
            this.coords[coordsIndex++] = y3;

            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;
            this.texCoords[texCoordsIndex++] = 0;

            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;
            this.colors[colorsIndex++] = r;
            this.colors[colorsIndex++] = g;
            this.colors[colorsIndex++] = b;

            if (this.coords.length >= this.maxCoordsBeforeSend) {
                this.sendToGraphicsCard();
            }
        } else {
            this.line(x1, y1, x2, y2, color);
            this.line(x2, y2, x3, y3, color);
            this.line(x3, y3, x1, y1, color);
        }
    }

    gtriangle(x1, y1, x2, y2, x3, y3, color1, color2, color3) {
        x1 = (x1 - 320 + 0.498) / 320;
        y1 = (256 - y1 - 0.498) / 256;
        x2 = (x2 - 320 + 0.498) / 320;
        y2 = (256 - y2 - 0.498) / 256;
        x3 = (x3 - 320 + 0.498) / 320;
        y3 = (256 - y3 - 0.498) / 256;

        const r1 = color1[0];
        const g1 = color1[1];
        const b1 = color1[2];
        const r2 = color2[0];
        const g2 = color2[1];
        const b2 = color2[2];
        const r3 = color3[0];
        const g3 = color3[1];
        const b3 = color3[2];

        let colorsIndex = this.colors.length;
        let coordsIndex = this.coords.length;
        let texCoordsIndex = this.texCoords.length;

        this.coords[coordsIndex++] = x1;
        this.coords[coordsIndex++] = y1;
        this.coords[coordsIndex++] = x2;
        this.coords[coordsIndex++] = y2;
        this.coords[coordsIndex++] = x3;
        this.coords[coordsIndex++] = y3;

        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;
        this.texCoords[texCoordsIndex++] = 0;

        this.colors[colorsIndex++] = r1;
        this.colors[colorsIndex++] = g1;
        this.colors[colorsIndex++] = b1;
        this.colors[colorsIndex++] = r2;
        this.colors[colorsIndex++] = g2;
        this.colors[colorsIndex++] = b2;
        this.colors[colorsIndex++] = r3;
        this.colors[colorsIndex++] = g3;
        this.colors[colorsIndex++] = b3;

        if (this.coords.length >= this.maxCoordsBeforeSend) {
            this.sendToGraphicsCard();
        }
    }

    /////////////
    // PRIVATE //
    /////////////

    createShapesProgram(gl) {
        let vertShader = gl.createShader(gl.VERTEX_SHADER);
        let vertCode = `
            attribute vec2 coords;
            attribute vec3 color;
            attribute vec2 texCoords;

            varying vec3 vColor;
            varying vec2 vTexCoords;

            void main(void) {
                gl_Position = vec4(coords, 0.0, 1.0);
                vTexCoords = texCoords;
                vColor = color;
            }`;
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        let fragCode = `
            precision mediump float;

            varying vec3 vColor;
            varying vec2 vTexCoords;
            
            uniform sampler2D sampler;

            void main(void) {
                if (vTexCoords.t == 0.0) {
                    gl_FragColor = vec4(vColor, 1.0);
                } else {
                    gl_FragColor = vec4(vColor, texture2D(sampler, vec2(vTexCoords.s, vTexCoords.t)).a);
                }
            }`;
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        let program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        program.coords = gl.getAttribLocation(program, 'coords');
        gl.enableVertexAttribArray(program.coords);

        program.color = gl.getAttribLocation(program, 'color');
        gl.enableVertexAttribArray(program.color);

        program.texCoords = gl.getAttribLocation(program, 'texCoords');
        gl.enableVertexAttribArray(program.texCoords);

        return program;
    }

    createBufferSwapProgram(gl) {
        let vertShader = gl.createShader(gl.VERTEX_SHADER);
        let vertCode = `
            attribute vec2 coords;
            attribute vec2 texCoords;

            varying vec2 vTexCoords;

            void main(void) {
                gl_Position = vec4(coords, 0.0, 1.0);
                vTexCoords = texCoords;
            }`;
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        let fragCode = `
            precision mediump float;

            varying vec2 vTexCoords;

            uniform sampler2D sampler;

            void main(void) {
                gl_FragColor = texture2D(sampler, vec2(vTexCoords.s, vTexCoords.t));
            }`;
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);

        let program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        program.coords = gl.getAttribLocation(program, 'coords');
        gl.enableVertexAttribArray(program.coords);

        program.texCoords = gl.getAttribLocation(program, 'texCoords');
        gl.enableVertexAttribArray(program.texCoords);

        program.sampler = gl.getUniformLocation(program, 'sampler');

        this.bufferSwapTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.bufferSwapTexture);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE); this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        this.gl.uniform1i(program.sampler, 1);

        return program;
    }

    useProgram(program) {
        if (this.shaderProgram !== program) {
            this.gl.useProgram(program);
            this.shaderProgram = program;
        }
    }

    useShapesProgram(coords, colors, texCoords) {
        this.useProgram(this.shapesProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shapesCoordsBuffer);
        this.gl.vertexAttribPointer(this.shapesProgram.coords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shapesColorBuffer);
        this.gl.vertexAttribPointer(this.shapesProgram.color, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shapesTexCoordsBuffer);
        this.gl.vertexAttribPointer(this.shapesProgram.texCoords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.DYNAMIC_DRAW);
    }

    useBufferSwapProgram(coords, texCoords) {
        this.useProgram(this.bufferSwapProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferSwapCoordsBuffer);
        this.gl.vertexAttribPointer(this.bufferSwapProgram.coords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferSwapTexCoordsBuffer);
        this.gl.vertexAttribPointer(this.bufferSwapProgram.texCoords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.DYNAMIC_DRAW);
    }

    // bufferState is drawbuf << 1 + dispbuf
    updateBufferState(bufferState) {
        // if the new buffer state is the same we don't have to do anything
        if (bufferState === this.bufferState) {
            return;
        }

        // the state starts where drawbuf and dispbuf are the same
        if (this.bufferState === 0b00 || this.bufferState === 0b11) {
            // if drawbuf is changed
            if ((this.bufferState ^ bufferState) === 0b10) {
                this.swapFrontAndBackBuffers();
            }

            this.frontBufferContext.canvas.style.display = 'initial';
        }
        // the state starts where drawbuf and dispbuf are different
        else if (this.bufferState === 0b01 || this.bufferState === 0b10) {
            this.frontBufferContext.canvas.style.display = 'none';

            // if drawbuf is changed
            if ((this.bufferState ^ bufferState) === 0b10) {
                this.swapFrontAndBackBuffers();
            }
        }

        this.bufferState = bufferState;
    }

    swapFrontAndBackBuffers() {
        this.update();
        this.tempBufferContext.drawImage(this.frontBufferContext.canvas, 0, 0);
        this.frontBufferContext.drawImage(this.gl.canvas, 0, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.bufferSwapTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.tempBufferContext.canvas);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        this.gl.uniform1i(this.bufferSwapProgram.samplerUniform, 1);

        this.useBufferSwapProgram(
            [-1, 1, 1, 1, -1, -1, 1, -1],
            [0, 1, 1, 1, 0, 0, 1, 0],
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
