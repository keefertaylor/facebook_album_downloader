/**
 * Facebook Album Downloader
 * 
 * This script relies on and assumes the following libraries are loaded in the global namespace:
 * - JSZip, https://stuk.github.io/jszip/
 * - FileSaver, https://github.com/eligrey/FileSaver.js/
 *
 * This script attempts to place a logging console on the lightbox when activated, but will always
 * replicate messages to the browser's console as well.
 * 
 * This script relies on the following observations:
 * - Every photo on Facebook has a unique identifier, or `FBID`
 * - Each photo in a facebook album is ultimately an `img` tag, with a link to a photo 
 *	 in a format like: 
 *		https://<CDN Server>/v/t.AA.A-A/BBBB_FBID_CCCC_o.jpg?oh=DDDD&oe=EEEEE
 *   where AA.A-A, BBBB, CCCC, DDDD and EEEE are unknown values, but the unique FBID of the photo
 * 	 is always the second number in the URL.
 * 
 * Because Facebook obfuscates their JS and CSS, it's impossible (or at least difficult) to hook into
 * callbacks in their javascript. Instead, this script identifies a complete page by the value of the
 * `img` tag's `src` attribute changing to a URL with a unique FBID. Checking for events is done
 * via the setTimeout method so that the main thread (which Facebook needs to load data) isn't overloaded.
 *
 * The basic algorithm of this script is set up as follows:
 * - Sanity check that the user is on a page with a lightbox
 * - Record a the initial FBID from the `img.src` attribute
 * - Loop:
 * --- Hit next, wait for next photo to load
 * --- Download new photo
 * --- Check if newly downloaded photo's FBID is the initial FBID, if yes, stop looping
 * - Zip and download photos
 *
 * Notes:
 * - The web page URL of a photo in an album appears to be unique for every photo and contains the
 *   FBID. However, when paging rapidly and continously, the URL sometimes fails to update, or
 *   otherwise gets out of synce with the displayed photo. This makes it a less reliable signal than
 *   the `img.src` attribute. 
 * - Internally, Facebook appears to refer to the lightbox carousel UI as `snowlift`.
 *
 * Compatibility:
 * - Tested on Chrome 55. There's nothing crazy here that shouldn't work on other browsers though.
 */ 

//-----------------------------------------------------------------------
// Configuration parameters.
//-----------------------------------------------------------------------

/** 
 * Expected class name for the element that is FB_NEXT_BUTTON. 
 * This element must be on the page exactly once.
 */
var FB_NEXT_BUTTON_CLASS_NAME = "next";

/** 
 * Expected class name for the element that is FB_PHOTOS_UI_CONTAINER. 
 * This element must be on the page exactly once.
 */
var FB_STAGE_CONTAINER_CLASS_NAME = "stageWrapper";

/**
 * Expected class name for the container of the entire photo spotlight UI.
 * Note that Facebook appears to call this UI 'snowlift'.
 * This element must be on the page exactly once.
 */
var FB_PHOTOS_UI_CONTAINER_CLASS_NAME = "fbPhotoSnowlift";

/**
 * The class name of the <img> tag that actually contains the photo.
 * This element must be on the page exactly once.
 */
var FB_PHOTO_IMG_TAG_CLASS_NAME = "spotlight";

//-----------------------------------------------------------------------
// Global references to native facebook elements on the page.
//
// These items should be populated after setupStateFromFacebook() is 
// called.
//-----------------------------------------------------------------------
 /** The container for all of the carousel UI. */
var FB_PHOTOS_UI_CONTAINER;

/** The container that contains the photo. */
var FB_STAGE_CONTAINER; 

/** The button to click to advance the filmstrip. */
var FB_NEXT_BUTTON; 

//-----------------------------------------------------------------------
// Global constants for this script
//-----------------------------------------------------------------------
/** Unique identifier for the logging text area. */
var LOGGER_TEXT_AREA_ID = "fb_photo_scrape_log"; 

/** The time to wait between hitting the next button and downloading the next photo. Specified in MS. */
var WAIT_TIME = 1;

//-----------------------------------------------------------------------
// Global constants for this script. 
//
// These items should be populated after setupScriptState() is called.
//-----------------------------------------------------------------------
/** An event used to click an element on the page. */
var CLICK_EVENT; 

/** A reference to the JSZip variable which will include all the Zip files. */
var ZIP; 

/**
 * Entry point for script.
 *
 * This function sets up script state, then pages and downloads all functions with a completion
 * callback to zip the downloaded photos and download it. 
 */
function main() {
	// Setup initial state.
	setupStateFromFacebook();
	setupScriptState();
	
	// Log a hello message now that we're setup. 
	log("--------------------------------------");
	log("Welcome to Facebook Album Downloader");
	log("--------------------------------------");	
	log("Downloading all photos in this albums, hang tight as this might take a second...");

	// Get the initial URL, then advance the carousel once to get
	// to the next URL. Then call page through all photos in the
	// carousel until we get back to the original. 
	var initialFBID = extractFBIDFromURL(getCurrentPhotoURL());
	downloadPhotoAndPageUntilFBID(initialFBID, function() {
			log("All photos received, generating and downloading a .zip file.");
			generateAndDownloadZipWithCompletion(function() {
				log("All done. Your zip file should download shortly.");
			});
	});
}

//--------------------------------------------------
// Zipping functions
//--------------------------------------------------

/** Generates a zip file, downloads it to the user's computer and calls completion. */
function generateAndDownloadZipWithCompletion(completion) {
	ZIP.generateAsync({type:"blob"}).then(function(content) {
		saveAs(content, "fb_photos.zip");
		completion();
	});
}

//--------------------------------------------------
// Paging functions
//--------------------------------------------------

/** Advances the viewer one photo, then calls completion. */
function advanceViewerOnceWithCompletion(completion) {
	var startingPhotoURL = getCurrentPhotoURL();
	pressNext();	

	// Check if the viewer has successfully advanced.
	function checkIfAdvanced() {
		var potentiallyNewPhotoURL = getCurrentPhotoURL();
		// If there's no photo, call this function again in a bit to check again.
		if (potentiallyNewPhotoURL === startingPhotoURL) {
			setTimeout(checkIfAdvanced, WAIT_TIME);
		} else {
			completion();
		}		
	}

	setTimeout(checkIfAdvanced, WAIT_TIME);
}

/** Press the next button, wrapped in a function for naming and syntax simplicity. */
function pressNext() {
	FB_NEXT_BUTTON.dispatchEvent(CLICK_EVENT);
}

/**
 * Downloads the currently displayed photo, and press next to advance the carousel
 * until the given FBID is displayed.
 *
 * This function asynchronously calls itself to continue paging until it pages
 * to the given photo. It hthen calls completion. 
 *
 * Note: The order of events here is set such that the photo displayed when
 * this method is called is always downloaded, THEN the function pages, THEN
 * the new FBID is checked against the given endFBID.
 */
function downloadPhotoAndPageUntilFBID(endFBID, completion) {
	// Download the photo.
	downloadAndAddPhotoToZipWithCompletion(getCurrentPhotoURL(), function() {	
		// Advance the carousel once.
		advanceViewerOnceWithCompletion(function() {			
			// Check if the current FBID is the ending FBID.
			// If so, call completion and stop paging.
			var fbidOnScreen = extractFBIDFromURL(getCurrentPhotoURL());
			if (fbidOnScreen === endFBID) {
				log("All photos have been paged through.");
				completion();
				return;
			}
			
			// Call this function again to page until the endFBID is found.
			downloadPhotoAndPageUntilFBID(endFBID, completion);		
		});
	});
}

/**
 * Download and add the photo from the given URL to the zip.
 *
 * The file will be added to the zip with the format fbid_xxx.jpg, where xxx is
 * the unique FBID of the photo, extracted from the given URL.
 *
 * Note: For simplicity, the zip is a global variable, rather than passing an extra
 * parameter to every invocation of this method.
 */
function downloadAndAddPhotoToZipWithCompletion(photoURL, completion) {
	var downloadCompletion = function(photoData) {
		// If we didn't get photo data, re-invoke this method to try again.
		if (photoData) {
			var filename = "fbid_" + extractFBIDFromURL(photoURL) + ".jpg";			
			ZIP.file(filename, photoData);				
			completion();
		} else {
			setTimeout(downloadAndAddPhotoToZipWithCompletion, WAIT_TIME, photoURL, completion);
		}
	}
	
	downloadPhotoFromURL(photoURL, downloadCompletion);
}

/** 
 * Download a photo from the given URL.
 *
 * Photos are downloaded as base 64 encoded jpg files. Completion is called with
 * photo data, or null if an error occured.
 */
function downloadPhotoFromURL(photoURL, completion) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", photoURL);
	xhr.responseType = "arraybuffer";
	xhr.onload = function() {
		if (xhr.status === 200) {
			completion(xhr.response)
		} else {
			completion(null);
		}
	};
	xhr.send();
}

/**
 * Extracts a unique FBID from a given photo URL.
 *
 * The URL is expected to be in the format: 
 * https://<CDN Server>/v/t.AA.A-A/BBBB_FBID_CCCC_o.jpg?oh=DDDD&oe=EEEEE
 */
function extractFBIDFromURL(photoURL) {
	uuids = photoURL.split("_");
	if (uuids.length < 2) {
		log("[ERROR] Unexpected URL format to extract ID: " + photoURL);
		abortScript();
	}
	
	return uuids[1];
}

//--------------------------------------------------
// Common helper functions.
//--------------------------------------------------

/** 
 * Log an error to the JS console and to the UI console, if available. 
 */
function log(message) {
	// Log message to console.
	console.log("[PHOTO SCRAPE] " + message);	

	// Try to log to UI, send a warning message to the console if the
	// UI based logger can't be found.
	var logger = document.getElementById(LOGGER_TEXT_AREA_ID);
	if (logger) {
		logger.append(message + "\n");
	} else {
		console.log("[PHOTO SCRAPE] [WARNING]" + "Couldn't find a UI Logger.");			
	}
}

/**
 * Get the current photo URL of the image currently displayed.
 *
 * Aborts script if the correct elements are not found or are malformed.
 */
function getCurrentPhotoURL() {
	var imgElement;
	var imgElements = document.getElementsByClassName(FB_PHOTO_IMG_TAG_CLASS_NAME);
	if (imgElements.length == 1) {
		imgElement = imgElements[0];
	} else {
		log("[ERROR] Can't find the image element.");
		log("[ERROR] Aborting script.");
		abortScript();
	}

	var imageURL = imgElement.src;
	if (!imageURL) {
		log("[ERROR] Image element didn't have a src attribute.");
		log("[ERROR] Aborting script.")
		abortScript();
	}
	
	return imageURL;	
}

//--------------------------------------------------
// Setup helper functions.
//--------------------------------------------------

/** 
 * Throw a non-recoverable error and abort execution. This function is useful if
 * the script is unable to fail nicely because it doesn't any setup done.
 */
function throwSetupErrorAndAbort(errorMessage) {
	console.log("[PHOTO SCRAPE][ERROR] Invalid state. Try reloading the page.");
	console.log("[PHOTO SCRAPE][ERROR] " + errorMessage);
	console.log("[PHOTO SCRAPE][ERROR] Script Aborting");
	alert("Photo Scrape Error: " + errorMessage);
	abortScrape();
}

/**
 * Abort everything by throwing a generic error.
 */
function abortScrape() {
	throw new Error("Error with Photo scrape.");
}

/**
 * Setup state for elements provided on the page by Facebook. 
 * 
 * This function aborts the script if elements are not present as expected.
 */
function setupStateFromFacebook() {
	/** Setup the UI container. */
	var photoUIContainers = document.getElementsByClassName(FB_PHOTOS_UI_CONTAINER_CLASS_NAME);
	if (photoUIContainers.length == 1) {
		FB_PHOTOS_UI_CONTAINER = photoUIContainers[0];
	} else {
		throwSetupErrorAndAbort("Couldn't find a suitable photos UI container.");
	}

	/** Setup the stage container. */
	var stageContainers = document.getElementsByClassName(FB_STAGE_CONTAINER_CLASS_NAME);
	if (stageContainers.length == 1) {
		FB_STAGE_CONTAINER = stageContainers[0];
	} else {
		throwSetupErrorAndAbort("Couldn't find a suitable container for the stage.");
	}
	
	/** Setup next button. */
	var nextButtons = document.getElementsByClassName(FB_NEXT_BUTTON_CLASS_NAME);
	if (nextButtons.length == 1) {
		FB_NEXT_BUTTON = nextButtons[0];
	} else {
		throwSetupErrorAndAbort("Couldn't find a suitable next button.");
	}
}

/**
 * Setup state that the script needs. 
 *
 * This function assumes that setupStateFromFacebook() has been called to
 * populate facebook element references. This function aborts the script
 * if elements are not present as expected.
 */
function setupScriptState() {
	// Set up a logger UI for easy understanding of what's happening.
	var loggerDiv = document.createElement("div");
	loggerDiv.style = "width: 100%; height:100%; background: white";

	var loggerTextArea = document.createElement("textarea");
	loggerTextArea.style = "width: 90%; height: 90%; margin-top: 2%";
	loggerTextArea.id = LOGGER_TEXT_AREA_ID;	
	loggerTextArea.disabled = true;
	
	 loggerDiv.append(loggerTextArea);
	 FB_STAGE_CONTAINER.prepend(loggerDiv);
	 //FB_STAGE_CONTAINER.append(loggerDiv);


	// Set up a click event, used to click the next button to advance filmstrip.
	CLICK_EVENT = new MouseEvent("click", {
    	"view": window,
    	"bubbles": true,
    	"cancelable": false
	});
	
	// Create an empty zip.
	ZIP = new JSZip();
}

main();
