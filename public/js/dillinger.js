$(function(){
  
  var editor
    , converter
    , autoInterval
    , githubUser
    , paperImgPath = '/img/notebook_paper_200x200.gif'
    , profile = 
      {
        theme: 'ace/theme/idle_fingers'
      , showPaper: false
      , currentMd: ''
      , autosave: 
        {
          enabled: true
        , interval: 3000 // might be too aggressive; don't want to block UI for large saves.
        }
      , current_filename : 'Title goes here'
      , dropbox:
        {
          filepath: '/Dillinger/'
        }
      }

  // Feature detect ish
  var dillinger = 'dillinger'
    , dillingerElem = document.createElement(dillinger)
    , dillingerStyle = dillingerElem.style
    , domPrefixes = 'Webkit Moz O ms Khtml'.split(' ')
    
  // Cache some shit
  var $theme = $('#theme-list')
    , $preview = $('#preview')
    , $autosave = $('#autosave')
    , $import_github = $('#import_github')

    
  // Hash of themes and their respective background colors
  var bgColors = 
    {
      'chrome': '#bbbbbb'
    , 'clouds': '#7AC9E3'
    , 'clouds_midnight': '#5F9EA0'
    , 'cobalt': '#4d586b'
    , 'crimson_editor': '#ffffff'
    , 'dawn': '#DADCAD'
    , 'eclipse': '#6C7B8A'
    , 'idle_fingers': '#DEB887'
    , 'kr_theme': '#434343'
    , 'merbivore': '#3E353E'
    , 'merbivore_soft': '#565156'
    , 'mono_industrial': '#C0C0C0'
    , 'monokai': '#F5DEB3'
    , 'pastel_on_dark': '#676565'
    , 'solarized-dark': '#0E4B5A'
    , 'solarized_light': '#dfcb96'
    , 'textmate': '#fff'
    , 'tomorrow': '#0e9211'
    , 'tomorrow_night': '#333536'
    , 'tomorrow_night_blue': '#3a4150'
    , 'tomorrow_night_bright': '#3A3A3A'
    , 'tomorrow_night_eighties': '#474646'
    , 'twilight': '#534746'
    , 'vibrant_ink': '#363636'
    }
      
      
  /// UTILS =================
  

  /**
   * Utility method to async load a JavaScript file.
   *
   * @param {String} The name of the file to load
   * @param {Function} Optional callback to be executed after the script loads.
   * @return {void}
   */
  function asyncLoad(filename,cb){
    (function(d,t){

      var leScript = d.createElement(t)
        , scripts = d.getElementsByTagName(t)[0]
      
      leScript.async = 1
      leScript.src = filename
      scripts.parentNode.insertBefore(leScript,scripts)

      leScript.onload = function(){
        cb && cb()
      }

    }(document,'script'))
  }
  
  /**
   * Utility method to determin if localStorage is supported or not.
   *
   * @return {Boolean}
   */
  function hasLocalStorage(){
   // http://mathiasbynens.be/notes/localstorage-pattern  
   var storage
   try{ if(localStorage.getItem) {storage = localStorage} }catch(e){}
   return storage
  }

  /**
   * Grab the user's profile from localStorage and stash in "profile" variable.
   *
   * @return {Void}
   */
  function getUserProfile(){
    
    var p
    
    try{
      p = JSON.parse( localStorage.profile )
      // Need to merge in any undefined/new properties from last release 
      // Meaning, if we add new features they may not have them in profile
      p = $.extend(true, profile, p)
    }catch(e){
      p = profile
    }

    profile = p
    
    // console.dir(profile)
  }
  
  /**
   * Update user's profile in localStorage by merging in current profile with passed in param.
   *
   * @param {Object}  An object containg proper keys and values to be JSON.stringify'd
   * @return {Void}
   */
  function updateUserProfile(obj){
    localStorage.clear()
    localStorage.profile = JSON.stringify( $.extend(true, profile, obj) )
  }

  /**
   * Utility method to test if particular property is supported by the browser or not.
   * Completely ripped from Modernizr with some mods. 
   * Thx, Modernizr team! 
   *
   * @param {String}  The property to test
   * @return {Boolean}
   */
  function prefixed(prop){ return testPropsAll(prop, 'pfx') }

  /**
   * A generic CSS / DOM property test; if a browser supports
   * a certain property, it won't return undefined for it.
   * A supported CSS property returns empty string when its not yet set.
   *
   * @param  {Object}  A hash of properties to test
   * @param  {String}  A prefix
   * @return {Boolean}
   */
  function testProps( props, prefixed ) {
      
      for ( var i in props ) {
        
          if( dillingerStyle[ props[i] ] !== undefined ) {
              return prefixed === 'pfx' ? props[i] : true
          }
      
      }
      return false
  }

  /**
   * Tests a list of DOM properties we want to check against.
   * We specify literally ALL possible (known and/or likely) properties on
   * the element including the non-vendor prefixed one, for forward-
   * compatibility.
   *
   * @param  {String}  The name of the property
   * @param  {String}  The prefix string
   * @return {Boolean} 
   */
  function testPropsAll( prop, prefixed ) {

      var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1)
        , props   = (prop + ' ' + domPrefixes.join(ucProp + ' ') + ucProp).split(' ')

      return testProps(props, prefixed)
  }
  
  /**
   * Normalize the transitionEnd event across browsers.
   *
   * @return {String} 
   */
  function normalizeTransitionEnd()
  {

    var transEndEventNames = 
      {
        'WebkitTransition' : 'webkitTransitionEnd'
      , 'MozTransition'    : 'transitionend'
      , 'OTransition'      : 'oTransitionEnd'
      , 'msTransition'     : 'msTransitionEnd' // maybe?
      , 'transition'       : 'transitionend'
      }

     return transEndEventNames[ prefixed('transition') ]
  }


  /**
   * Generate a random filename.
   *
   * @param  {String}  The file type's extension
   * @return {String} 
   */
  function generateRandomFilename(ext){
    return 'dillinger_' +(new Date()).toISOString().replace(/[\.:-]/g, "_")+ '.' + ext
  }


  /**
   * Get current filename from contenteditable field.
   *
   * @return {String} 
   */
  function getCurrentFilenameFromField(){
    return $('#filename > span[contenteditable="true"]').text()
  }


  /**
   * Set current filename from profile.
   *
   * @param {String}  Optional string to force set the value. 
   * @return {String} 
   */
  function setCurrentFilenameField(str){
    $('#filename > span[contenteditable="true"]').text( str || profile.current_filename || "Title goes here")
  }


  /**
   * Initialize application.
   *
   * @return {Void}
   */
  function init(){

    if( !hasLocalStorage() ) { sadPanda() }
    else{
      
      // Attach to jQuery support object for later use.
      $.support.transitionEnd = normalizeTransitionEnd()
      
      getUserProfile()

      initAce()
      
      initUi()
      
      converter = new Showdown.converter()
      
      bindPreview()

      bindNav()
      
      bindKeyboard()
            
      bindFilenameField()
              
      autoSave()
      
    }

  }

  /**
   * Initialize theme and other options of Ace editor.
   *
   * @return {Void}
   */
  function initAce(){
    
    editor = ace.edit("editor")
    
  } // end initAce

  /**
   * Initialize various UI elements based on userprofile data.
   *
   * @return {Void}
   */
  function initUi(){
    
    // Set proper theme value in theme dropdown
    fetchTheme(profile.theme, function(){
      $theme.find('li > a[data-value="'+profile.theme+'"]').addClass('selected')
      
      editor.getSession().setUseWrapMode(true)
      editor.setShowPrintMargin(false)

      editor.getSession().setMode('ace/mode/markdown')
      
      editor.getSession().setValue( profile.currentMd || editor.getSession().getValue())
      
      // Immediately populate the preview <div>
      previewMd()
      
    })
    
    // Set/unset paper background image on preview
    // TODO: FIX THIS BUG
    $preview.css('backgroundImage', profile.showPaper ? 'url("'+paperImgPath+'")' : 'url("")' )
    
    // Set text for dis/enable autosave
    $autosave.html( profile.autosave.enabled ? '<i class="icon-remove"></i>&nbsp;Disable Autosave' : '<i class="icon-ok"></i>&nbsp;Enable Autosave' )
    
    // Check for logged in Github user and notifiy
    githubUser = $import_github.attr('data-github-username')
    
    githubUser && Notifier.showMessage("What's Up " + githubUser, 1000)
        
    setCurrentFilenameField()
    
    /* BEGIN RE-ARCH STUFF */

    $('.dropdown-toggle').dropdown()
    
    /* END RE-ARCH STUFF */
    
  }


  /// HANDLERS =================

  
  /**
   * Clear the markdown and text and the subsequent HTML preview.
   *
   * @return {Void}
   */
  function clearSelection(){
    editor.getSession().setValue("")
    previewMd()    
  }

  // TODO: WEBSOCKET MESSAGE?
  /**
   * Save the markdown via localStorage - isManual is from a click or key event.
   *
   * @param {Boolean} 
   * @return {Void}
   */
  function saveFile(isManual){
    
    updateUserProfile({currentMd: editor.getSession().getValue()})
    
    isManual && Notifier.showMessage(Notifier.messages.docSavedLocal)
  
  }
  
  /**
   * Enable autosave for a specific interval.
   *
   * @return {Void}
   */
  function autoSave(){

    if(profile.autosave.enabled){
      autoInterval = setInterval( function(){
        // firefox barfs if I don't pass in anon func to setTimeout.
        saveFile()
      }, profile.autosave.interval)
      
    }
    else{
      clearInterval( autoInterval )
    }

  }
  
  /**
   * Clear out user profile data in localStorage.
   *
   * @return {Void}
   */
  function resetProfile(){
    // For some reason, clear() is not working in Chrome.
    localStorage.clear()
    // Let's turn off autosave
    profile.autosave.enabled = false
    // Delete the property altogether --> need ; for JSHint bug.
    ; delete localStorage.profile
    // Now reload the page to start fresh
    window.location.reload()
//    Notifier.showMessage(Notifier.messages.profileCleared, 1400)
  }

  /**
   * Dropbown nav handler to update the current theme.
   *
   * @return {Void}
   */  
   function changeTheme(e){
     // check for same theme
     var $target = $(e.target)
     if( $target.attr('data-value') === profile.theme) { return }
     else{
       // add/remove class
       $theme.find('li > a.selected').removeClass('selected')
       $target.addClass('selected')
       // grabnew theme
       var newTheme = $target.attr('data-value')
       $(e.target).blur()
       fetchTheme(newTheme, function(){
         Notifier.showMessage(Notifier.messages.profileUpdated)
       })
      }
   }  
  
  // TODO: Maybe we just load them all once and stash in appcache?
  /**
   * Dynamically appends a script tag with the proper theme and then applies that theme.
   *
   * @param {String}  The theme name
   * @param {Function}   Optional callback
   * @return {Void}
   */  
  function fetchTheme(th, cb){
    var name = th.split('/').pop()

    asyncLoad("/js/theme-"+ name +".js", function(){

      editor.setTheme(th)

      cb && cb()
      
      updateBg(name)
      
      updateUserProfile({theme: th})
    
    }) // end asyncLoad

  } // end fetchTheme(t)
  
  /**
   * Change the body background color based on theme.
   *
   * @param {String}  The theme name
   * @return {Void}
   */  
  function updateBg(name){
    document.body.style.backgroundColor = bgColors[name]
  }
  
  /**
   * Clientside update showing rendered HTML of Markdown.
   *
   * @return {Void}
   */  
  function previewMd(){
    
    var unmd = editor.getSession().getValue()
      , md = converter.makeHtml(unmd)
    
    $preview
      .html('') // unnecessary?
      .html(md)
      
  }

  /**
   * Stash current file name in the user's profile.
   *
   * @param {String}  Optional string to force the value
   * @return {Void}
   */  
  function updateFilename(str){
    // Check for string because it may be keyup event object
    var f
    if(typeof str === 'string'){
      f = str
    }else
    {
      f = getCurrentFilenameFromField()
    }
    updateUserProfile( {current_filename: f })
  }
  
  /**
   * XHR Post Markdown to get a md file.  Appends response to hidden iframe to 
   * automatically download the file.
   *
   * @return {Void}
   */  
  function fetchMarkdownFile(){
    
    // TODO: UPDATE TO SUPPORT FILENAME NOT JUST A RANDOM FILENAME
    var unmd = editor.getSession().getValue()
    
    function _doneHandler(a, b, response){
      a = b = null // JSHint complains if a, b are null in method
      var resp = JSON.parse(response.responseText)
      // console.dir(resp)
      document.getElementById('downloader').src = '/files/md/' + resp.data
    }

    function _failHandler(){
        alert("Roh-roh. Something went wrong. :(")
    }
    
    var mdConfig = {
                      type: 'POST',
                      data: "unmd=" + encodeURIComponent(unmd),
                      dataType: 'json',
                      url: '/factory/fetch_markdown',
                      error: _failHandler,
                      success: _doneHandler
                    }

    $.ajax(mdConfig)  
    
  }

  /**
   * XHR Post Markdown to get a html file.  Appends response to hidden iframe to 
   * automatically download the file.
   *
   * @return {Void}
   */  
  function fetchHtmlFile(){
    
    // TODO: UPDATE TO SUPPORT FILENAME NOT JUST A RANDOM FILENAME
    
    var unmd = editor.getSession().getValue()

    function _doneHandler(jqXHR, data, response){
      // console.dir(resp)
      var resp = JSON.parse(response.responseText)
      document.getElementById('downloader').src = '/files/html/' + resp.data
    }

    function _failHandler(){
      alert("Roh-roh. Something went wrong. :(")
    }

    var config = {
                      type: 'POST',
                      data: "unmd=" + encodeURIComponent(unmd),
                      dataType: 'json',
                      url: '/factory/fetch_html',
                      error: _failHandler,
                      success: _doneHandler
                    }

    $.ajax(config)  
    
  }

  function showHtml(){
    
    // TODO: UPDATE TO SUPPORT FILENAME NOT JUST A RANDOM FILENAME
    
    var unmd = editor.getSession().getValue()

    function _doneHandler(jqXHR, data, response){
      // console.dir(resp)
      var resp = JSON.parse(response.responseText)
      $('#myModalBody').text(resp.data)
      $('#myModal').modal()
    }

    function _failHandler(){
      alert("Roh-roh. Something went wrong. :(")
    }

    var config = {
                      type: 'POST',
                      data: "unmd=" + encodeURIComponent(unmd),
                      dataType: 'json',
                      url: '/factory/fetch_html_direct',
                      error: _failHandler,
                      success: _doneHandler
                    }

    $.ajax(config)  
    
  }

  /**
   * Show a sad panda because they are using a shitty browser. 
   *
   * @return {Void}
   */  
  function sadPanda(){
    // TODO: ACTUALLY SHOW A SAD PANDA.
    alert('Sad Panda - No localStorage for you!')
  }

  /**
   * Show the modal for the "About Dillinger" information.
   *
   * @return {Void}
   */  
  function showAboutInfo(){

    $('.modal-header h3').text("What's the deal with Dillinger?")

    // TODO: PULL THIS OUT AND RENDER VIA TEMPLATE FROM XHR OR STASH IN PAGE FOR SEO AND CLONE
    var aboutContent =  "<p>Dillinger is an online cloud-enabled, HTML5, buzzword-filled Markdown editor.</p>"
                      + "<p>Dillinger was designed and developed by <a href='http://twitter.com/joemccann'>@joemccann</a> because he needed a decent Markdown editor.</p>"
                      + "<p>Dillinger is a 100% open source project so <a href='https://github.com/joemccann/dillinger'>fork the code</a> and contribute!</p>"
                      + "<p>Follow Dillinger on Twitter at <a href='http://twitter.com/dillingerapp'>@dillingerapp</a></p>"
  
    $('.modal-body').html(aboutContent)

    $('#modal-generic').modal({
      keyboard: true,
      backdrop: true,
      show: true
    })
    
  }
  
  /**
   * Show the modal for the "Preferences".
   *
   * @return {Void}
   */
  function showPreferences(){

    $('.modal-header h3').text("Preferences")
    
    // TODO: PULL THIS OUT AND RENDER VIA TEMPLATE FROM XHR OR STASH IN PAGE FOR SEO AND CLONE
    var prefContent =  '<div>'
                          +'<ul>'
                            +'<li><a href="#" id="paper">Toggle Paper</a></li>'
                            +'<li><a href="#" id="reset">Reset Profile</a></li>'
                          +'</ul>'
                        +'</div>'
  
    $('.modal-body').html(prefContent)

    $('#modal-generic').modal({
      keyboard: true,
      backdrop: true,
      show: true
    })
    
  }
  
  
  /// UI RELATED =================

  /**
   * Toggles the paper background image. 
   *
   * @return {Void}
   */  
  function togglePaper(){
    
    $preview.css('backgroundImage', !profile.showPaper ? 'url("'+paperImgPath+'")' : 'url("")'  )

    updateUserProfile({showPaper: !profile.showPaper})
    
    Notifier.showMessage(Notifier.messages.profileUpdated)

  }
  
  /**
   * Toggles the autosave feature. 
   *
   * @return {Void}
   */  
  function toggleAutoSave(){

    $autosave.html( profile.autosave.enabled ? '<i class="icon-remove"></i>&nbsp;Disable Autosave' : '<i class="icon-ok"></i>&nbsp;Enable Autosave' )

    updateUserProfile({autosave: {enabled: !profile.autosave.enabled }})

    autoSave()
  
  }


  /**
   * Bind keyup handler to the editor.
   *
   * @return {Void}
   */  
  function bindFilenameField(){
    $('#filename > span[contenteditable="true"]').bind('keyup', updateFilename)
  }
  
  
  /**
   * Bind keyup handler to the editor.
   *
   * @return {Void}
   */  
  function bindPreview(){
    $('#editor').bind('keyup', previewMd)
  }
  
  /**
   * Bind navigation elements.
   *
   * @return {Void}
   */  
  function bindNav(){
    
    $theme
      .find('li > a')
      .bind('click', function(e){
        changeTheme(e)
        return false
      })

    $('#clear')
      .on('click', function(){
        clearSelection()
        return false
      })

    $(".modal-body").delegate("#paper", "click", function(){
      togglePaper()
      return false
    })

    $("#autosave")
      .on('click', function(){
        toggleAutoSave()
        return false
    })

    $('#reset')
      .on('click', function(){
        resetProfile()
        return false
      })

    $('#export_md')
      .on('click', function(){
        fetchMarkdownFile()
        $('.dropdown').removeClass('open')
        return false
      })

    $('#export_html')
      .on('click', function(){
        fetchHtmlFile()
        $('.dropdown').removeClass('open')
        return false
      })

 $("#someBtn").click(function (){

  var theContent = editor.getSession().getValue(),
   _title = getCurrentFilenameFromField(),
      _url = convertToSlug(_title.trim());
      if (!_title){
        return alert("Please enter the title");
      } 
      if(!theContent) {
        return alert("Please enter some content");
      }
      saveToServerAjaxCall('/save', {data:theContent,title:_title,url:_url}, function () {
    console.log('Data was saved to the database.');
  });

});


function saveToServerAjaxCall(url, data, callback) {

  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: '/new/post',
    statusCode: {
      200: function (response) {

      },
      201: function (response) {

      },
      401: function (response) {

      },
      404: function (response) {

      }
   },
    success: function (data) {
      resetProfile();
      window.location.href = '/'+data.url;
    }
  });
}

function convertToSlug(Text)
{
    return Text
        .toLowerCase()
        .replace(/ /g,' ')
        .replace(/[^\w-]+/g,' ')
        ;
}

    $('#show_html')
      .on('click', function(){
        showHtml()
        $('.dropdown').removeClass('open')
        return false
      })

    $('#preferences').
      on('click', function(){
        showPreferences()
        return false
      })

    $('#about').
      on('click', function(){
        showAboutInfo()
        return false
      })

    $('#cheat').
      on('click', function(){
        window.open("https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet", "_blank")
        return false
      })

  } // end bindNav()

  /**
   * Bind special keyboard handlers.
   *
   * @return {Void}
   */  
  function bindKeyboard(){
    // CMD+s TO SAVE DOC
    key('command+s, ctrl+s', function(e){
     saveFile(true)
     e.preventDefault() // so we don't save the webpage - native browser functionality
    })
    
    var saveCommand = {
       name: "save",
       bindKey: {
                mac: "Command-S",
                win: "Ctrl-S"
              },
       exec: function(){ 
         saveFile(true) 
       }
    }
    var fileForUrlNamer = {
       name: "filenamer",
       bindKey: {
                mac: "Command-Shift-M",
                win: "Ctrl-Shift-M"
              },
       exec: function(){ 
        var profile = JSON.parse(localStorage.profile);
        alert( profile.current_filename.replace(/\s/g, '-').toLowerCase())
      }
    }

    editor.commands.addCommand(saveCommand)
    editor.commands.addCommand(fileForUrlNamer)
  }

  /**
   * Bind dynamically added elements' handlers.
   *
   * @return {Void}
   */  


  /// MODULES =================


  // Notification Module
  var Notifier = (function(){
    
    var _el = $('#notify')      
    
      return {
        messages: {
          profileUpdated: "Profile updated"
          , profileCleared: "Profile cleared"
          , docSavedLocal: "Document saved locally"
          , docSavedServer: "Document saved on our server"
          , docSavedDropbox: "Document saved on dropbox"
          , dropboxImportNeeded: "Please import a file from dropbox first."
        },
        showMessage: function(msg,delay){
          
          // TODO: FIX ANIMATION QUEUE PROBLEM - .stop() doesn't work.

          _el
            .text('')
            .stop()
            .text(msg)
            .slideDown(250, function(){
              _el
                .delay(delay || 1000)
                .slideUp(250)
            })

          } // end showMesssage
      } // end return obj
  })() // end IIFE

  init()
  
  // TODO:  add window.resize() handlers.

})

/**
 * Get scrollHeight of preview div
 * (code adapted from https://github.com/anru/rsted/blob/master/static/scripts/editor.js)
 * 
 * @param {Object} The jQuery object for the preview div
 * @return {Int} The scrollHeight of the preview area (in pixels)
 */
function getScrollHeight($prevFrame) {
    // Different browsers attach the scrollHeight of a document to different
    // elements, so handle that here.
    if ($prevFrame[0].scrollHeight !== undefined) {
        return $prevFrame[0].scrollHeight;
    } else if ($prevFrame.find('html')[0].scrollHeight !== undefined &&
               $prevFrame.find('html')[0].scrollHeight !== 0) {
        return $prevFrame.find('html')[0].scrollHeight;
    } else {
        return $prevFrame.find('body')[0].scrollHeight;
    }
}

/**
 * Scroll preview to match cursor position in editor session
 * (code adapted from https://github.com/anru/rsted/blob/master/static/scripts/editor.js)
 * 
 * @return {Void}
 */

function syncPreview() {
  var $ed = window.ace.edit('editor');
  var $prev = $('#preview');

  var editorScrollRange = ($ed.getSession().getLength());
  
  var previewScrollRange = (getScrollHeight($prev));
  
  // Find how far along the editor is (0 means it is scrolled to the top, 1
  // means it is at the bottom).
  var scrollFactor = $ed.getFirstVisibleRow() / editorScrollRange;

  // Set the scroll position of the preview pane to match.  jQuery will
  // gracefully handle out-of-bounds values.
  $prev.scrollTop(scrollFactor * previewScrollRange);
}

window.onload = function(){
  var $loading = $('#loading')
  
  $loading
    .bind( $.support.transitionEnd, function(){
      $('#main').removeClass('bye')
      $loading.remove()
    })
    .addClass('fade_slow');
  
  /**
   * Bind synchronization of preview div to editor scroll and change
   * of editor cursor position.
   */
  window.ace.edit('editor').session.on('changeScrollTop', syncPreview);
  window.ace.edit('editor').session.selection.on('changeCursor', syncPreview);
}
