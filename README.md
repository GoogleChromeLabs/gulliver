# Gulliver

A PWA Directory example.

## Requirements

1. [NodeJS](https://nodejs.org). 
1. [Google Cloud SDK](https://cloud.google.com/sdk/)
1. A [Google Cloud Console](https://console.cloud.google.com/) project.
1. Memcached installed and running on localhost:11211. [Installation instructions](https://cloud.google.com/appengine/docs/flexible/nodejs/caching-application-data).

## Installation

1. Clone the repository on your computer.
1. Edit [`config/config.json`](config/config.json) as appropriate. (Or set environment variables.)
    * Run `gcloud init` to setup your project if necessary.
1. Run `npm i` to install dependencies.
1. Start the project with `npm start`.

Summary:

```shell
$ git clone https://github.com/GoogleChrome/gulliver.git
$ cd gulliver
$ gcloud init
$ npm i
$ npm start
```

## Running Tests

1. `npm test` to run lint + tests + coverage report.
2. `npm run mocha` to run all the tests only.
3. `npm run coverage` to run tests + coverage report.

## License

See [LICENSE](./LICENSE) for more.

This is not a Google product.
