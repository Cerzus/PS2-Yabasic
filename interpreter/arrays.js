'use strict';

///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

Interpreter.prototype.scopeArrayName = function (name) {
    if (this.localArrays.indexOf(name) >= 0) {
        return this.localScopeName(name);
    }

    if (this.staticArrays.indexOf(name) >= 0) {
        return this.staticScopeName(name);
    }

    return name;
};

Interpreter.prototype.getArrayIndex = function (arrayName, numDimensions) {
    // const name = arrayName.split('/').pop();
    const name = arrayName.substring(arrayName.indexOf('/') + 1);

    if (numDimensions === 0) {
        const expected = this.strings.get('Nothing');
        const found = name.endsWith('$') ? this.strings.get('AString') : this.strings.get('ANumber');
        this.throwFatalError('InternalErrorExpectedButFound', expected, found);
    }

    const array = this.arrays[arrayName];

    let dimensions = this.getArrayDimensions(numDimensions);

    if (array.dimensions === null || array.dimensions.length === 0) {
        this.throwError('ArrayParameterHasNotBeenSupplied', name);
    }

    if (numDimensions !== array.dimensions.length) {
        this.throwError('IndicesSuppliedExpectedFor', numDimensions, array.dimensions.length, name);
    }

    for (let i = 0; i < dimensions.length; i++) {
        const dimension = dimensions[i];
        if (dimension < 0 || dimension >= array.dimensions[i]) {
            this.throwError('IndexOutOfRange', i + 1, dimension);
        }
    }

    let index = 0;
    let factor = 1;
    for (let i = dimensions.length - 1; i >= 0; i--) {
        index += dimensions[i] * factor;
        factor *= array.dimensions[i];
    }

    return index;
};

Interpreter.prototype.getArrayDimensions = function (numDimensions) {
    let dimensions = new Array(numDimensions);
    for (let i = 0; i < numDimensions; i++) {
        const dimension = this.valuesStackPeek(numDimensions - 1 - i);
        if (dimension.type !== 'Number') {
            this.throwError('OnlyNumericalIndicesAllowedForArrays');
        }
        // ~~? 2.64: TODO, 2.66: TODO 
        dimensions[i] = ~~dimension.value;
    }
    this.valuesStackLength -= numDimensions;
    return dimensions;
};

//////////////////
// INSTRUCTIONS //
//////////////////

Interpreter.prototype.instructionSTORE_ARRAY_ELEMENT = function (name, numArguments) {
    const arrayName = this.scopeArrayName(name);

    if (!(arrayName in this.arrays)) {
        this.throwError('IsNeitherArrayNorSubroutine', name);
    }

    const value = this.popStringOrNumber();
    const index = this.getArrayIndex(arrayName, numArguments);

    this.arrays[arrayName].values[index] = value;
};

Interpreter.prototype.instructionSTORE_ARRAY = function (arrayName) {
    const value = this.popValue();
    const name = this.scopeArrayName(arrayName);

    if (!(name in this.arrays) || this.arrays[name].dimensions !== null) {
        this.arrays[name] = value;
    }

    if (!(arrayName in this.arrayReferenceParameters)/* && value.dimensions !== null*/) {
        this.arrayReferenceParameters[arrayName] = [value, value];
    } else if (arrayName in this.arrayReferenceParameters) {
        this.arrayReferenceParameters[arrayName][0] = value;
    }
};

Interpreter.prototype.instructionLOAD_ARRAY = function (name, type) {
    const arrayName = this.scopeArrayName(name);

    if (!(arrayName in this.arrays)) {
        this.throwError('ArrayNotDefined', name);
    }

    this.valuesStackPush({ value: this.arrays[arrayName], type });
};

Interpreter.prototype.instructionLOAD_ARRAY_ELEMENT = function (name, numArguments, isUsedAsArgument) {
    const arrayName = this.scopeArrayName(name);

    if (!(arrayName in this.arrays)) {
        this.throwError('IsNeitherArrayNorSubroutine', name);
    }

    if (numArguments === 0) {
        // if (isUsedAsArgument) {
        this.instructionLOAD_ARRAY(name, name.endsWith('$') ? 'StringArray' : 'NumericArray');
        // } else {
        // this.throwError(`expected a ${name.endsWith('$') ? 'string' : 'number'} but found a reference to a ${name.endsWith('$') ? 'string' : 'numeric'} array`);
        // }
    } else {
        const index = this.getArrayIndex(arrayName, numArguments); // keep on separate line

        if (name.endsWith('$')) {
            this.pushString(this.arrays[arrayName].values[index]);
        } else {
            this.pushNumber(this.arrays[arrayName].values[index]);
        }
    }
};

Interpreter.prototype.instructionLOAD_ARRAY_ELEMENT_PUSH_INDICES = function (name, numArguments) {
    for (let i = 0; i < numArguments; i++) {
        this.valuesStackPush({ ...this.valuesStackPeek(numArguments - 1) });
    }

    this.instructionLOAD_ARRAY_ELEMENT(name, numArguments);
};

Interpreter.prototype.instructionDIM = function (name, numDimensions) {
    if (name in this.subroutines) {
        this.throwError('ArrayConflictsWithUserSubroutine', name);
    }

    let dimensions = this.getArrayDimensions(numDimensions);

    dimensions = dimensions.map((dimension, i) => {
        dimension = (dimension + 1) % this.EXP2E31;

        if (dimension < 2) {
            this.throwError('ArrayIndexLessThanEqualToZero', i + 1);
        }

        return dimension;
    });

    if (numDimensions > 10) {
        this.throwError('ArrayHasMoreThan10Dimensions');
    }

    const defaultValue = name.endsWith('$') ? '' : 0;

    const arrayName = this.scopeArrayName(name);

    // if the array already exists, the number of dimensions must be the the same and the dimensions cannot shrink
    if (arrayName in this.arrays) {
        if (this.arrays[arrayName].dimensions === null || numDimensions !== this.arrays[arrayName].dimensions.length) {
            this.throwError('CannotChangeDimensionsOfFromTo', name, (this.arrays[arrayName].dimensions || []).length, numDimensions);
        }

        dimensions = dimensions.map((dimension, i) => Math.max(dimension, this.arrays[arrayName].dimensions[i]));
    }

    // multiply all dimensions together to get the total number of elements
    const numberOfElements = dimensions.length > 0 ? dimensions.reduce((acc, curr) => acc * curr) : 0;

    // TODO: check better
    if (numberOfElements > (arrayName.endsWith('$') ? 100000 : 1000000)) {
        this.throwFatalError('OutOfMemory');
    }

    // if the array already exsists, copy the old values and fill the rest with default values
    // make sure not to replace the values or dimensions arrays, so local and static array reference will stay linked
    if (arrayName in this.arrays && this.arrays[arrayName].dimensions !== null) {
        const array = this.arrays[arrayName];
        const oldValues = array.values.slice();
        const oldDimensions = array.dimensions.slice();

        for (let i = 0; i < numDimensions; i++) {
            array.dimensions[i] = dimensions[i];
        }

        array.values.length = numberOfElements;

        let oldIndex = 0;
        let newIndex = 0;

        (function arrayCopyAndFillWithDefault(n = 0) {
            const dimensionOld = oldDimensions[n];
            const dimension = dimensions[n];
            let i = 0;

            if (n === numDimensions - 1) {
                for (; i < dimensionOld; i++) {
                    array.values[newIndex++] = oldValues[oldIndex++];
                }
                for (; i < dimension; i++) {
                    array.values[newIndex++] = defaultValue;
                }
            }
            else {
                for (; i < dimensionOld; i++) {
                    arrayCopyAndFillWithDefault(n + 1);
                }
                for (; i < dimension; i++) {
                    arrayFillWithDefault(n + 1);
                }
            }

            function arrayFillWithDefault(n) {
                const dimension = dimensions[n];

                if (n === numDimensions - 1) {
                    for (let i = 0; i < dimension; i++) {
                        array.values[newIndex++] = defaultValue;
                    }
                } else {
                    for (let i = 0; i < dimension; i++) {
                        arrayFillWithDefault(n + 1);
                    }
                }
            }
        })();
    }
    // ...otherwise, completely fill the array with default values
    else {
        this.arrays[arrayName] = {
            dimensions,
            values: new Array(numberOfElements).fill(defaultValue),
        };
    }
};
