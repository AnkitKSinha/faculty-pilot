var express = require('express');
var router = express.Router();
var fs = require("fs");
var hbs = require('hbs');

hbs.registerHelper('parseInt', function(str) {
    return Number(str);
});


/* GET home page. */
router.get('/', function(req, res, next) {
	fs.readFile("lib/scrapedData.json", (err, data)=>{
		data = JSON.parse(data);
		console.log(data);
		res.render('index', { title: 'Faculty | Scibase', faculty : data });
	});
  
});

module.exports = router;
