$(function () {
  $('#submit').click(function (e) {
    // e.preventDefault() // prevents the form from being submitted
    var data = {};
    data.id = $("#id").val();
    data.title = $("#title").val();
    data.content = $("#content").val();
    data.author = $("#author").val();
    data.email = $("#email").val();

  for (k in data) {
    if ($.trim(data[k]) === "") {
      alert("All fields must be filled.");
      return false;
    }
  }

    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      url: '/console',
      success: function (data) {
        console.log('success');
        console.log(JSON.stringify(data));
      }
    });
  });
});