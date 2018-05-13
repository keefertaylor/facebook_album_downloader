// listen for our browerAction to be clicked
chrome.browserAction.onClicked.addListener(function(tab){
//chrome.pageAction.onClicked.addListener(function(tab){
	if (isValidURLForExtension(tab.url)) {
		chrome.tabs.executeScript(tab.ib, {
			file: 'compiled_album_downloader.js'
	     });		
	} else {
		alert("You're not in a Facebook Album. Try browsing to one (the address should be something like 'facebook.com/photo.php?)");
	}
});

/**
 * Check to see if user is at the right URL.
 * Expected format is something like:
 * http(s)://(www).facebook.com/photo.php?***
 */
function isValidURLForExtension(url) {
	if (url.indexOf('facebook.com/photo.php') > -1) {
		return true;
	} else {
		return false;
	}
}
