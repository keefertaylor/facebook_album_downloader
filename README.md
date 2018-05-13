# Facebook Album Downloader

Facebook provides a powerful service to aggregate photos of yourself via tagged photos. While Facebook provides functionality to download photos that you have uploaded to the site, it does not provide a useful out-of-the-box function to download photos of yourself that others have uploaded.

Tagged photos of yourself could be removed from the website when the user deletes them, updates their photo privacy settings or if/when they delete their account. This javascript utility allows you to preserve these photos by downloading them to your local computer before they get lost, forgotten and / or accidentally deleted.

This project is intended primarily to download tagged photos of yourself but should work on any Facebook photo album. The code automatically cycles through sets of photos in the 'Lightbox' UI on Facebook and downloads a .zip file of all photos. This
exposes no extra photos to the user, but instead automates the previously slow process (click next, right click > save as, click next, etc)
of collecting sets of photos off Facebook.

Generally, you can access the lightbox UI by clicking a photo on a user's profile or in your newsfeed on Facebook. The URL for these albums
will be something like `https://facebook.com/photo.php?fbid=XXX`.

# How to Use

You must be in a lightbox UI to use either the browser extension of the code. The Lightbox UI is a dark background behind photo, with next and previous buttons to advance one photo in either direction. A lightbox URL will look something like `https://facebook.com/photo.php?fbid=XXX`.

## Chrome Extension

You can build a Chrome extension for local use by running `compile_chrome_extension.sh`.

## Browser Console

You can build a compiled version of this script (including dependencies) by running `compile_script.sh`. The
resulting file can be copy and pasted into your browser console.

# Limitations

## Photos Only

This code does not attempt to handle videos, it will only download photos.

## Browser Compatibility

Tested and works in Chrome 55, as well as includes packaged Chrome Extension.

Not tested and results may vary on other browsers, but there's nothing inherently impossible to do
in your browser of choice.

# Notes

## Finding a Photos Source Online

The downloaded photos will have a filename in the format of FBID_xxx.jpg, where XXX to the unique FBID of the photo. You can see the photo by navigating to `https://facebook.com/photo.php?fbid=XXX`

## Privacy Considerations

This code only lets you download photos which you already could via your browser yourself. In addition, it processes all photos on your
computer, so no one else can see your photos.

# Contributing

This code is inherently fragile. Pull requests to keep it up to date will be happily accepted.

# License

This project is licensed under the MIT License. See LICENSE.MD.

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
