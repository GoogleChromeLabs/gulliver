# Lighthouse machine
A Docker image to run [Lighthouse](https://github.com/GoogleChrome/lighthouse) scores on a server

## Build the image
```bash
docker build --no-cache -t lighthouse_machine .
```

## Run the container
```bash
# Run a new container
docker run -d -p 8080:8080 -p 8443:8443 --cap-add=SYS_ADMIN lighthouse_machine
```

## Usage
```bash
curl -X GET 'http://localhost:8080?format=${format}&url=${url}'
```

or

```bash
curl -X GET 'https://localhost:8443?format=${format}&url=${url}' --insecure
```

where `format`is one of `json`, `html` (see [cli-options](https://github.com/GoogleChrome/lighthouse#cli-options) for more information)

## FAQ

Q: I get an "Empty response" from the server. What's happening?

A: Either you have a conflict on one of the mapped ports, or a network issue with your container. If the former, just change the mapped port to a different number, e.g. -p 8081:8080

## License
See [LICENSE](./LICENSE) for more.

## Disclaimer
This is not a Google product.
