# Only supports OSX, sorry!
# TODO(keefer): Document arguments

# Path to Chrome.
CHROME_PATH="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"

# Path to Chrome Extension root.
CHROME_EXTENSION_ROOT="./chrome_extension/"

# Where to place the compiled output script
COMPILED_SCRIPT_OUTPUT_DIR="generated/"
COMPILED_SCRIPT_NAME="compiled_album_downloader.js"

function log {
	echo "[compile_chrome_extension] $1"
}

# Compile the javascript needed for the chrome extension.
function compile_js_script {
	log "Compiling javascript code"

	# Create the output directory needed for the output
	# file, if it doesn't already exist.
	if [ ! -d "$CHROME_EXTENSION_ROOT$COMPILED_SCRIPT_OUTPUT_DIR" ]; then
		log "Creating $CHROME_EXTENSION_ROOT$COMPILED_SCRIPT_OUTPUT_DIR"
		mkdir "$CHROME_EXTENSION_ROOT$COMPILED_SCRIPT_OUTPUT_DIR"
	fi
	
	# Compile the script to the output location.
	./compile_script.sh "$CHROME_EXTENSION_ROOT$COMPILED_SCRIPT_PATH$COMPILED_SCRIPT_NAME"
}

function pack_extension {
	log "Packing extension"
	"$CHROME_PATH --pack-extension=$CHROME_EXTENSION_ROOT"
}

function main {
	log "Compiling Album Downloader Chrome Extension"
	
	compile_js_script
	pack_extension

	log "Extension packed."
}

main 