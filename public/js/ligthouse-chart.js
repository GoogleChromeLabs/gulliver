const CHART_ELEMENT_ID = 'chart';
const CHART_BASE_URL = '/api/lighthouse-graph/';

function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

function drawChart() {
  const chartDiv = document.getElementById(CHART_ELEMENT_ID);
  const pwaId = chartDiv.getAttribute("pwa");
  console.log(pwaId);
  if (pwaId) {
    makeRequest('GET', CHART_BASE_URL + pwaId)
    .then(jsonData => {
      // Create our data table out of JSON data loaded from server.
      const data = new google.visualization.DataTable(jsonData);
      const chart = new google.visualization.AnnotationChart(document.getElementById(CHART_ELEMENT_ID));
      const options = {
        height: 242,
        displayAnnotations: false,
        displayRangeSelector: false,
        legendPosition: 'newRow',
        thickness: 2,
        min: 0,
        max: 100
      };
      chart.draw(data, options);
    })
    .catch(err => {
      console.error('There was an error drawing the chart!', err);
    });
  }
}

if (document.getElementById(CHART_ELEMENT_ID)) {
  google.charts.load('current', {packages: ['annotationchart']});
  google.charts.setOnLoadCallback(drawChart);
}
