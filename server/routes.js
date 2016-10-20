/*
 Application routes
 For more information https://expressjs.com/en/guide/routing.html
 */
var express = require('express'),
    path    = require('path'),
    router  = express.Router();

// Application HAS to respond to GET /health with status 200 for OpenShift
// health monitoring
router.get('/health', function (req, res) {
  res.writeHead(200);
  res.end();
});

// For React-Router History, use * rather than / but other routes will no longer
// resolve
router.get('/', function (req, res) {
  res.sendFile(path.resolve('./front/www/index.html'));
});

// router.get('/testing', function (req, res, next) {
//   res.send('Hello test route');
// });

// router.get('/api/:id', function (req, res, next) {
//   res.json({
//     message: "This is not the API you're looking for",
//     id     : req.params.id
//   });
// });

module.exports = router;
