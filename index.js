'use strict';

window.onload = function () {
    const grammarFile = 'data/yabasic.js';
    const programFile = 'programs/ball.yab';

    const interpreter = new Interpreter();
    document.body.appendChild(interpreter.getDomElement());

    interpreter.build(grammarFile, () => {
        (async () => {
            editor.setValue(await (await fetch(programFile)).text());
            doLayout();
            editor.refresh();
            editor.focus();
        })();
    });

    let parseTimer = null;
    let oldInput = null;
    const editor = CodeMirror.fromTextArea(document.getElementById('program'), {
        lineNumbers: true,
        mode: null,
    });
    editor.on('change', scheduleParse);

    function buildSizeAndTimeInfoHtml(title, size, time) {
        return $('<span/>', {
            class: 'size-and-time',
            title: title,
            html: (size / 1024).toPrecision(2) + '&nbsp;kB, '
                + time + '&nbsp;ms, '
                + ((size / 1024) / (time / 1000)).toPrecision(2) + '&nbsp;kB/s'
        });
    }

    function buildErrorMessage(e) {
        return e.location !== undefined
            ? 'Line ' + e.location.start.line + ', column ' + e.location.start.column + ': ' + e.message
            : e.message;
    }

    function parse() {
        oldInput = getInput();

        $('#parseMessage').attr('class', 'message progress').text('Parsing the input...');
        $('#output').addClass('disabled').text('Output not available.');

        try {
            var timeBefore = (new Date).getTime();

            interpreter.start(getInput(), ast => {
                var timeAfter = (new Date).getTime();

                $('#parseMessage')
                    .attr('class', 'message info')
                    .text('Input parsed successfully.')
                    .append(buildSizeAndTimeInfoHtml(
                        'Parsing time and speed',
                        getInput().length,
                        timeAfter - timeBefore
                    ));
                $('#output').removeClass('disabled').text(jsDump.parse(ast));
            });

            var result = true;
        } catch (e) {
            if (e.constructor === Parser.prototype.parser.SyntaxError) {
                $('#parseMessage').attr('class', 'message error').text(buildErrorMessage(e));

                var result = false;
            } else {
                throw (e);
            }
        }

        doLayout();

        return result;
    }

    function scheduleParse() {
        if (getInput() === oldInput) { return; }

        if (parseTimer !== null) {
            clearTimeout(parseTimer);
            parseTimer = null;
        }

        parseTimer = setTimeout(function () {
            parse();
            parseTimer = null;
        }, 10);
    }

    function doLayout() {
        document.getElementsByClassName('CodeMirror')[0].style.height = '512px';
    }

    function getInput() {
        return editor.getValue();
    }
};
