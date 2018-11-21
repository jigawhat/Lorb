//
// Lorb navbar buttons script
//


$( function() {

    $( "#home_button" ).click(function() { // Home button
        if (window.location != window.parent.location) {
            window.parent.location = "/";
        } else {
            window.location.href = "/";
        }
    });
    $( "#blog_button" ).click(function() { // Blog button
        if (window.location != window.parent.location) {
            window.parent.location = "/blog";
        } else {
            window.location.href = "/blog";
        }
    });
    // $( "#clog_button" ).click(function() { // Changelog button
        // window.location.href = "changelog"
    // });

});