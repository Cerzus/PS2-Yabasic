'use strict';

class AsciiTable {
    constructor() {
        this.asciiTable = new Array(256).fill(null);
        for (let i = 1; i < 256; i++) {
            this.asciiTable[i] = String.fromCharCode(i);
        }
        this.asciiTable[0] = '';
        this.asciiTable[160] = '`';
        this.asciiTable[161] = '\'';
        this.asciiTable[162] = 'º';
        this.asciiTable[165] = '¨';
        this.asciiTable[172] = '^';
        this.asciiTable[173] = '~';
        this.asciiTable[174] = '¸';

        this.textScreenCharacters = this.asciiTable.slice();
        var singleCharacters = [
            11, 12, 175, 177, 182,
            183, 222, 247, 254,
        ];
        for (let i = 0; i < 256; i++) {
            if (
                i <= 8 ||
                i >= 14 && i <= 31 ||
                i >= 127 && i <= 159 ||
                i >= 188 && i <= 191 ||
                singleCharacters.indexOf(i) >= 0
            ) {
                this.textScreenCharacters[i] = '';
            }
        }

        this.graphicsScreenCharacters = this.asciiTable.slice();
        var singleCharacters = [
            11, 12, 160, 161, 162,
            165, 172, 173, 175, 177,
            182, 183, 222, 247, 254,
        ];
        for (let i = 0; i < 256; i++) {
            if (
                i <= 8 ||
                i >= 14 && i <= 31 ||
                i >= 127 && i <= 159 ||
                i >= 188 && i <= 191 ||
                singleCharacters.indexOf(i) >= 0
            ) {
                this.graphicsScreenCharacters[i] = '\r'; // a character that will be converted to a space when used as text on a html canvas
            } else {
                this.graphicsScreenCharacters[i] = String.fromCharCode(i);
            }
        }

        this.lowerCaseOffsets = new Array(256).fill(0);
        var singleCharacters = [
            134, 144, 149, 151, 152,
            155, 163, 165, 166, 168,
            173, 175, 178, 179, 199,
            202, 203, 213, 214, 218,
            219, 223, 224, 226, 231,
            233, 236, 237, 242, 244,
            246,
        ];
        for (let i = 0; i < 256; i++) {
            if (
                i >= 65 && i <= 90 ||
                i >= 157 && i <= 160 ||
                i >= 183 && i <= 187 ||
                i >= 191 && i <= 195 ||
                i >= 207 && i <= 210 ||
                singleCharacters.indexOf(i) >= 0
            ) {
                this.lowerCaseOffsets[i] = 32 - (i + 32 < 256 ? 0 : 256);
            }
        }

        this.upperCaseOffsets = new Array(256).fill(0);
        var singleCharacters = [
            134, 149, 150, 152, 160,
            177, 178, 181, 183, 184,
            187, 191, 192, 195, 198,
            201, 202, 208, 209, 211,
            214, 215, 217, 219, 220,
            222, 228, 230, 235, 237,
            238, 243, 248,
        ];
        for (let i = 0; i < 256; i++) {
            if (
                i >= 97 && i <= 122 ||
                i >= 154 && i <= 156 ||
                i >= 162 && i <= 164 ||
                i >= 173 && i <= 175 ||
                singleCharacters.indexOf(i) >= 0
            ) {
                this.upperCaseOffsets[i] = -32;
            }
        }

        this.whitespaceCharacters = new Array(256).fill(false);
        var singleCharacters = [
            0, 32, 142, 143, 146,
            147, 150, 151, 153, 155,
            156, 159, 161, 163, 164,
            167, 170, 171, 174, 178,
            179, 181, 182, 187, 190,
            195, 198, 200, 202, 224,
            225, 228, 231, 232, 239,
            248,
        ];
        for (let i = 0; i < 256; i++) {
            if (
                i >= 9 && i <= 13 ||
                i >= 213 && i <= 215 ||
                i >= 241 && i <= 243 ||
                singleCharacters.indexOf(i) >= 0
            ) {
                this.whitespaceCharacters[i] = true;
            }
        }
    }

    encode(string) {
        let result = '';
        for (let character of string) {
            const index = this.asciiTable.indexOf(character);

            if (index > 0) {
                result += String.fromCharCode(index);
            }
        }
        return result;
    }

    toTextScreenString(string) {
        let result = ''
        for (let i = 0; i < string.length; i++) {
            result += this.textScreenCharacters[string.charCodeAt(i)];
        }
        return result;
    }

    toGraphicsScreenString(string) {
        let result = ''
        for (let i = 0; i < string.length; i++) {
            result += this.graphicsScreenCharacters[string.charCodeAt(i)];
        }
        return result;
    }

    toLowerCase(string) {
        let result = '';
        for (let i = 0; i < string.length; i++) {
            const index = string.charCodeAt(i);
            result += index ? String.fromCharCode(index + this.lowerCaseOffsets[index]) : '';
        }
        return result;
    }

    toUpperCase(string) {
        let result = '';
        for (let i = 0; i < string.length; i++) {
            const index = string.charCodeAt(i);
            result += index ? String.fromCharCode(index + this.upperCaseOffsets[index]) : '';
        }
        return result;
    }

    trimStart(string) {
        let index = 0;
        while (this.whitespaceCharacters[string.charCodeAt(index)]) {
            index++;
        }
        return string.substring(index);
    }

    trimEnd(string) {
        let index = string.length - 1;
        while (this.whitespaceCharacters[string.charCodeAt(index)]) {
            index--;
        }
        return string.substring(0, index + 1);
    }

    trim(string) {
        return this.trimEnd(this.trimStart(string));
    }
}
