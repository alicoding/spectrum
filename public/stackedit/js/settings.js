define([
    "underscore",
    "config"
], function(_) {

    var settings = {
        layoutOrientation: "horizontal",
        lazyRendering: true,
        editorFontFamily: "Courier New, Courier, monospace",
        editorFontSize: 14,
        defaultContent: "\n\n\n> Written with [StackEdit](" + MAIN_URL + ").",
        commitMsg: "Published with " + MAIN_URL,
        template: [
            '<!DOCTYPE html>\n',
            '<html>\n',
            '<head>\n',
            '<meta charset="utf-8">\n',
            '<title><%= documentTitle %></title>\n',
            '<link rel="stylesheet" href="',
            MAIN_URL,
            'css/main-min.css" />\n',
            '<script type="text/javascript" src="',
            MAIN_URL,
            'lib/MathJax/MathJax.js?config=TeX-AMS_HTML"></script>\n',
            '</head>\n',
            '<body><%= documentHTML %></body>\n',
            '</html>'
        ].join(""),
        sshProxy: SSH_PROXY_URL,
        extensionSettings: {}
    };

    try {
        _.extend(settings, JSON.parse(localStorage.settings));
    }
    catch(e) {
        // Ignore parsing error
    }

    return settings;
});