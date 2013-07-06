var util ={
	isLocalStorage: function() {
		if ('localStorage' in window && window.localStorage !== null){
			return true;
		}
	}
};

$(window).load(function() {

  function resetProfile(){
    localStorage.clear();
  }
window.localStorage.clear() //try that


	// Resizable textarea
    $('textarea.resizable:not(.processed)').TextAreaResizer();

	// Highlighting code with Google prettify 
	var prettify = function(){	
		$('#wmd-preview pre').addClass('prettyprint');
		prettyPrint();
	};


	$('#wmd-input').keyup(function(){
		prettify();
		if(util.isLocalStorage()){
			localStorage.text = $(this).val();
		}
	});


	$("#post").click(function (){

  var theContent = $('#wmd-input').val(),
   _title = $('#title').val(),
      _url = convertToSlug(_title.trim());
      if (!_title){
        return alert("Please enter the title");
      } 
      if(!theContent) {
        return alert("Please enter some content");
      }

      var editPost = '{{editParam}}';

      if(!editPost) {
        saveToServerAjaxCall('/new/post', {data:theContent,title:_title,url:_url}, function () {
        resetProfile();
        });
      } else {
        saveToServerAjaxCall('/edit/post', {data:theContent,title:_title,url:_url}, function () {
				resetProfile();
        });
      }

});


function saveToServerAjaxCall(url, data, callback) {

  $.ajax({
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json',
    url: url,
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
	
	// storing text locally
	if(util.isLocalStorage()){
		if(localStorage.text){		
			$('#wmd-input').val(localStorage.text);
		}
	}
	
	// remove data locally when textarea is cleared, so the text reverts to defaults
	$('#clear').click(function(){
        $('#wmd-input').val('');
		if(util.isLocalStorage()){
			localStorage.removeItem('text');
		}
		localStorage.clear();
    });

	function resetProfile(){
    // For some reason, clear() is not working in Chrome.
    localStorage.clear()
    // Now reload the page to start fresh
    window.location.reload()
//    Notifier.showMessage(Notifier.messages.profileCleared, 1400)
  }
	
	prettify();

});

