# Gulliver

A PWA Directory example.

## Requirements
1. [NodeJS](https://nodejs.org). 
2. [Google Cloud SDK](https://cloud.google.com/sdk/)
3. A project on the [Google Cloud Console](https://console.cloud.google.com/).

## Installation

1. Fork the repository.
2. Clone the repository on your computer.
3. Run `gcloud init` and follow the on-screen instructions. 
4. Run `npm i` to install dependencies.
5. Start the project with `npm start`

Summary:

```shell
$ git clone https://github.com/GoogleChrome/gulliver.git
$ cd gulliver
$ gcloud init
$ npm i
$ npm start
```
For this to work, `gcloud` must be configured to point to a project you have the appropriate access to. Otherwise, the app will fail with a mysterious `Error: Not authorized.` error message. To check this, run `gcloud info`. If an unexpected account and project are listed, fix via `gcloud init` and choose the `Re-initialize this configuration [default] with new settings` option.

## License

See [LICENSE](./LICENSE) for more.

This is not a Google product.

