$(function () {
  $('#submit').click(function (e) {
    // e.preventDefault() // prevents the form from being submitted
    var data = {};
    data.fullName = $("#fullName").val();
    data.author = $("#author").val();
    data.email = $("#email").val();
    data.authorDesc = $("#authorDesc").val();

    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: '/admin/setting/author',
      success: function (data) {
        console.log('success');
        console.log(JSON.stringify(data));
      }
    });
  });
    
    $.post('/admin/setting/author',function(data){

      alert(data);
  });

});