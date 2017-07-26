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

/etc/init.d/dbus start
/etc/init.d/xvfb start
sleep 1s

export DISPLAY=:1
TMP_PROFILE_DIR=$(mktemp -d -t lighthouse.XXXXXXXXXX)

su chromeuser
source /chromeuser-script.sh
sleep 3s

node /server.js
