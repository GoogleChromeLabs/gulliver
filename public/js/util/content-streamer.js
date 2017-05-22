/*!
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/* eslint-env browser */

/**
 * Implements hack to stream content from a URL as the content of an element.
 * More info on https://jakearchibald.com/2016/fun-hacks-faster-content/.
 */
export default class ContentStreamer {
  _streamResponse(iframe, reader, decoder) {
    return reader.read()
      .then(result => {
        const partial = decoder.decode(result.value || new Uint8Array(), {stream: !result.done});
        iframe.contentDocument.write(partial);
        if (!result.done) {
          return this._streamResponse(iframe, reader, decoder);
        }
        return true;
      });
  }

  stream(targetContainer, sourceUrl) {
    return new Promise((resolve, reject) => {
      targetContainer.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      targetContainer.appendChild(iframe);
      iframe.onload = () => {
        iframe.onload = null;
        iframe.contentDocument.write('<streaming-element>');
        const streamingElement = iframe.contentDocument.querySelector('streaming-element');
        targetContainer.appendChild(streamingElement);
        fetch(sourceUrl)
            .then(response => {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              this._streamResponse(iframe, reader, decoder)
                .then(() => {
                  iframe.contentDocument.write('</streaming-element>');
                  iframe.contentDocument.close();
                  resolve(true);
                });
            });
      };
      iframe.src = '';
    });
  }
}
