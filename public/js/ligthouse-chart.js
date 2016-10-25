const chartElementId = 'chart';

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
  makeRequest('GET', '/chart.json')
  .then(jsonData => {
    // Create our data table out of JSON data loaded from server.
    let data = new google.visualization.DataTable(jsonData);
    // Instantiate and draw our chart, passing in some options.
    const chart = new google.visualization.AnnotationChart(document.getElementById(chartElementId));
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

if (document.getElementById(chartElementId)) {
  google.charts.load('current', {packages: ['annotationchart']});
  google.charts.setOnLoadCallback(drawChart);
}
