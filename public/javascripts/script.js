var util ={
	isLocalStorage: function() {
		if ('localStorage' in window && window.localStorage !== null){
			return true;
		}
	}
};

$(window).load(function() {


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
    });
	
	prettify();

});

