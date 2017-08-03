/**
 * Copyright 2016-2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const exec = require('child_process').exec;
const http = require('http');
const https = require('https');
const fs = require('fs');
const cpuMonitor = require('./cpu_monitor');

// Chrome panick
let chromePanick = false;

// CPU monitoring
let cpuPoints = new Array(5);
let cpuAlert = false;

cpuMonitor(60000, load => {
  // Add new measurements to the cpuPoints array
  cpuPoints.pop();
  cpuPoints.unshift(load);

  // Calculate the avg and spread of the cpuPoints array
  let sum = 0;
  let i = 5;
  while (i--) sum += cpuPoints[i];
  let avg = sum / 5;
  let spread = Math.max.apply(Math, cpuPoints) - Math.min.apply(Math, cpuPoints);

  // If the CPU load is above 80% and the spread is less than 10%, trigger an alert
  cpuAlert = (avg > 0.8 && spread < 0.1);
  cpuAlert && console.log(`Average: ${avg}, Spread: ${spread}`);
});

// Constants
const HTTP_PORT = 8080;
const HTTPS_PORT = 8443;

// HTTPS options
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// App
const app = express();
let isBusy = false;

// Main endpoint
app.get('/', (req, res) => {
  if (isBusy) {
    res.sendStatus(503);
  } else {
    isBusy = true;
    try {
      exec(
        `node lighthouse-cli --port 9222 --output-path=../report.${req.query.format}\
        --output=${req.query.format} ${req.query.url}`,
        {
          cwd: '/lighthouse',
          timeout: 500000,
        },
        error => {
          if (error !== null) {
            console.log(`exec error: ${error}`);

            // This is for when Chrome crashes and Lighthouse is unable to reconnect
            // to an appropriate instance of Chrome
            if (error.message.includes('Unable to connect')) {
              chromePanick = true;
            }
          }

          isBusy = false;
          res.sendFile(`/report.${req.query.format}`);
        }
      );
    } catch (e) {
      isBusy = false;
      res.status(500).send(e);
    }
  }
});

// Auto-healing endpoint
app.get('/_ah/health', (req, res) => {
  // If we have a Chrome panick send a 500
  if (chromePanick) {
    res.sendStatus(500);
  }

  // if we have a CPU alert send a 500, otherwise send a 200
  else if (cpuAlert) {
    res.sendStatus(500);
  } else {
    res.sendStatus(200);
  }
});

http.createServer(app).listen(HTTP_PORT);
https.createServer(options, app).listen(HTTPS_PORT);

console.log(
  `Running on https://localhost:${HTTPS_PORT} and http://localhost:${HTTP_PORT}`
);
