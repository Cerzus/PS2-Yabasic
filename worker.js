'use strict';

importScripts(
    'plugins/peg.js',

    'AsciiTable.js',

    'parser/Parser.js',
    'parser/core.js',
    'parser/expressions.js',
    'parser/stringFunctions.js',
    'parser/numericFunctions.js',
    'parser/booleanFunctions.js',
    'parser/controlFlow.js',
    'parser/io.js',
    'parser/streamIo.js',
    'parser/graphics.js',
);

this.parser = new Parser();

onmessage = e => {
    switch (e.data.type) {
        case 'grammarFile':
            (async () => {
                Parser.prototype.parser = peg.generate(await (await fetch(e.data.file)).text());
                postMessage({
                    type: 'parserGenerated',
                });
            })();
            break;
        case 'source':
            try {
                postMessage({
                    type: 'parsingDone',
                    compiledSource: this.parser.compile(e.data.version, e.data.source, e.data.compilingAtRuntime, onAbstractSyntaxTreeCreated),
                });
            } catch (error) {
                if (error instanceof Parser.prototype.parser.SyntaxError) {
                    postMessage({
                        type: 'errorFound',
                        error,
                    });
                } else {
                    throw (error);
                }
            }
            break;
    }
};

function onAbstractSyntaxTreeCreated(abstractSyntaxTree) {
    postMessage({
        type: 'abstractSyntaxTreeCreated',
        abstractSyntaxTree,
    });
}
