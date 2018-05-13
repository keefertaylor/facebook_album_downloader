# This script builds a single javascript file containing all
# needed JS code for the album downloader.
#
# Unfortunately, order matters in this script. The packaged version of
# JSZip needs to be loaded before the script begins running, and it's
# unclear what package management system JSZip is using, and why it 
# defers defining function names.
# TODO: Investigate and fix this. 
#
# Usage:
# compile_script.sh <optional output file>

#!/bin/bash

# Errors are failures
set -e

DEFAULT_OUTPUT_FILE="compiled_album_downloader.js"

function log {
	echo "[compile_script.sh] $1"
}

function addScriptToOutput {
	javascript_file=$1
	output_file=$2
	
	log "Adding $javascript_file to $output_file"
		
	echo "//------------------------------" >> "$output_file"
	echo "// Automatically compiled from: " >> "$output_file"
	echo "//    $javascript_file" >> "$output_file"
	echo "//------------------------------" >> "$output_file"
	cat "$javascript_file" >> "$output_file"
	echo "" >> $output_file
}


function main {
	log "Compiling Album Downloader"

	# Determine whether an output file was specified or not.
	output_file="$DEFAULT_OUTPUT_FILE"
	if [ -z "$1" ] ; then
	    log "No output file specified, using default output file: $DEFAULT_OUTPUT_FILE"
	else
		output_file=$1
	fi
	
	# Remove stale output or touch a new file.
	if [ -f "$output_file" ] ; then
		log "Removing stale $output_file"
    	rm "$output_file"
	else	
		touch "$output_file"
	fi

	# Note: Order matters, see comment at top of file.
	addScriptToOutput "lib/FileSaver.js" "$output_file"
	addScriptToOutput "lib/jszip.js" "$output_file"
	addScriptToOutput "srcs/album_download.js" "$output_file"

	log "All done. Compiled javascript output to: $output_file"
}

main $1
