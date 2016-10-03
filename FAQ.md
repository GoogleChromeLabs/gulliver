# PWA Directory FAQ

### What is PWA Directory?
Is an open source directory of Progressive Web Apps driven by user submissions. 

### What are the goals of this project?
Its goals are to help developers discover new PWAs, build a good example of a Server-Side Rendered PWA and share what we learn during the developing process.

### Is this a Google product?
No, it was built by the Google Developer Relations team as an example for the Web developer community.

### How does it rank PWAs?
We use [Lighthouse](https://github.com/GoogleChrome/lighthouse), that runs a set of checks validating the existence of the features, 
capabilities, and performance that should characterize a PWA.

### Why is my Lighthouse score different from the Lighthouse Chrome Extension?
It is important to highlight that we use a version of Lighthouse built on [Headless Chromium](https://chromium.googlesource.com/chromium/src/+/master/headless/README.md) which enables it to run as a server app, for that reason our Lighthouse score and report may deviate from the standard Lighthouse Chrome extension.

### Why are you using Server Side Rendering?
We found that there are not that many examples of PWAs using Server Side Rendering and that many developers would benefit from one.

### What technologies did you use?
*Backend*
 - [Node.js](https://nodejs.org/en/) 
 - [Express.js](http://expressjs.com/)
 - [Handlebars](http://handlebarsjs.com/)
 - [Google App Engine Node.js Flexible Environment](https://cloud.google.com/appengine/docs/flexible/nodejs/)

*Frontend*
 - JavaScript (vanilla)
 - [Service Worker Precache](https://github.com/GoogleChrome/sw-precache)
 - [Service Worker Toolbox](https://github.com/GoogleChrome/sw-toolbox)

*Storage*
 - [Google Cloud Datastore](https://cloud.google.com/datastore/) for general data
 - [Google Cloud Storage](https://cloud.google.com/storage/) for images only

### Why are you using Javascript without a framework?
There is a good variety of JS frameworks out there and we love them, however we did not want to add extra overhead to developers that have not used the framework of our choice.

### What do you plan for the near future?
We started with a basic example that we want to improve over time, our plan is to release a series of posts explaining in detail the discrete progressive enhancements from this basic Website to a high performing PWA.

Beyond that, we want to track the evolution of all the PWAs submitted over time by running Lighthouse weekly, include newer metrics and features that will help developers test and build better PWAs.

###Why didn’t you just collaborate with other existing PWA directories?
We wanted to start from scratch with a Server Side rendered solution and progressively add PWA functionalities to learn more about the process and document all the steps.

### How do I request features or submit bugs?

Please submit them directly in our [GitHub issues section](https://github.com/GoogleChrome/gulliver/issues).
