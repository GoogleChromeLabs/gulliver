# Lighthouse machine
A Docker image to run [Lighthouse](https://github.com/GoogleChrome/lighthouse) scores on a server

## Build the image
```bash
docker build --no-cache -t lighthouse_machine .
```

## Run the container
```bash
# Run a new container
docker run -d -p 8080:8080 --cap-add=SYS_ADMIN lighthouse_machine
```

## Usage
```bash
curl -X GET 'http://localhost:8080?format=${format}&url=${url}'
```

where `format`is one of `json`, `html` (see [cli-options](https://github.com/GoogleChrome/lighthouse#cli-options) for more information)

## License
See [LICENSE](./LICENSE) for more.

## Disclaimer
This is not a Google product.
