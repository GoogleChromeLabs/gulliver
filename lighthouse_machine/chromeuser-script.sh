#!/bin/bash

# Copyright 2016-2017, Google, Inc.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

sudo chown -R chromeuser:chromeuser $TMP_PROFILE_DIR
export DISPLAY=:0
Xvfb :0 -screen 0 1024x768x24 &
nohup google-chrome --no-first-run --disable-gpu --no-sandbox --user-data-dir=$TMP_PROFILE_DIR --remote-debugging-port=9222 'about:blank' &
