'use strict';

class Formatter {
    constructor() {
        this.EXP2E31 = Math.pow(2, 31);
    }

    toString(number, format) {
        const match = format.match(/^#*\.?#*/);
        const pattern = match[0];

        if (pattern === '' && match.input !== '') {
            return this.toCString(number, format);
        }

        return this.toBASICString(number, pattern);
    }

    toBASICString(number, format) {
        const value = Math.min(Math.max(1 - this.EXP2E31, number), this.EXP2E31 - 1);

        const numDecimals = format.length - ((format.indexOf('.') + 1) || format.length);
        const numDecimalsForToFixed = Math.min(numDecimals, 100);
        let string = value.toFixed(numDecimalsForToFixed);
        string += '0'.repeat(numDecimals - numDecimalsForToFixed);

        string = string.replace(/(^|-)0/, '$1');

        if (format.indexOf('.') >= 0 && string.indexOf('.') < 0) {
            string = string + '.';
        }

        if (string.length > format.length) {
            return '*'.repeat(format.length);
        }

        string = string.padStart(format.length, ' ');

        if (Math.abs(value) === this.EXP2E31 - 1) {
            string = string.replace(/0+/, '');
        }

        return string;
    }

    toCString(number, format) {
        if (format[0] !== '%') error();

        let i = 1;

        // flags field
        let minusFlag = false;
        let plusFlag = false;
        let spaceFlag = false;
        let zeroFlag = false;
        let hashFlag = false;
        while (true) {
            const character = format[i];
            if (character === '-') {
                if (minusFlag) break;
                minusFlag = true;
            } else if (character === '+') {
                if (plusFlag) break;
                plusFlag = true;
            } else if (character === ' ') {
                if (spaceFlag) break;
                spaceFlag = true;
            } else if (character === '0') {
                if (zeroFlag) break;
                zeroFlag = true;
            } else if (character === '#') {
                if (hashFlag) break;
                hashFlag = true;
            } else {
                break;
            }
            i++;
        }

        let whitespaceFound;

        // width field
        whitespaceFound = false;
        while (/\s/.test(format[i])) {
            whitespaceFound = true;
            i++;
        }
        if (/[-+]/.test(format[i])) {
            minusFlag |= format[i] === '-';
            plusFlag |= format[i] === '+';
            i++;
            if (!/\d/.test(format[i])) error();
        }
        zeroFlag |= format[i] === '0';
        let width = '';
        while (/\d/.test(format[i])) {
            width += format[i];
            i++
        }
        if (whitespaceFound && !width) error();

        // period
        let period = false;
        if (format[i] === '.') {
            period = true;
            i++;
        }

        // precision field
        whitespaceFound = false;
        while (/\s/.test(format[i])) {
            whitespaceFound = true;
            i++;
        }
        let precisionCouldDetermineWidth = false;
        if (/[-+]/.test(format[i])) {
            minusFlag |= format[i] === '-';
            plusFlag |= format[i] === '+';
            i++;
            if (!/\d/.test(format[i])) error();
            zeroFlag |= format[i] === '0';
            precisionCouldDetermineWidth = true;
        }
        let precision = '';
        while (/\d/.test(format[i])) {
            if (precision !== 0) precision += format[i];
            i++;
        }
        if (whitespaceFound && !precision) error();

        // the format must contain at least either the width field or the precision field and may not contain a period without either
        if (!period && width && precision || !width && !precision) error();

        // type field
        if (!/[eEfgG]/.test(format[i]) || i !== format.length - 1) error();
        let type = format[i];

        function error() {
            throw `'${format}' is not a valid format`;
        }

        // if there are any other whitespace characters than spaces in the format string, for some reason
        // we want the part of the format string from the first occurance of such a character till the end
        const match = format.match(/[^ \S]/);
        if (match) {
            return format.substring(match.index);
        }

        if (precisionCouldDetermineWidth && parseInt(precision) > 0) {
            width = parseInt(precision);
            precision = 0;
        } else {
            width = width ? parseInt(width) : 0;
            precision = precision ? parseInt(precision) : (period ? 0 : 6);
        }

        let string;

        const absoluteNumber = Math.abs(number);

        if (absoluteNumber === Number.POSITIVE_INFINITY) {
            string = absoluteNumber.toString().replace(/inity$/, '');
        }
        else {
            const log10 = 1 + (absoluteNumber ? Math.floor(Math.log10(absoluteNumber)) : 0);

            if (type === 'e' || type === 'E') {
                numberToExponential(precision, type === 'E');
            } else if (type === 'f') {
                numberToFixed(precision);
            } else if (type === 'g' || type === 'G') {
                if (precision >= log10 - 0 /* test 11111 using "%.5g"*/ && log10 > -4) {
                    numberToFixed(Math.max(precision - log10, 1 - log10));
                    if (!hashFlag && string.indexOf('.') >= 0) {
                        string = string.replace(/\.?0*$/, '');
                    }
                } else {
                    numberToExponential(Math.max(0, precision - 1), type === 'G');
                    if (!hashFlag && string.indexOf('.') >= 0) {
                        string = string.replace(/\.?0*e/, 'e');
                    }
                }

            }

            function numberToExponential(precision, useCapitalE) {
                string = absoluteNumber.toExponential(Math.min(precision, 100));

                string = string.replace('e', '0'.repeat(Math.max(0, precision - 100)) + 'e');

                if (hashFlag && string.indexOf('.') === -1) {
                    string = string.replace('e', '.e');
                }

                if (useCapitalE) {
                    string = string.replace('e', 'E');
                }
            }

            function numberToFixed(precision) {
                if (absoluteNumber === 0) {
                    string = '0';
                    string += precision || hashFlag ? '.' : '';
                    string = string.padEnd(precision + (hashFlag ? 2 : 1), 0);
                } else if (precision >= 0 && log10 >= 1 && precision + log10 <= 100) {
                    string = absoluteNumber.toPrecision(precision + log10);

                    string += hashFlag && string.indexOf('.') === -1 ? '.' : '';
                }
                // custom toPrecision, because toPrecision can only handle from 1 to 100
                else {
                    const significantDigits = Math.round(absoluteNumber * Math.pow(10, Math.min(precision + log10, 15) - log10)).toString().replace(/0*$/, '');
                    const decimalPointIndex = Math.min(Math.max(0, log10), significantDigits.length);
                    const integerPart = significantDigits.substring(0, decimalPointIndex).padEnd(log10, 0) || '0';
                    let fractionalPart = significantDigits.substring(decimalPointIndex).padStart(significantDigits.length - log10, 0);

                    fractionalPart = fractionalPart.padEnd(precision, 0);

                    fractionalPart = (fractionalPart || hashFlag ? '.' : '') + fractionalPart.substring(0, precision);

                    string = integerPart + fractionalPart;
                }
            }
        }

        // make sure the exponent has at least two digits
        string = string.replace(/([-+])(\d)$/, '$10$2');

        const prefix = number < 0 ? '-' : (plusFlag ? '+' : (spaceFlag ? ' ' : ''));
        if (minusFlag) {
            string = (prefix + string).padEnd(width, ' ');
        } else if (zeroFlag) {
            string = prefix + string.padStart(width - prefix.length, 0);
        } else {
            string = (prefix + string).padStart(width, ' ');
        }

        return string;
    }
}