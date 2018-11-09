/*
 * jQuery OnEnter Plugin
 * Author: Ryan Schwartz
 * Version: 1.0.1 (15-FEB-2014)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-3.0-standalone.html
 */
	
		
// Initiate the OnEnter handler
$(function() {
	OnEnter();
});

(function($){
	
	// Declare function
	OnEnter = function(){ 
		
		// Detect all onenters
		OnEnter.detect();
	};
	
	// Detect all elements with an onenter attribute
	OnEnter.detect = function(){
			
		$('*[onenter]').each(function(index){
		
			// Unbind any previous binds
			$(this).unbind('keydown');
			
			// Bind form elements for process
			$(this).keydown(function(event) {
				var e = (window.event) ? window.event : event;
				if(e.keyCode == 13){
					var fnct = $(this).attr('onenter');
					eval(fnct);
				}
			})
		});
	}
	
})(jQuery);

