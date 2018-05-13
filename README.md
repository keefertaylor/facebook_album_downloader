# Facebook Album Downloader

Automatically downloads albums of Photos from facebook.

This code automatically cycles through sets of photos in the 'Lightbox' UI on Facebook and downloads a .zip file of all photos. This
exposes no extra photos to the user, but instead automates the previously slow process (click next, right click > save as, click next, etc)
of collecting sets of photos off Facebook.

Generally, you can access the lightbox UI by clicking a photo on a user's profile or in your newsfeed on Facebook. The URL for these albums
will be something like `https://facebook.com/photo.php?fbid=XXX`.

# How to Use

You must be in a lightbox UI to use either the browser extension of the code. The Lightbox UI is a dark background behind photo, with next and previous buttons to advance one photo in either direction. A lightbox URL will look something like `https://facebook.com/photo.php?fbid=XXX'.

## Chrome Extension

You can build a Chrome extension for local use by running `compile_chrome_extension.sh`.

## Browser Console

You can build a compiled version of this script (including dependencies) by running `compile_script.sh`. The
resulting file can be copy and pasted into your browser console.

# About

## Motivation

Facebook doesn't provide useful out of the box functionality to download tagged photos of yourself. If/when the owner of these photos
deletes their Facebook, all your photos and memories disappear with it.

## Privacy Considerations

This code only lets you download photos which you already could via your browser yourself. In addition, it processes all photos on your
computer, so no one else can see your photos.

## Browser Compatibility

Tested and works in Chrome 55, as well as includes packaged Chrome Extension.

Not tested and results may vary on other browsers, but there's nothing inherently impossible to do
in your browser of choice.

## Notes

* This code does not attempt to handle videos, it will only download photos.
* The downloaded photos will have a filename in the format of FBID_xxx.jpg, where XXX to the unique FBID of the photo. You can see the photo by navigating to `https://facebook.com/photo.php?fbid=XXX`.

# Licenses

## Facebook Album Downloader

This software is licensed under XXX. Source code for this script is included in the `srcs` directory.

## JSZip
This software depends on the JSZip library, licensed under MIT/GPLv3. JSZip is included in
the `libs` directory.

See: https://stuk.github.io/jszip/

## FileSaver
This software depends on the FileSaver library, licensed under MIT. JSZip is included in
the `libs` directory.

See: https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
