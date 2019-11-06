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
        this.frontBuffer = canvas;

        // dom element
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.append(backBuffer);
        div.append(this.frontBuffer);
        this.domElement = div;

        this.backBufferContext = backBuffer.getContext('2d', { alpha: false });
        this.frontBufferContext = this.frontBuffer.getContext('2d');

        // const tempBuffer = document.createElement('canvas');
        // tempBuffer.width = this.width;
        // tempBuffer.height = this.height;
        // this.tempBufferContext = tempBuffer.getContext('2d');
    }

    getDomElement() {
        return this.domElement;
    }

    update() {
        this.backBufferContext.putImageData(this.pixels, 0, 0);
    }

    reset(r, g, b) {
        this.frontBufferContext.canvas.style.display = 'none';
        this.frontBufferContext.fillStyle = 'rgb(' + r * 255 + ',' + g * 255 + ',' + b * 255 + ')';
        this.frontBufferContext.fillRect(0, 0, this.width, this.height);
        this.backBufferContext.fillStyle = 'rgb(' + r * 255 + ',' + g * 255 + ',' + b * 255 + ')';
        this.backBufferContext.fillRect(0, 0, this.width, this.height);
        this.bufferState = 0;

        this.pixels = this.backBufferContext.getImageData(0, 0, this.width, this.height);
    }

    clearWindow(r, g, b) {
        this.rectangle(0, 0, this.width, this.height, [r, g, b], true);
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

    text(data) {
        function getPowerOfTwo(value) {
            let pow = 1;
            while (pow < value) {
                pow *= 2;
            }
            return pow;
        }

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let text = data.text;

        ctx.font = '16.6px Lucida Console';
        let textWidth = text.reduce((acc, curr) => { return Math.max(acc, curr.length); }, 0);
        let textHeight = 18 * text.length;

        canvas.width = getPowerOfTwo(textWidth * 10);
        canvas.height = getPowerOfTwo(textHeight);
        ctx.fillStyle = `rgb(${data.color})`;
        ctx.textBaseline = 'top';
        ctx.font = '16.6px Lucida Console';

        for (let i = 0; i < text.length; i++) {
            ctx.fillText(text[i], 0, 18 * i);
        }

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textTexture);
        // let texture = this.gl.createTexture();

        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        // this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        // this.gl.activeTexture(this.gl.TEXTURE0);
        // this.gl.uniform1i(this.textProgram.samplerUniform, 0);

        let x = data.x + 1;
        if (data.alignment[0] === 'c') x -= Math.ceil(textWidth / 2) * 10;
        if (data.alignment[0] === 'r') x -= ~~textWidth * 10;
        let y = data.y + 7;
        if (data.alignment[1] === 'c') y -= ~~(8 * text.length) + 11;
        if (data.alignment[1] === 'b') y -= ~~textHeight;

        let x1 = (x - 320) / 320;
        let y1 = (256 - y) / 256;
        let x2 = x1 + canvas.width / 320;
        let y2 = y1 - canvas.height / 256;

        this.useTextProgram(
            [x1, y1, x2, y1, x1, y2, x2, y2],
            [0, 1, 1, 1, 0, 0, 1, 0],
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    dot(x, y, color) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            const index = 4 * (this.width * y + x);
            this.pixels.data[index + 0] = color[0] * 255;
            this.pixels.data[index + 1] = color[1] * 255;
            this.pixels.data[index + 2] = color[2] * 255;
        }
    }

    // TODO
    line(x1, y1, x2, y2, color) {
        let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;

        dx = x2 - x1;
        dy = y2 - y1;

        dx1 = Math.abs(dx);
        dy1 = Math.abs(dy);

        px = 2 * dy1 - dx1;
        py = 2 * dx1 - dy1;

        if (dy1 <= dx1) {
            if (dx >= 0) {
                x = x1; y = y1; xe = x2 - 1;
            } else {
                x = x2; y = y2; xe = x1 - 1;
            }

            const index = 4 * (this.width * y + x);
            this.pixels.data[index + 0] = color[0] * 255;
            this.pixels.data[index + 1] = color[1] * 255;
            this.pixels.data[index + 2] = color[2] * 255;

            for (i = 0; x < xe; i++) {
                x = x + 1;

                if (px < 0) {
                    px = px + 2 * dy1;
                } else {
                    if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                        y = y + 1;
                    } else {
                        y = y - 1;
                    }
                    px = px + 2 * (dy1 - dx1);
                }

                const index = 4 * (this.width * y + x);
                this.pixels.data[index + 0] = color[0] * 255;
                this.pixels.data[index + 1] = color[1] * 255;
                this.pixels.data[index + 2] = color[2] * 255;
            }

        } else {
            if (dy >= 0) {
                x = x1; y = y1; ye = y2 - 1;
            } else {
                x = x2; y = y2; ye = y1 - 1;
            }

            const index = 4 * (this.width * y + x);
            this.pixels.data[index + 0] = color[0] * 255;
            this.pixels.data[index + 1] = color[1] * 255;
            this.pixels.data[index + 2] = color[2] * 255;

            for (i = 0; y < ye; i++) {
                y = y + 1;

                if (py <= 0) {
                    py = py + 2 * dx1;
                } else {
                    if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                        x = x + 1;
                    } else {
                        x = x - 1;
                    }
                    py = py + 2 * (dx1 - dy1);
                }

                const index = 4 * (this.width * y + x);
                this.pixels.data[index + 0] = color[0] * 255;
                this.pixels.data[index + 1] = color[1] * 255;
                this.pixels.data[index + 2] = color[2] * 255;
            }
        }
    }

    rectangle(x1, y1, x2, y2, color, fill) {
        if (fill) {
            const iStart = Math.max(Math.min(y1, y2), 0);
            const iEnd = Math.min(Math.max(y1, y2), this.height);
            const jStart = Math.max(Math.min(x1, x2), 0);
            const jEnd = Math.min(Math.max(x1, x2), this.width);
            const r = color[0]*255;
            const g = color[1]*255;
            const b = color[2]*255;

            for (let i = iStart; i < iEnd; i++) {
                let index = 4 * (this.width * i + jStart);
                for (let j = jStart; j < jEnd; j++) {
                    this.pixels.data[index + 0] = r;
                    this.pixels.data[index + 1] = g;
                    this.pixels.data[index + 2] = b;
                    index += 4;
                }
            }
        } else {
            if (x1 !== x2) {
                this.line(x1, y1, x2, y1, color);
                this.line(x1, y2, x2 - 1, y2, color);
            }
            if (y1 !== y2) {
                this.line(x1, y1, x1, y2, color);
                this.line(x2, y1, x2, y2 - 1, color);
            }
        }
    }

    triangle(data) {
        let x1 = (data.x1 - 320 + 0.5) / 320;
        let y1 = (256 - data.y1 - 0.5) / 256;
        let x2 = (data.x2 - 320 + 0.5) / 320;
        let y2 = (256 - data.y2 - 0.5) / 256;
        let x3 = (data.x3 - 320 + 0.5) / 320;
        let y3 = (256 - data.y3 - 0.5) / 256;

        this.useShapesProgram(
            [x1, y1, x2, y2, x3, y3],
            [...data.color, ...data.color, ...data.color],
        );

        this.gl.drawArrays(data.fill ? this.gl.TRIANGLE_STRIP : this.gl.LINE_LOOP, 0, 3);
    }

    gtriangle(data) {
        let x1 = (data.x1 - 320 + 0.5) / 320;
        let y1 = (256 - data.y1 - 0.5) / 256;
        let x2 = (data.x2 - 320 + 0.5) / 320;
        let y2 = (256 - data.y2 - 0.5) / 256;
        let x3 = (data.x3 - 320 + 0.5) / 320;
        let y3 = (256 - data.y3 - 0.5) / 256;

        this.useShapesProgram(
            [x1, y1, x2, y2, x3, y3],
            [...data.color1, ...data.color2, ...data.color3],
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3);
    }

    circle(data) {
        let coords = [];
        let colors = [];

        if (data.fill) {
            let xc = ~~(data.x - 320 + 0.5);
            let yc = ~~(256 - data.y - 0.5);
            let r = ~~(data.r);

            for (let y = - r; y < + r; y++) {
                let x = Math.sqrt(r * r - y * y);

                let px1 = (xc - x) / 320;
                let px2 = (xc + x) / 320;
                let py = (yc + y) / 256;
                coords = coords.concat([px1, py, px2, py]);
                colors = colors.concat([...data.color, ...data.color]);
            }
        } else {
            let xc = ~~(data.x - 320 + 0.5);
            let yc = ~~(256 - data.y - 0.5);
            let r = ~~(data.r);

            let x = 0, y = r;
            let d = 3 - 2 * r;
            drawCircle(xc, yc, x, y);
            while (y >= x) {
                x++;
                if (d >= 0) {
                    y--;
                    d = d + 4 * (x - y) + 10;
                } else {
                    d = d + 4 * x + 6;
                }
                drawCircle(xc, yc, x, y);
            }

            function drawCircle(xc, yc, x, y) {
                let xcpx = (xc + x) / 320;
                let xcmx = (xc - x) / 320;
                let xcpy = (xc + y) / 320;
                let xcmy = (xc - y) / 320;
                let ycpx = (yc + x) / 256;
                let ycmx = (yc - x) / 256;
                let ycpy = (yc + y) / 256;
                let ycmy = (yc - y) / 256;
                coords = coords.concat([xcpx, ycpy,
                    xcmx, ycpy,
                    xcpx, ycmy,
                    xcmx, ycmy,
                    xcpy, ycpx,
                    xcmy, ycpx,
                    xcpy, ycmx,
                    xcmy, ycmx,
                ]);

                colors = colors.concat([
                    ...data.color,
                    ...data.color,
                    ...data.color,
                    ...data.color,
                    ...data.color,
                    ...data.color,
                    ...data.color,
                    ...data.color,
                ]);
            }
        }

        this.useShapesProgram(coords, colors);

        this.gl.drawArrays(data.fill ? this.gl.LINES : this.gl.POINTS, 0, coords.length / 2);
    }

    /////////////
    // PRIVATE //
    /////////////

    createShapesProgram(gl) {
        let vertShader = gl.createShader(gl.VERTEX_SHADER);
        let vertCode = `
            attribute vec2 coords;
            attribute vec3 color;

            varying vec3 vColor;

            void main(void) {
                gl_Position = vec4(coords, 0.0, 1.0);
                gl_PointSize = 1.0;
                vColor = color;
            }`;
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);

        let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        let fragCode = `
            precision mediump float;

            varying vec3 vColor;
            
            void main(void) {
                gl_FragColor = vec4(vColor, 1.);
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

        return program;
    }

    createTextProgram(gl) {
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

        this.textTexture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textTexture);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        this.gl.uniform1i(program.sampler, 0);

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

    useShapesProgram(coords, colors) {
        this.useProgram(this.shapesProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shapesCoordsBuffer);
        this.gl.vertexAttribPointer(this.shapesProgram.coords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.shapesColorBuffer);
        this.gl.vertexAttribPointer(this.shapesProgram.color, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.DYNAMIC_DRAW);
    }

    useTextProgram(coords, texCoords) {
        this.useProgram(this.textProgram);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textCoordsBuffer);
        this.gl.vertexAttribPointer(this.textProgram.coords, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(coords), this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textTexCoordsBuffer);
        this.gl.vertexAttribPointer(this.textProgram.texCoords, 2, this.gl.FLOAT, false, 0, 0);
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
        this.backBufferContext.drawImage(this.frontBuffer, 0, 0);
        this.frontBufferContext.putImageData(this.pixels, 0, 0);
        this.pixels = this.backBufferContext.getImageData(0, 0, this.width, this.height);


        // this.tempBufferContext.drawImage(this.frontBufferContext.canvas, 0, 0);
        // this.frontBufferContext.drawImage(this.gl.canvas, 0, 0);

        // this.gl.activeTexture(this.gl.TEXTURE1);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.bufferSwapTexture);
        // this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.tempBufferContext.canvas);
        // // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

        // this.gl.uniform1i(this.bufferSwapProgram.samplerUniform, 1);

        // this.useBufferSwapProgram(
        //     [-1, 1, 1, 1, -1, -1, 1, -1],
        //     [0, 1, 1, 1, 0, 0, 1, 0],
        // );

        // this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
