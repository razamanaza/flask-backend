$(function(){
  $('#countries-list').change(function() {
    id = this.value
    $.get("/countries/" + id, function(response){
      $("#output").html(response);
    }).fail(function(e){
      console.log('Request error: ' + e.status + ' ' + e.statusText);
    });
  });
});
