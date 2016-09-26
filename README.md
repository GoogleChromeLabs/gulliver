# Gulliver

The Gulliver project, hosted [here](https://pwa-directory.appspot.com/), provides a directoy of existing Progressive Web Apps (PWAs). 

![Screenshot](img/pwa-directory-snapshot.png)

## Requirements

The following components are required to run the project:

1. [NodeJS](https://nodejs.org). 
1. [Google Cloud SDK](https://cloud.google.com/sdk/)
1. A [Google Cloud Console](https://console.cloud.google.com/) project.
1. Memcached installed and running on localhost:11211. [Installation instructions](https://cloud.google.com/appengine/docs/flexible/nodejs/caching-application-data).

## Installation

1. Clone this GitHub repository on your computer.

```
$ git clone https://github.com/GoogleChrome/gulliver.git
```

2. ```cd gulliver```

2. Edit the [`config/config.json`](config/config.json) file to contain the
information appropriate to your project. Alternatively, you can set environment variables corresponding to those defined in this file.

3. Run `gcloud init` to setup your project.
4. Run `npm i` to install the dependencies declared in `package.json`
5. Run `npm start` to start the project; the default port used is `8080` but
   you can specify another port by running `PORT=<your-port> npm start`
6. Hit the URL `localhost:8080` or `localhost:<your-port>`

## Running Tests

1. `npm test` to run lint + tests + coverage report.
2. `npm run mocha` to run all the tests only.
3. `npm run coverage` to run tests + coverage report.

## License

See [LICENSE](./LICENSE) for more.

This is not a Google product.
