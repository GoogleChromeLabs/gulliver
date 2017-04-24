# https://github.com/GoogleCloudPlatform/nodejs-docker
FROM launcher.gcr.io/google/nodejs

# Install memcached
RUN apt-get update
RUN apt-get -y install memcached

# Copy application code.
COPY . /app/

# Install node dependencies.
RUN npm --unsafe-perm install

CMD service memcached start && npm start
