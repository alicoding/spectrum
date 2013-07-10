define([
    "jquery",
    "underscore",
    "utils",
    "settings",
    "extensionMgr",
    "mousetrap",
    "text!html/settingsTemplateTooltip.html",
    "text!html/settingsUserCustomExtensionTooltip.html",
    "storage",
    "config",
    "libs/bootstrap",
    "libs/layout",
    "libs/Markdown.Editor"
], function($, _, utils, settings, extensionMgr, mousetrap, settingsTemplateTooltipHTML, settingsUserCustomExtensionTooltipHTML) {

    var core = {};

    // Used for periodic tasks
    var intervalId = undefined;
    var periodicCallbacks = [
        extensionMgr.onPeriodicRun
    ];
    core.runPeriodically = function(callback) {
        periodicCallbacks.push(callback);
    };

    // Used to detect user activity
    var userReal = false;
    var userActive = false;
    var windowUnique = true;
    var userLastActivity = 0;
    function setUserActive() {
        userReal = true;
        userActive = true;
        userLastActivity = utils.currentTime;
    }

    function isUserActive() {
        if(userActive === true && utils.currentTime - userLastActivity > USER_IDLE_THRESHOLD) {
            userActive = false;
        }
        return userActive && windowUnique;
    }

    // Used to only have 1 window of the application in the same browser
    var windowId = undefined;
    function checkWindowUnique() {
        if(userReal === false || windowUnique === false) {
            return;
        }
        if(windowId === undefined) {
            windowId = utils.randomString();
            localStorage["frontWindowId"] = windowId;
        }
        var frontWindowId = localStorage["frontWindowId"];
        if(frontWindowId != windowId) {
            windowUnique = false;
            if(intervalId !== undefined) {
                clearInterval(intervalId);
            }
            $(".modal").modal("hide");
            $('#modal-non-unique').modal({
                backdrop: "static",
                keyboard: false
            });
        }
    }

    // Offline management
    core.isOffline = false;
    var offlineTime = utils.currentTime;
    core.setOffline = function() {
        offlineTime = utils.currentTime;
        if(core.isOffline === false) {
            core.isOffline = true;
            extensionMgr.onOfflineChanged(true);
        }
    };
    function setOnline() {
        if(core.isOffline === true) {
            core.isOffline = false;
            extensionMgr.onOfflineChanged(false);
        }
    }
    function checkOnline() {
        // Try to reconnect if we are offline but we have some network
        if(core.isOffline === true && navigator.onLine === true && offlineTime + CHECK_ONLINE_PERIOD < utils.currentTime) {
            offlineTime = utils.currentTime;
            // Try to download anything to test the connection
            $.ajax({
                url: "//www.google.com/jsapi",
                timeout: AJAX_TIMEOUT,
                dataType: "script"
            }).done(function() {
                setOnline();
            });
        }
    }

    // Load settings in settings dialog
    function loadSettings() {

        // Layout orientation
        utils.setInputRadio("radio-layout-orientation", settings.layoutOrientation);
        // Theme
        utils.setInputValue("#input-settings-theme", localStorage.theme);
        // Lazy rendering
        utils.setInputChecked("#input-settings-lazy-rendering", settings.lazyRendering);
        // Editor font family
        utils.setInputValue("#input-settings-editor-font-family", settings.editorFontFamily);
        // Editor font size
        utils.setInputValue("#input-settings-editor-font-size", settings.editorFontSize);
        // Default content
        utils.setInputValue("#textarea-settings-default-content", settings.defaultContent);
        // Commit message
        utils.setInputValue("#input-settings-publish-commit-msg", settings.commitMsg);
        // Template
        utils.setInputValue("#textarea-settings-publish-template", settings.template);
        // SSH proxy
        utils.setInputValue("#input-settings-ssh-proxy", settings.sshProxy);

        // Load extension settings
        extensionMgr.onLoadSettings();
    }

    // Save settings from settings dialog
    function saveSettings(event) {
        var newSettings = {};

        // Layout orientation
        newSettings.layoutOrientation = utils.getInputRadio("radio-layout-orientation");
        // Theme
        var theme = utils.getInputValue("#input-settings-theme");
        // Lazy Rendering
        newSettings.lazyRendering = utils.getInputChecked("#input-settings-lazy-rendering");
        // Editor font family
        newSettings.editorFontFamily = utils.getInputTextValue("#input-settings-editor-font-family", event);
        // Editor font size
        newSettings.editorFontSize = utils.getInputIntValue("#input-settings-editor-font-size", event, 1, 99);
        // Default content
        newSettings.defaultContent = utils.getInputValue("#textarea-settings-default-content");
        // Commit message
        newSettings.commitMsg = utils.getInputTextValue("#input-settings-publish-commit-msg", event);
        // Template
        newSettings.template = utils.getInputTextValue("#textarea-settings-publish-template", event);
        // SSH proxy
        newSettings.sshProxy = utils.checkUrl(utils.getInputTextValue("#input-settings-ssh-proxy", event), true);

        // Save extension settings
        newSettings.extensionSettings = {};
        extensionMgr.onSaveSettings(newSettings.extensionSettings, event);

        if(!event.isPropagationStopped()) {
            $.extend(settings, newSettings);
            localStorage.settings = JSON.stringify(settings);
            localStorage.theme = theme;
        }
    }

    // Create the layout
    var layout = undefined;
    function createLayout() {
        if(viewerMode === true) {
            return;
        }
        var layoutGlobalConfig = {
            closable: true,
            resizable: false,
            slidable: false,
            livePaneResizing: true,
            enableCursorHotkey: false,
            spacing_open: 15,
            spacing_closed: 15,
            togglerLength_open: 90,
            togglerLength_closed: 90,
            stateManagement__enabled: false,
            center__minWidth: 200,
            center__minHeight: 200
        };
        extensionMgr.onLayoutConfigure(layoutGlobalConfig);
        if(settings.layoutOrientation == "horizontal") {
            $(".ui-layout-south").remove();
            $(".preview-container").html('<div id="extension-preview-buttons"></div><div id="wmd-preview"></div>');
            layout = $('body').layout($.extend(layoutGlobalConfig, {
                east__resizable: true,
                east__size: .5,
                east__minSize: 200
            }));
        }
        else if(settings.layoutOrientation == "vertical") {
            $(".ui-layout-east").remove();
            $(".preview-container").html('<div id="extension-preview-buttons"></div><div id="wmd-preview"></div>');
            layout = $('body').layout($.extend(layoutGlobalConfig, {
                south__resizable: true,
                south__size: .5,
                south__minSize: 200
            }));
        }
        $("#navbar").click(function() {
            layout.allowOverflow('north');
        });
        $(".ui-layout-toggler-north").addClass("btn").append($("<b>").addClass("caret"));
        $(".ui-layout-toggler-south").addClass("btn").append($("<b>").addClass("caret"));
        $(".ui-layout-toggler-east").addClass("btn").append($("<b>").addClass("caret"));

        extensionMgr.onLayoutCreated(layout);
    }
    ;

    // Create the PageDown editor
    var editor = undefined;
    var fileDesc = undefined;
    var documentContent = undefined;
    var undoManager = undefined;
    core.initEditor = function(fileDescParam) {
        fileDesc = fileDescParam;
        documentContent = undefined;
        var initDocumentContent = fileDesc.content;
        var editorElt = $("#wmd-input");
        editorElt.val(initDocumentContent);
        if(editor !== undefined) {
            // If the editor is already created
            undoManager.reinit(initDocumentContent, fileDesc.editorStart, fileDesc.editorEnd, fileDesc.editorScrollTop);
            editor.refreshPreview();
            return;
        }
        var previewContainerElt = $(".preview-container");

        // Store editor scrollTop on scroll event
        editorElt.scroll(function() {
            if(documentContent !== undefined) {
                fileDesc.editorScrollTop = $(this).scrollTop();
            }
        });
        // Store editor selection on change
        editorElt.bind("keyup mouseup", function() {
            if(documentContent !== undefined) {
                fileDesc.editorStart = this.selectionStart;
                fileDesc.editorEnd = this.selectionEnd;
            }
        });
        // Store preview scrollTop on scroll event
        previewContainerElt.scroll(function() {
            if(documentContent !== undefined) {
                fileDesc.previewScrollTop = $(this).scrollTop();
            }
        });

        // Create the converter and the editor
        var converter = new Markdown.Converter();
        editor = new Markdown.Editor(converter);
        // Custom insert link dialog
        editor.hooks.set("insertLinkDialog", function(callback) {
            core.insertLinkCallback = callback;
            utils.resetModalInputs();
            $("#modal-insert-link").modal();
            return true;
        });
        // Custom insert image dialog
        editor.hooks.set("insertImageDialog", function(callback) {
            core.insertLinkCallback = callback;
            utils.resetModalInputs();
            $("#modal-insert-image").modal();
            return true;
        });

        function checkDocumentChanges() {
            var newDocumentContent = editorElt.val();
            if(documentContent !== undefined && documentContent != newDocumentContent) {
                fileDesc.content = newDocumentContent;
                extensionMgr.onContentChanged(fileDesc);
            }
            documentContent = newDocumentContent;
        }
        var previewWrapper;
        if(settings.lazyRendering === true) {
            previewWrapper = function(makePreview) {
                var debouncedMakePreview = _.debounce(makePreview, 500);
                return function() {
                    if(documentContent === undefined) {
                        makePreview();
                        editorElt.scrollTop(fileDesc.editorScrollTop);
                        previewContainerElt.scrollTop(fileDesc.previewScrollTop);
                    }
                    else {
                        debouncedMakePreview();
                    }
                    checkDocumentChanges();
                };
            };
        }
        else {
            previewWrapper = function(makePreview) {
                return function() {
                    makePreview();
                    if(documentContent === undefined) {
                        previewContainerElt.scrollTop(fileDesc.previewScrollTop);
                    }
                    checkDocumentChanges();
                };
            };
        }
        extensionMgr.onEditorConfigure(editor);
        editor.hooks.chain("onPreviewRefresh", extensionMgr.onAsyncPreview);
        undoManager = editor.run(previewWrapper);
        undoManager.reinit(initDocumentContent, fileDesc.editorStart, fileDesc.editorEnd, fileDesc.editorScrollTop);

        // Hide default buttons
        $(".wmd-button-row").addClass("btn-group").find("li:not(.wmd-spacer)").addClass("btn").css("left", 0).find("span").hide();

        // Add customized buttons
        $("#wmd-bold-button").append($("<i>").addClass("icon-bold"));
        $("#wmd-italic-button").append($("<i>").addClass("icon-italic"));
        $("#wmd-link-button").append($("<i>").addClass("icon-globe"));
        $("#wmd-quote-button").append($("<i>").addClass("icon-indent-left"));
        $("#wmd-code-button").append($("<i>").addClass("icon-code"));
        $("#wmd-image-button").append($("<i>").addClass("icon-picture"));
        $("#wmd-olist-button").append($("<i>").addClass("icon-numbered-list"));
        $("#wmd-ulist-button").append($("<i>").addClass("icon-list"));
        $("#wmd-heading-button").append($("<i>").addClass("icon-text-height"));
        $("#wmd-hr-button").append($("<i>").addClass("icon-hr"));
        $("#wmd-undo-button").append($("<i>").addClass("icon-undo"));
        $("#wmd-redo-button").append($("<i>").addClass("icon-share-alt"));
    };

    // onReady event callbacks
    var readyCallbacks = [];
    core.onReady = function(callback) {
        readyCallbacks.push(callback);
        runReadyCallbacks();
    };
    var ready = false;
    core.setReady = function() {
        ready = true;
        runReadyCallbacks();
    };
    function runReadyCallbacks() {
        if(ready === true) {
            _.each(readyCallbacks, function(callback) {
                callback();
            });
            readyCallbacks = [];
        }
    }

    core.onReady(function() {

        // Load theme list
        _.each(THEME_LIST, function(name, value) {
            $("#input-settings-theme").append($('<option value="' + value + '">' + name + '</option>'));
        });

        // listen to online/offline events
        $(window).on('offline', core.setOffline);
        $(window).on('online', setOnline);
        if(navigator.onLine === false) {
            core.setOffline();
        }

        // Detect user activity
        $(document).mousemove(setUserActive).keypress(setUserActive);

        // Avoid dropdown to close when clicking on submenu
        $(".dropdown-submenu > a").click(function(e) {
            e.stopPropagation();
        });

        var shownModalId = undefined;
        $(".modal").on('shown', function(e) {
            // Focus on the first input when modal opens
            var modalId = $(this).attr("id");
            if(shownModalId != modalId) {
                // Hack to avoid conflict with tabs, collapse, tooltips events
                shownModalId = modalId;
                _.defer(function(elt) {
                    elt.find("input:enabled:visible:first").focus();
                }, $(this));
            }
        }).on('hidden', function() {
            // Focus on the editor when modal is gone
            var modalId = $(this).attr("id");
            if(shownModalId == modalId && $(this).is(":hidden")) {
                shownModalId = undefined;
                $("#wmd-input").focus();
            }
        }).keyup(function(e) {
            // Handle enter key in modals
            if(e.which == 13 && !$(e.target).is("textarea")) {
                $(this).find(".modal-footer a:last").click();
            }
        });

        // Configure Mousetrap
        mousetrap.stopCallback = function(e, element, combo) {
            return shownModalId || $(element).is("input, select, textarea:not(#wmd-input)");
        };

        // Click events on "insert link" and "insert image" dialog buttons
        $(".action-insert-link").click(function(e) {
            var value = utils.getInputTextValue($("#input-insert-link"), e);
            if(value !== undefined) {
                core.insertLinkCallback(value);
                core.insertLinkCallback = undefined;
            }
        });
        $(".action-insert-image").click(function(e) {
            var value = utils.getInputTextValue($("#input-insert-image"), e);
            if(value !== undefined) {
                core.insertLinkCallback(value);
                core.insertLinkCallback = undefined;
            }
        });

        // Hide events on "insert link" and "insert image" dialogs
        $("#modal-insert-link, #modal-insert-image").on('hidden', function() {
            if(core.insertLinkCallback !== undefined) {
                core.insertLinkCallback(null);
                core.insertLinkCallback = undefined;
            }
        });

        // Settings loading/saving
        $(".action-load-settings").click(function() {
            loadSettings();
        });
        $(".action-apply-settings").click(function(e) {
            saveSettings(e);
            if(!e.isPropagationStopped()) {
                window.location.reload();
            }
        });
        // Import settings
        $(".action-import-settings").click(function(e) {
            $("#input-file-import-settings").click();
        });
        $("#input-file-import-settings").change(function(evt) {
            var files = (evt.dataTransfer || evt.target).files;
            $("#modal-settings").modal("hide");
            _.each(files, function(file) {
                var reader = new FileReader();
                reader.onload = (function(importedFile) {
                    return function(e) {
                        var content = e.target.result;
                        try {
                            JSON.parse(content);
                        }
                        catch(e) {
                            extensionMgr.onError(importedFile.name + " is not a valid JSON file.");
                            return;
                        }
                        localStorage.settings = content;
                        window.location.reload();
                    };
                })(file);
                var blob = file.slice(0, IMPORT_FILE_MAX_CONTENT_SIZE);
                reader.readAsText(blob);
            });
        });
        // Export settings
        $(".action-export-settings").click(function(e) {
            utils.saveAs(JSON.stringify(settings), "StackEdit Settings.json");
        });

        $(".action-default-settings").click(function() {
            localStorage.removeItem("settings");
            localStorage.removeItem("theme");
            window.location.reload();
        });

        $(".action-app-reset").click(function() {
            localStorage.clear();
            window.location.reload();
        });

        // UI layout
        $("#menu-bar, .ui-layout-center, .ui-layout-east, .ui-layout-south").removeClass("hide");
        createLayout();

        // Editor's textarea
        $("#wmd-input, #md-section-helper").css({
            // Apply editor font
            "font-family": settings.editorFontFamily,
            "font-size": settings.editorFontSize + "px",
            "line-height": Math.round(settings.editorFontSize * (20 / 14)) + "px"
        });

        // Handle tab key
        $("#wmd-input").keydown(function(e) {
            if(e.keyCode === 9) {
                var value = $(this).val();
                var start = this.selectionStart;
                var end = this.selectionEnd;
                // IE8 does not support selection attributes
                if(start === undefined || end === undefined) {
                    return;
                }
                $(this).val(value.substring(0, start) + "\t" + value.substring(end));
                this.selectionStart = this.selectionEnd = start + 1;
                e.preventDefault();
            }
        });

        // Reset inputs
        $(".action-reset-input").click(function() {
            utils.resetModalInputs();
        });

        // Do periodic tasks
        intervalId = window.setInterval(function() {
            utils.updateCurrentTime();
            checkWindowUnique();
            if(isUserActive() === true || viewerMode === true) {
                _.each(periodicCallbacks, function(callback) {
                    callback();
                });
                checkOnline();
            }
        }, 1000);
    });
    core.onReady(extensionMgr.onReady);

    // After extensions onReady callbacks
    core.onReady(function() {

        // Tooltips
        $(".tooltip-lazy-rendering").tooltip({
            container: '#modal-settings',
            placement: 'right',
            trigger: 'hover',
            title: 'Disable preview rendering while typing in order to offload CPU. Refresh preview after 500 ms of inactivity.'
        });
        $(".tooltip-default-content").tooltip({
            html: true,
            container: '#modal-settings',
            placement: 'right',
            trigger: 'hover',
            title: 'Thanks for supporting StackEdit by adding a backlink in your documents!'
        });
        $(".tooltip-usercustom-extension").tooltip({
            html: true,
            container: '#modal-settings',
            placement: 'right',
            trigger: 'manual',
            title: settingsUserCustomExtensionTooltipHTML
        }).click(function(e) {
            $(this).tooltip('show');
            $(document).on("click.tooltip-usercustom-extension", function(e) {
                $(".tooltip-usercustom-extension").tooltip('hide');
                $(document).off("click.tooltip-usercustom-extension");
            });
            e.stopPropagation();
        });
        $(".tooltip-template").tooltip({
            html: true,
            container: '#modal-settings',
            placement: 'right',
            trigger: 'manual',
            title: settingsTemplateTooltipHTML
        }).click(function(e) {
            $(this).tooltip('show');
            $(document).on("click.tooltip-template", function(e) {
                $(".tooltip-template").tooltip('hide');
                $(document).off("click.tooltip-template");
            });
            e.stopPropagation();
        });
        
        // Avoid dropdown panels to close on click
        $("div.dropdown-menu").click(function(e) {
            e.stopPropagation();
        });

    });

    return core;
});
