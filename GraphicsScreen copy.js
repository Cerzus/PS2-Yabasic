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

        this.textProgram = this.createTextProgram(this.gl);
        this.textCoordsBuffer = this.gl.createBuffer();
        this.textTexCoordsBuffer = this.gl.createBuffer();

        this.bufferSwapProgram = this.createBufferSwapProgram(this.gl);
        this.bufferSwapCoordsBuffer = this.gl.createBuffer();
        this.bufferSwapTexCoordsBuffer = this.gl.createBuffer();

        this.gl.viewport(0, 0, this.width, this.height);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.createFontBitmap();
    }

    // TODO: fix characters
    createFontBitmap() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        document.body.append(canvas);
        const context = canvas.getContext('2d');
        context.font = '16.6px Lucida Console';
        context.textBaseline = 'top';
        context.fillStyle = 'white';
        for (let i = 0; i < 16; i++) {
            if (i & 0x6) {
                for (let j = 0; j < 16; j++) {
                    context.fillText(String.fromCharCode(i * 16 + j), 10 * j, 16 * i);
                }
            }
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
    }

    update() {
        //
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

    text(text, x, y, color, alignment) {
        let textWidth = 0;
        for (let i = 0; i < text.length; i++) {
            textWidth = Math.max(textWidth, text[i].replace(/[^\S ]/g, '').length);
        }
        let textHeight = 18 * text.length;

        x = x + 1;
        if (alignment[0] === 'c') x -= Math.ceil(textWidth / 2) * 10;
        if (alignment[0] === 'r') x -= textWidth * 10;
        y = y + 7;
        if (alignment[1] === 'c') y -= Math.ceil(text.length / 2) * 18;
        if (alignment[1] === 'b') y -= text.length * 18;

        const x1 = (x - 320) / 320;
        const y1 = (256 - y) / 256;
        // const x2 = x1 + canvas.width / 320;
        // const y2 = y1 - canvas.height / 256;

        let pixelCoordinates = [];
        let textureCoordinates = [];

        let foo = 0;
        for (let i = 0; i < text.length; i++) {
            const line = text[i];
            for (let j = 0; j < line.length; j++) {
                const px1 = x1 + j * 10 / 320;
                const py1 = y1 - i * 18 / 256;
                const px2 = px1 + 10 / 320;
                const py2 = py1 - 18 / 256;
                pixelCoordinates=pixelCoordinates.concat([px1, py1, px2, py1, px1, py2, px2, py1, px1, py2, px2, py2]);
                textureCoordinates=textureCoordinates.concat([0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
                foo+=6;
            }
        }

        this.useTextProgram(
            pixelCoordinates,
            textureCoordinates,
        );

        this.gl.drawArrays(this.gl.TRIANGLES, 0, foo);
    }

    dot(x, y, color) {
        x = (x - 320 + 0.498) / 320;
        y = (256 - y - 0.498) / 256;

        this.useShapesProgram(
            [x, y],
            [...color],
        );

        this.gl.drawArrays(this.gl.POINTS, 0, 1);
    }

    line(x1, y1, x2, y2, color) {
        x1 = (x1 - 320 + 0.498) / 320;
        y1 = (256 - y1 - 0.498) / 256;
        x2 = (x2 - 320 + 0.498) / 320;
        y2 = (256 - y2 - 0.498) / 256;

        this.useShapesProgram(
            [x1, y1, x2, y2],
            [...color, ...color],
        );

        this.gl.drawArrays(this.gl.LINES, 0, 2);
    }

    rectangle(x1, y1, x2, y2, color, fill) {
        x1 = (x1 - 320 + 0.498) / 320;
        y1 = (256 - y1 - 0.498) / 256;
        x2 = (x2 - 320 + 0.498) / 320;
        y2 = (256 - y2 - 0.498) / 256;

        let coords = fill ?
            [x1, y1, x2, y1, x1, y2, x2, y2] :
            [x1, y1, x2, y1, x2, y2, x1, y2];

        this.useShapesProgram(
            coords,
            [...color, ...color, ...color, ...color],
        );

        this.gl.drawArrays(fill ? this.gl.TRIANGLE_STRIP : this.gl.LINE_LOOP, 0, 4);
    }

    triangle(x1, y1, x2, y2, x3, y3, color, fill) {
        x1 = (x1 - 320 + 0.498) / 320;
        y1 = (256 - y1 - 0.498) / 256;
        x2 = (x2 - 320 + 0.498) / 320;
        y2 = (256 - y2 - 0.498) / 256;
        x3 = (x3 - 320 + 0.498) / 320;
        y3 = (256 - y3 - 0.498) / 256;

        this.useShapesProgram(
            [x1, y1, x2, y2, x3, y3],
            [...color, ...color, ...color],
        );

        this.gl.drawArrays(fill ? this.gl.TRIANGLE_STRIP : this.gl.LINE_LOOP, 0, 3);
    }

    gtriangle(x1, y1, x2, y2, x3, y3, color1, color2, color3) {
        x1 = (x1 - 320 + 0.498) / 320;
        y1 = (256 - y1 - 0.498) / 256;
        x2 = (x2 - 320 + 0.498) / 320;
        y2 = (256 - y2 - 0.498) / 256;
        x3 = (x3 - 320 + 0.498) / 320;
        y3 = (256 - y3 - 0.498) / 256;

        this.useShapesProgram(
            [x1, y1, x2, y2, x3, y3],
            [...color1, ...color2, ...color3],
        );

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3);
    }

    circle(x, y, r, color, fill) {
        let coords = [];
        let colors = [];

        let xc = (x - 320 + 0.0);
        let yc = (256 - y - 0.0);
        r = r - 0.5;

        if (fill) {
            for (let y = - r; y < + r; y++) {
                let x = Math.sqrt(r * r - y * y);

                let px1 = (xc - x) / 320;
                let px2 = (xc + x) / 320;
                let py = (yc + y) / 256;
                coords = coords.concat([px1, py, px2, py]);
                colors = colors.concat([...color, ...color]);
            }
        } else {
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
                    ...color,
                    ...color,
                    ...color,
                    ...color,
                    ...color,
                    ...color,
                    ...color,
                    ...color,
                ]);
            }
        }

        this.useShapesProgram(coords, colors);

        this.gl.drawArrays(fill ? this.gl.LINES : this.gl.POINTS, 0, coords.length / 2);
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
