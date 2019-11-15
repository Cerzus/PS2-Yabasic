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
            return string.replace(/0+/, '');
        }

        return string;
    }

    toCString(number, format) {
        if (format[0] !== '%') return null;

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
            if (!/\d/.test(format[i])) return null;
        }
        zeroFlag |= format[i] === '0';
        let width = '';
        while (/\d/.test(format[i])) {
            width += format[i];
            i++
        }
        if (whitespaceFound && !width) return null;

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
            if (!/\d/.test(format[i])) return null;
            zeroFlag |= format[i] === '0';
            precisionCouldDetermineWidth = true;
        }
        let precision = '';
        while (/\d/.test(format[i])) {
            if (precision !== 0) precision += format[i];
            i++;
        }
        if (whitespaceFound && !precision) return null;

        // the format must contain at least either the width field or the precision field and may not contain a period without either
        if (!period && width && precision || !width && !precision) return null;

        // type field
        if (!/[eEfgG]/.test(format[i]) || i !== format.length - 1) return null;
        let type = format[i];

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

        const absoluteNumber = Math.abs(number);

        if (absoluteNumber === Number.POSITIVE_INFINITY) {
            var string = absoluteNumber.toString().replace(/inity$/, '');
        } else {
            const log10 = 1 + (absoluteNumber ? Math.floor(Math.log10(absoluteNumber)) : 0);

            if (type === 'e' || type === 'E') {
                var string = this.numberToExponential(absoluteNumber, precision, hashFlag, type === 'E');
            } else if (type === 'f') {
                var string = this.numberToFixed(absoluteNumber, precision, hashFlag, log10);
            } else if (type === 'g' || type === 'G') {
                if (log10 > -4 && log10 <= precision + 0 /* test ?11111 using "%.5g"*/) {
                    var string = this.numberToFixed(absoluteNumber, Math.max(1, precision) - log10, hashFlag, log10);

                    if (!hashFlag && string.indexOf('.') >= 0) {
                        string = string.replace(/\.?0*$/, '');
                    }
                } else {
                    var string = this.numberToExponential(absoluteNumber, Math.max(0, precision - 1), hashFlag, type === 'G');

                    if (!hashFlag && string.indexOf('.') >= 0) {
                        string = string.replace(/\.?0*e/, 'e');
                    }
                }
            }
        }

        // make sure the exponent has at least two digits
        string = string.replace(/([-+])(\d)$/, '$10$2');

        const prefix = number < 0 ? '-' : (plusFlag ? '+' : (spaceFlag ? ' ' : ''));

        if (minusFlag) {
            return (prefix + string).padEnd(width, ' ');
        }

        if (zeroFlag) {
            return prefix + string.padStart(width - prefix.length, 0);
        }

        return (prefix + string).padStart(width, ' ');
    }

    numberToExponential(number, precision, forcePeriod, useCapitalE) {
        let string = number.toExponential(Math.min(precision, 100));

        string = string.replace('e', '0'.repeat(Math.max(0, precision - 100)) + 'e');

        if (forcePeriod && string.indexOf('.') === -1) {
            string = string.replace('e', '.e');
        }

        if (useCapitalE) {
            return string.replace('e', 'E');
        }

        return string;
    }

    numberToFixed(number, precision, forcePeriod, log10) {
        if (number === 0) {
            let string = '0' + (precision || forcePeriod ? '.' : '');

            return string.padEnd(precision + (forcePeriod ? 2 : 1), 0);
        }

        if (precision >= 0 && log10 >= 1 && precision + log10 <= 100) {
            let string = number.toPrecision(precision + log10);

            return string + (forcePeriod && string.indexOf('.') === -1 ? '.' : '');
        }

        // custom toPrecision, because toPrecision can only handle from 1 to 100
        const significantDigits = Math.round(number * Math.pow(10, Math.min(precision + log10, 15) - log10)).toString().replace(/0*$/, '');
        const decimalPointIndex = Math.min(Math.max(0, log10), significantDigits.length);
        const integerPart = significantDigits.substring(0, decimalPointIndex).padEnd(log10, 0) || '0';
        let fractionalPart = significantDigits.substring(decimalPointIndex).padStart(significantDigits.length - log10, 0);

        fractionalPart = fractionalPart.padEnd(precision, 0);

        fractionalPart = (fractionalPart || forcePeriod ? '.' : '') + fractionalPart.substring(0, precision);

        return integerPart + fractionalPart;
    }
}
