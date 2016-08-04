# Gulliver

A PWA Directory example.

## Requirements
1. [NodeJS](https://nodejs.org). 
2. [Google Cloud SDK](https://cloud.google.com/sdk/)
3. A project on the [Google Cloud Console](https://console.cloud.google.com/).

## Installation

1. Clone the repository on your computer.
2. Run `gcloud init` and follow the on-screen instructions. 
3. Run `npm i` to install dependencies.
4. Start the project with `npm start`

Summary:

```shell
$ git clone https://github.com/GoogleChrome/gulliver.git
$ cd gulliver
$ gcloud init
$ npm i
$ npm start
```

## Running Tests

1. `./node_modules/.bin/mocha test/**/*.js` to run all tests.
2. `./node_modules/.bin/istanbul cover _mocha test/**/*.js` for test coverage report.

## License

See [LICENSE](./LICENSE) for more.

This is not a Google product.

