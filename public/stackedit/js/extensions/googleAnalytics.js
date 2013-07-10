define([
    "jquery",
    "underscore",
    "utils",
    "classes/Extension",
    "settings",
    "config",
], function($, _, utils, Extension, settings) {

    var googleAnalytics = new Extension("googleAnalytics", "Google Analytics", true);
    googleAnalytics.settingsBlock = '<p>Sends anonymous statistics about usage and errors to help improve StackEdit.</p>';

    var isLoaded = false;
    var isOffline = false;
    window["_gaq"] = [];

    var init = function() {
        if(isLoaded === false && isOffline === false) {
            var gaUrl = "/ga.js";
            if(location.search.match(/(\?|&)console/)) {
                gaUrl = "/u/ga_debug.js";
            }
            $.ajax({
                url: "http://www.google-analytics.com" + gaUrl,
                dataType: "script"
            }).done(function() {
                isLoaded = true;
            });
        }
    };

    var lastPageView = 0;
    function trackPageView() {
        if(utils.currentTime - lastPageView > 180000) {
            _gaq.push([
                '_trackPageview'
            ]);
            lastPageView = utils.currentTime;
        }
    }
    googleAnalytics.onPeriodicRun = function() {
        trackPageView();
    };

    googleAnalytics.onReady = function() {

        // First configure GA
        _gaq.push([
            '_setAccount',
            GOOGLE_ANALYTICS_ACCOUNT_ID
        ]);
        trackPageView();

        // Collect informations about user settings
        _gaq.push([
            '_trackEvent',
            "Settings",
            'layoutOrientation',
            "" + settings.layoutOrientation
        ]);
        _gaq.push([
            '_trackEvent',
            "Settings",
            'lazyRendering',
            "" + settings.lazyRendering
        ]);
        _gaq.push([
            '_trackEvent',
            "Settings",
            'editorFontFamily',
            "" + settings.editorFontFamily
        ]);
        _gaq.push([
                   '_trackEvent',
                   "Settings",
                   'editorFontSize',
                   "" + settings.editorFontSize
                   ]);
        // Check if user has removed back links
        _gaq.push([
            '_trackEvent',
            "Settings",
            'defaultContent backlink',
            "" + (settings.defaultContent.indexOf(MAIN_URL) !== -1)
        ]);
        _gaq.push([
            '_trackEvent',
            "Settings",
            'commitMsg backlink',
            "" + (settings.commitMsg.indexOf(MAIN_URL) !== -1)
        ]);
        // Check if user has changed sshProxy
        _gaq.push([
            '_trackEvent',
            "Settings",
            'sshProxy unchanged',
            "" + (settings.sshProxy == SSH_PROXY_URL)
        ]);
        // Check if extensions have been disabled
        _.each(settings.extensionSettings, function(config, extensionId) {
            _gaq.push([
                '_trackEvent',
                "Extensions",
                extensionId + " enabled",
                "" + (config.enabled === true)
            ]);
        });

        // Catch window JavaScript errors
        window.onerror = function(message, url, line) {
            _gaq.push([
                "_trackEvent",
                "Error",
                message,
                url + ":" + line + utils.formatEventList()
            ]);
        };

        init();
    };
    googleAnalytics.onOfflineChanged = function(isOfflineParam) {
        isOffline = isOfflineParam;
        init();
    };

    var startTime = 0;
    googleAnalytics.onSyncRunning = function(isRunning) {
        if(isRunning === true) {
            startTime = new Date().getTime();
        }
    };
    googleAnalytics.onPublishRunning = function(isRunning) {
        if(isRunning === true) {
            startTime = new Date().getTime();
        }
    };

    // Log sync time
    googleAnalytics.onSyncSuccess = function() {
        var endTime = new Date().getTime();
        _gaq.push([
            '_trackTiming',
            'Sync',
            'SyncTime',
            endTime - startTime
        ]);
    };
    // Log import frequency and provider
    googleAnalytics.onSyncImportSuccess = function(fileDescList, provider) {
        _gaq.push([
            '_trackEvent',
            'Sync',
            'SyncImport',
        ]);
        _gaq.push([
            '_trackEvent',
            'Sync',
            'SyncImport provider',
            provider.providerId
        ]);
    };
    // Log export frequency and provider
    googleAnalytics.onSyncExportSuccess = function(fileDesc, syncAttributes) {
        _gaq.push([
            '_trackEvent',
            'Sync',
            'SyncExport',
        ]);
        _gaq.push([
            '_trackEvent',
            'Sync',
            'SyncExport provider',
            syncAttributes.provider.providerId
        ]);
    };
    // Log publish time and provider
    googleAnalytics.onPublishSuccess = function(fileDesc) {
        var endTime = new Date().getTime();
        _gaq.push([
            '_trackTiming',
            'Publish',
            'PublishSuccess',
            endTime - startTime
        ]);
        _.each(fileDesc.publishLocations, function(publishAttributes) {
            _gaq.push([
                '_trackEvent',
                'Publish',
                'PublishSuccess provider',
                publishAttributes.provider.providerId
            ]);
        });
    };
    // Log new publication's provider
    googleAnalytics.onNewPublishSuccess = function(fileDesc, publishAttributes) {
        _gaq.push([
            '_trackEvent',
            'Publish',
            'NewPublish provider',
            publishAttributes.provider.providerId
        ]);
    };

    // Log error messages
    googleAnalytics.onError = function(error) {
        if(_.isString(error) || !error.message) {
            return;
        }
        _gaq.push([
            '_trackEvent',
            "Error",
            "message",
            error.message + utils.formatEventList()
        ]);
    };

    return googleAnalytics;
});