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

const os = require('os');

// Create function to get CPU information
function cpuAverage() {
  // Initialise sum of idle and time of cores and fetch CPU info
  let totalIdle = 0;
  let totalTick = 0;
  let cpus = os.cpus();

  // Loop through CPU cores
  for (let i = 0, len = cpus.length; i < len; i++) {
    // Select CPU core
    let cpu = cpus[i];

    // Total up the time in the cores tick
    // eslint-disable-next-line guard-for-in
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }

    // Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }

  // Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length, total: totalTick / cpus.length};
}

module.exports = (avgTime, callback) => {
  this.samples = [];
  this.samples[1] = cpuAverage();
  this.refresh = setInterval(() => {
    this.samples[0] = this.samples[1];
    this.samples[1] = cpuAverage();
    let totalDiff = this.samples[1].total - this.samples[0].total;
    let idleDiff = this.samples[1].idle - this.samples[0].idle;
    callback(1 - idleDiff / totalDiff);
  }, avgTime);
};
