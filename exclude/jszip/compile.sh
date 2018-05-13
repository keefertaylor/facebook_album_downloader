# This script attempts to generate a single version of JSZip.
#
# This shouldn't be necessary, but the package management systems
# for JS don't make sense to me (and I don't understand why you'd
# even need them </rant>)

#!/bin/bash

set -e

OUTPUT_FILE="jszip_compiled.js";

function log {
	echo "[Compile JSZip] $1"
}

function compilePath {
	path=$1
	
	log "Processing directory: $path"
	
	# Iterate over each JS File
	for javascript_file in $path; do	
		echo "//------------------------------" >> "$OUTPUT_FILE"
		echo "// Automatically compiled from: " >> "$OUTPUT_FILE"
		echo "//    $javascript_file" >> "$OUTPUT_FILE"
		echo "//------------------------------" >> "$OUTPUT_FILE"
		cat "$javascript_file" >> "$OUTPUT_FILE"
		echo "" >> $OUTPUT_FILE
	done	
}

function main {
	log "Compiling JSZip."
	
	# Remove stale output or touch a new file.
	if [ -f "$OUTPUT_FILE" ] ; then
		log "Removing stale $OUTPUT_FILE"
    	rm "$OUTPUT_FILE"
	else	
		touch "$OUTPUT_FILE"
	fi

	compilePath "lib/*.js"
	compilePath "lib/generate/*.js"
	compilePath "lib/nodejs/*.js"
	compilePath "lib/reader/*.js"
	compilePath "lib/stream/*.js"

	log "All Done."	
}

main