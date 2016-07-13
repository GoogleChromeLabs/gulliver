# Guilliver

A PWA Directory example.

## Instalation

1. Fork the repository.
2. Install [NodeJS](https://nodejs.org).
3. Setup the repository.

```none
$ git clone https://github.com/GoogleChrome/gulliver.git
$ cd gulliver
$ npm i
$ npm start
```

For this to work, `gcloud` must be configured to point to a project you have the appropriate access to. Otherwise, the app will fail with a mysterious `Error: Not authorized.` error message. To check this, run `gcloud info`. If an unexpected account and project are listed, fix via `gcloud auth login` and/or `gcloud config set project [projectid]`.

## License

See [LICENSE](./LICENSE) for more.

This is not a Google product.

