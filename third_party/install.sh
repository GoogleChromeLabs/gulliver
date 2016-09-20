#!/usr/bin/env sh

# Downloads and patches the two files from lighthouse and devtools that we need
# to validate manifests.
#
# (These files are part of lighthouse, but depending on lighthouse would haul in
# multiple MBs of dependencies. So, we'll just dump the files here.)

curl https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/lib/web-inspector.js
curl https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/common/Color.js

# Generate patch via `git diff manifest-parser.js Color.js`
git patch - << END
diff --git i/third_party/manifest-parser.js w/third_party/manifest-parser.js
index 5ac9d72..b9e7ead 100644
--- i/third_party/manifest-parser.js
+++ w/third_party/manifest-parser.js
@@ -17,7 +17,10 @@
 'use strict';

 const url = require('url');
-const validateColor = require('./web-inspector').Color.parse;
+
+global.WebInspector = {}; // the global is unfortunate, but necessary
+require('./Color.js');
+const validateColor = global.WebInspector.Color.parse;

 const ALLOWED_DISPLAY_VALUES = [
   'fullscreen',
END
