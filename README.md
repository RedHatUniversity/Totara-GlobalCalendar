# Totara Global Calendar

The F2F calendar in Totara is a few user experience limitations. We created this application to display a more user friendly and visually rich view of the data. It loads the course catalog and all F2F sessions to display in a familiar calendar view.

Contact: Matt Perkins, mperkins@redhat.com


## Dev notes

This is a React application using Babel and Webpack beta 2. Target deployment host is Red Hat internal OSE. Build project files are copied to a separate project and published from there.

### Setup

- React
    - React Router
    - Autobind Decorator
    - React Mixin
    - React Catalyst
- JavaScript
    - Babel: Stage-0, Es2015 loose, React
    - ESLint
    - Modernizer
    - polyfill.io
- CSS
    - Normalize.css from github.com/necolas/normalize.css
    - SASS indented
    - PostCSS: autoprefixer

Static assets for the front end are `front/www/*` and all app development files are located in `front/app/*`.
On build, the `front/www/js/app` directory is cleaned and new code is bundled there. 

JS Entry point is `front/app/index.js`
SASS is `front/app/index.sass`

### Build options

`npm run dev` to start the webpack-dev-server with hot reloading at localhost:3000. Will also open the default browser to the site.
`npm run build:prod` to clean and create a production build of the app
`npm start` will start an Express web server at localhost:8080

View package.json for all of them.

### Notes

- When the application start, it will try to load ./front/www/config.json for special configuration options for the running app. If there is a problem, a warning will appear in the log and the app will try to run normally.
- Webpack-dev-server runs with --history-api-fallback to enabled React-Router routes to work for an SPA.