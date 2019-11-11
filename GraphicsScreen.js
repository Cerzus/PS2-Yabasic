'use strict';

class GraphicsScreen {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        var canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        this.domElement = canvas;

        this.context = canvas.getContext('2d');

        this.buffers = [];
        for (let i = 0; i < 2; i++) {
            const imageData = this.context.createImageData(canvas.width, canvas.height);
            this.buffers.push({
                imageData,
                pixels8: new Uint8Array(imageData.data.buffer),
                pixels32: new Uint32Array(imageData.data.buffer),
            });
        }

        this.fontBitmap = this.createFontBitmap();

        // determine rgb to uint32 conversion based on endianness
        this.rgbToUint32 = (new Uint8Array(new Uint32Array([1]).buffer)[0]) ?
            function (r, g, b) {
                return 0xff000000 + (b << 16) + (g << 8) + r;
            } : function (r, g, b) {
                return (r << 24) + (g << 16) + (b << 8) + 0xff;
            };
    }

    rgbArrayToUint32(color) {
        return this.rgbToUint32(255 * color[0], 255 * color[1], 255 * color[2]);
    }

    getDomElement() {
        return this.domElement;
    }

    update() {
        if (this.isDirty) {
            this.context.putImageData(this.buffers[this.dispBuf].imageData, 0, 0);
            this.isDirty = this.drawBuf === this.dispBuf;
        }
    }

    reset(r, g, b) {
        for (let i = 0; i < 2; i++) {
            this.buffers[i].pixels32.fill(this.rgbToUint32(r, g, b));
        }

        this.drawBuf = 0;
        this.dispBuf = 0;

        this.pixels8 = this.buffers[this.drawBuf].pixels8;
        this.pixels32 = this.buffers[this.drawBuf].pixels32;

        this.isDirty = true;
    }

    clearWindow(r, g, b) {
        this.rectangle(0, 0, this.width, this.height, [r, g, b], true);
    }

    setDrawBuf(buffer) {
        if (buffer !== this.drawBuf) {
            this.drawBuf = buffer;

            this.pixels8 = this.buffers[this.drawBuf].pixels8;
            this.pixels32 = this.buffers[this.drawBuf].pixels32;

            if (buffer === this.dispBuf) {
                this.isDirty = true;
            }
        }
    }

    setDispBuf(buffer) {
        if (buffer !== this.dispBuf) {
            this.dispBuf = buffer;

            if (buffer === this.drawBuf) {
                this.isDirty = true;
            }
        }
    }

    rectangle(x1, y1, x2, y2, color, fill) {
        const color32 = this.rgbArrayToUint32(color);

        if (fill) {
            const iStart = Math.max(Math.min(y1, y2), 0);
            const iEnd = Math.min(Math.max(y1, y2), this.height);
            const jStart = Math.max(Math.min(x1, x2), 0);
            const jEnd = Math.min(Math.max(x1, x2), this.width);

            for (let i = iStart; i < iEnd; i++) {
                let index = this.width * i + jStart;
                for (let j = jStart; j < jEnd; j++) {
                    this.pixels32[index++] = color32;
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

    createFontBitmap() {
        const fontCanvas = document.createElement('canvas');
        fontCanvas.width = 2560;
        fontCanvas.height = 16;
        // this.document.body.append(fontCanvas);
        const fontContext = fontCanvas.getContext('2d');
        fontContext.font = '16.6px Lucida Console';
        fontContext.textBaseline = 'top';
        fontContext.fillStyle = 'white';
        for (let i = 0; i < 256; i++) {
            if (i & 0x60) {
                fontContext.fillText(String.fromCharCode(i), 10 * i, 0);
            }
        }
        const data = fontContext.getImageData(0, 0, fontCanvas.width, fontCanvas.height).data
        const bitmap = [];
        for (let i = 0; i < data.length / 4; i++) {
            bitmap[i] = data[i * 4 + 3] / 255;
        }
        return bitmap;
    }

    dot(x, y, color) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            this.pixels32[this.width * y + x] = this.rgbArrayToUint32(color);
        }
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

        const r = color[0] * 255;
        const g = color[1] * 255;
        const b = color[2] * 255;

        const firstCompleteLineIndex = Math.max(0, Math.ceil(-y / 18));
        const lastCompleteLineIndex = Math.min(text.length, text.length - Math.ceil(y + 18 * text.length - this.height - 2 /* subtract 2 because characters are only 16 pixels high */) / 18) - 1;
        const firstCompleteCharacterIndex = Math.max(0, Math.ceil(-x / 10));

        // TODO: add incomplete line
        for (let i = firstCompleteLineIndex; i <= lastCompleteLineIndex; i++) {
            const line = text[i];
            const lastCompleteCharacterIndex = Math.min(line.length, line.length - Math.ceil(x + 10 * line.length - this.width) / 10) - 1;
            // TODO: add incomplete character
            for (let j = firstCompleteCharacterIndex; j <= lastCompleteCharacterIndex; j++) {
                drawCompleteCharacter.bind(this)(line.charCodeAt(j), x + 10 * j, y + 18 * i);
            }
            // TODO: add incomplete character
        }
        // TODO: add incomplete line

        function drawCompleteCharacter(ascii, x, y) {
            const sourceIndex = (10 * ascii);
            const destinationIndex = 4 * (this.width * y + x);

            for (let pixelY = 0; pixelY < 16; pixelY++) {
                let sIndex = sourceIndex + (2560 * pixelY);
                let dIndex = destinationIndex + 4 * (this.width * pixelY);
                for (let pixelX = 0; pixelX < 10; pixelX++) {
                    const alpha = this.fontBitmap[sIndex++];
                    this.pixels8[dIndex + 0] = (1 - alpha) * this.pixels8[dIndex + 0] + alpha * r;
                    this.pixels8[dIndex + 1] = (1 - alpha) * this.pixels8[dIndex + 1] + alpha * g;
                    this.pixels8[dIndex + 2] = (1 - alpha) * this.pixels8[dIndex + 2] + alpha * b;
                    dIndex += 4;
                }
            }
        }
    }

    // TODO: add bounding
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

            const index = (this.width * y + x);
            this.pixels32[index] = this.rgbArrayToUint32(color);

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

                const index = (this.width * y + x);
                this.pixels32[index] = this.rgbArrayToUint32(color);
            }

        } else {
            if (dy >= 0) {
                x = x1; y = y1; ye = y2 - 1;
            } else {
                x = x2; y = y2; ye = y1 - 1;
            }

            const index = (this.width * y + x);
            this.pixels32[index] = this.rgbArrayToUint32(color);

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

                const index = (this.width * y + x);
                this.pixels32[index] = this.rgbArrayToUint32(color);
            }
        }
    }

    triangle(x1,y1,x2,y2,x3,y3,color) {
this.gtriangle(x1,y1,x2,y2,x3,y3,color,color,color);
    }

    gtriangle(x1, y1, x2, y2, x3, y3, color1, color2, color3) {
        var v1 = { x: x1, y: y1, r: 255 * color1[0], g: 255 * color1[1], b: 255 * color1[2] };
        var v2 = { x: x2, y: y2, r: 255 * color2[0], g: 255 * color2[1], b: 255 * color2[2] };
        var v3 = { x: x3, y: y3, r: 255 * color3[0], g: 255 * color3[1], b: 255 * color3[2] };

        if (v1.y > v2.y) {
            let temp = v1; v1 = v2; v2 = temp;
        }
        if (v2.y > v3.y) {
            let temp = v2; v2 = v3; v3 = temp;
        }
        if (v1.y > v2.y) {
            let temp = v1; v1 = v2; v2 = temp;
        }

        if (v2.y === v3.y) {
            if (v2.x > v3.x) {
                let temp = v2; v2 = v3; v3 = temp;
            }
            this.fillBottomFlatTriangle(v1, v2, v3);
        } else if (v1.y === v2.y) {
            if (v1.x > v2.x) {
                let temp = v1; v1 = v2; v2 = temp;
            }
            this.fillTopFlatTriangle(v1, v2, v3);
        } else {
            const foo = (v2.y - v1.y) / (v3.y - v1.y);
            let v4 = {
                x: v1.x + (v3.x - v1.x) * foo,
                y: v2.y,
                r: v1.r + (v3.r - v1.r) * foo,
                g: v1.g + (v3.g - v1.g) * foo,
                b: v1.b + (v3.b - v1.b) * foo,
            };
            if (v2.x > v4.x) {
                let temp = v2; v2 = v4; v4 = temp;
            }
            this.fillBottomFlatTriangle(v1, v2, v4);
            this.fillTopFlatTriangle(v2, v4, v3);
        }

    }

    fillBottomFlatTriangle(v1, v2, v3) {
        const yTop = v1.y;
        const yBottom = v3.y;

        const x1 = v1.x;
        const x2 = v2.x;
        const x3 = v3.x;

        const r1 = v1.r;
        const g1 = v1.g;
        const b1 = v1.b;

        const r2 = v2.r;
        const g2 = v2.g;
        const b2 = v2.b;

        const r3 = v3.r;
        const g3 = v3.g;
        const b3 = v3.b;

        const oneOverHeight = 1 / (yBottom - yTop);
        const slopeLeft = (x2 - x1) * oneOverHeight;
        const slopeRight = (x3 - x1) * oneOverHeight;
        const rLeftInc = (r2 - r1) * oneOverHeight;
        const gLeftInc = (g2 - g1) * oneOverHeight;
        const bLeftInc = (b2 - b1) * oneOverHeight;

        const oneOverWidth = 1 / (x3 - x2);
        const rInc = (r3 - r2) * oneOverWidth;
        const gInc = (g3 - g2) * oneOverWidth;
        const bInc = (b3 - b2) * oneOverWidth;

        let iStart = ~~Math.max(0, yTop);
        let iEnd = ~~Math.min(yBottom, this.height);

        const foo = iStart - yTop;
        let xLeft = x1 + slopeLeft * foo;
        let xRight = x1 + slopeRight * foo;
        let rLeft = r1 + rLeftInc * foo;
        let gLeft = g1 + gLeftInc * foo;
        let bLeft = b1 + bLeftInc * foo;

        for (let i = iStart; i < iEnd; i++) {
            let jStart = ~~Math.max(0, xLeft);
            let jEnd = ~~Math.min(xRight, this.width);

            const foo = (jStart - xLeft);
            let index = (this.width * i + jStart);
            let r = rLeft + rInc * foo;
            let g = gLeft + gInc * foo;
            let b = bLeft + bInc * foo;

            for (let j = jStart; j < jEnd; j++) {
                this.pixels32[index++] = this.rgbToUint32(r, g, b);
                r += rInc;
                g += gInc;
                b += bInc;
            }

            xLeft += slopeLeft;
            xRight += slopeRight;
            rLeft += rLeftInc;
            gLeft += gLeftInc;
            bLeft += bLeftInc;
        }
    }

    fillTopFlatTriangle(v1, v2, v3) {
        const yTop = v1.y;
        const yBottom = v3.y;

        const x1 = v1.x;
        const x2 = v2.x;
        const x3 = v3.x;

        const r1 = v1.r;
        const g1 = v1.g;
        const b1 = v1.b;

        const r2 = v2.r;
        const g2 = v2.g;
        const b2 = v2.b;

        const r3 = v3.r;
        const g3 = v3.g;
        const b3 = v3.b;

        const oneOverHeight = 1 / (yBottom - yTop);
        const slopeLeft = (x3 - x1) * oneOverHeight;
        const slopeRight = (x3 - x2) * oneOverHeight;
        const rLeftInc = (r3 - r1) * oneOverHeight;
        const gLeftInc = (g3 - g1) * oneOverHeight;
        const bLeftInc = (b3 - b1) * oneOverHeight;

        const oneOverWidth = 1 / (x2 - x1);
        const rInc = (r2 - r1) * oneOverWidth;
        const gInc = (g2 - g1) * oneOverWidth;
        const bInc = (b2 - b1) * oneOverWidth;

        let iStart = ~~Math.max(0, yTop);
        let iEnd = ~~Math.min(yBottom, this.height);

        const foo = iStart - yTop;
        let xLeft = x1 + slopeLeft * foo;
        let xRight = x2 + slopeRight * foo;
        let rLeft = r1 + rLeftInc * foo;
        let gLeft = g1 + gLeftInc * foo;
        let bLeft = b1 + bLeftInc * foo;

        for (let i = iStart; i < iEnd; i++) {
            let jStart = ~~Math.max(0, xLeft);
            let jEnd = ~~Math.min(xRight, this.width);

            const foo = (jStart - xLeft);
            let index = (this.width * i + jStart);
            let r = rLeft + rInc * foo;
            let g = gLeft + gInc * foo;
            let b = bLeft + bInc * foo;

            for (let j = jStart; j < jEnd; j++) {
                this.pixels32[index++] = this.rgbToUint32(r, g, b);
                r += rInc;
                g += gInc;
                b += bInc;
            }

            xLeft += slopeLeft;
            xRight += slopeRight;
            rLeft += rLeftInc;
            gLeft += gLeftInc;
            bLeft += bLeftInc;
        }
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

    }
}
