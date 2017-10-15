var cheerio = require("cheerio");
var request = require("request");
// var sheets = require("xlsx");
var fs = require("fs");
var async = require("async");


var papa = require("papaparse");


var startScrape = function(){
	var stream = fs.createReadStream("lib/scholarLinks.csv");
	papa.parse(stream, {
		delimeter : ",",
		header : true,
		complete : function(result, file){

			scrape(result.data);

		},
		error : function(error, file){
			console.log(error);
		}
	});
}

var temp = function(data){
	async.eachSeries(data, function(d, cb){
		console.log(d);
		cb();
	}, function(err){
		if(err) console.log(err);
		else console.log("Printing done");

	});
}

var findRGScore = function(link, item, data){
	request(link, function(err, res, html){
		if(err){
			console.log(err);
			item["rg_score"] = 0;
		}else{
			var $ = cheerio.load(html);
			var score = $(".score-link").first().text();
			item["rg_score"] = Number(score);
			// console.log("\n\n\nAfter Here for " + u.name + "\n\n\n");
			// console.log("Pushing : " + JSON.stringify(item));
			
		}
		console.log("Pushing item " + JSON.stringify(item));
		data.push(item);		
	});
}
var scrape = function(data){
	var sortBy = "&view_op=list_works&sortby=pubdate";
	var pageSize = "&cstart=0&pagesize=200";

	var scrapedData = [];

	var i=0;
	async.eachSeries(data, function(u, cb){
		i++;
		if(i==data.length){
			console.log(scrapedData);
			scrapedData = JSON.stringify(scrapedData);
			fs.writeFile("scrapedData.json", scrapedData, (err)=>{
				if(err) throw err;
			});
			console.log("Success");
			return;
		}
		item = {}
		url = u.link + sortBy + pageSize;
		request(url, function(err, res, html){
			if(err){
				item["name"] = u.name;
				item["url"] = "";
				item["citations"] = 0;
				item["hindex"] = 0;
				item["i10index"] = 0;
				item["pubcount"] = 0;
				request(u.rg_profile, function(err, res, html){
					if(err){
						console.log(err);
						item["rg_score"] = 0;
					}else{
						var $ = cheerio.load(html);
						var score = $(".score-link").first().text();
						item["rg_score"] = Number(score);
						// console.log("\n\n\nAfter Here for " + u.name + "\n\n\n");
						// console.log("Pushing : " + JSON.stringify(item));	
					}
					console.log("Pushing item " + JSON.stringify(item));
					scrapedData.push(item);	
					cb();	
				});

			}else{
				var $ = cheerio.load(html);
				item["name"] = u.name;
				item["url"] = u.link;
				var citations = $("#gsc_rsb_st>tbody").children().eq(0).children().eq(2).text();
				var hIndex = $("#gsc_rsb_st>tbody").children().eq(1).children().eq(2).text();
				var i10Index = $("#gsc_rsb_st>tbody").children().eq(2).children().eq(2).text();
				
				var last5Year = $("#gsc_rsb_st>thead").children().eq(0).children().eq(2).text();
				last5Year = last5Year.substr(5);
				last5Year = parseInt(last5Year);

				var count = 0;
				var pubs = "title,authors,journal,year\n";
				$(".gsc_a_tr").each(function(i, elem){
					var yearElem = $(this).children().eq(2).children().eq(0).text();
					if( yearElem != "Year"){
						if(parseInt(yearElem) < last5Year){
							return false;
						}else{
							
							pubs+=($(this).children().first().children().first().text()).replace(/,/g, "<comma>");
							pubs+=",";
							var aut = "";
							aut+=$(this).children().first().children().eq(1).text();
							console.log(aut);
							pubs+=aut.replace(/,/g,"<comma>");
							pubs+=",";
							pubs+=($(this).children().first().children().eq(2).text()).replace(/,/g, "<comma>");
							pubs+=",";
							pubs+=yearElem;
							pubs+="\n";

							count++;
						}
					}
				});

				fs.writeFile("public/publications/"+item["name"]+".csv", pubs, err=>{
					if(err) throw err;
					else console.log("Done writing");
				});

				item["citations"] = parseInt(citations);
				item["hindex"] = Number(hIndex);
				item["i10index"] = Number(i10Index);
				item["pubcount"] = count;
				item["puburl"] = "/publications/"+item["name"]+".csv";
				request(u.rg_profile, function(err, res, html){
					if(err){
						console.log(err);
						item["rg_score"] = 0;
					}else{
						var $ = cheerio.load(html);
						var score = $(".score-link").first().text();
						item["rg_score"] = Number(score);
						// console.log("\n\n\nAfter Here for " + u.name + "\n\n\n");
						// console.log("Pushing : " + JSON.stringify(item));
						
					}
					console.log("Pushing item " + JSON.stringify(item));
					scrapedData.push(item);		
					cb();
				});
				console.log("Request Ending");
				
			}
			
			
		});

	}, function(error){
		console.log("\n\n\nHere");
		if(error){
			console.log(error);
		}else{
			console.log(scrapedData);
			scrapedData = JSON.stringify(scrapedData);
			fs.writeFile("lib/scrapedData.json", scrapedData, (err)=>{
				if(err) throw err;
			});
			console.log("Success");
		}
	});

}


module.exports = {};
module.exports.startScrape = startScrape;
module.exports.test = function(){
	console.log("Hello Module");
}
// var url = ["https://scholar.google.com/citations?user=PHrvjXAAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=_LU6ZvIAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=4LnvjxIAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=5gTBHC8AAAAJ&hl=en",
// "https://scholar.google.com/citations?user=9p7Uw-wAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=f3fSQUsAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=GXW-Kk0AAAAJ&hl=en",
// "https://scholar.google.com/citations?user=HHZ20acAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=I8z4aR4AAAAJ&hl=en",
// "https://scholar.google.com/citations?user=iaW5VSMAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=m962Wd4AAAAJ&hl=en",
// "https://scholar.google.com/citations?user=ObqOUbEAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=pXktmaUAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=TE8UmNEAAAAJ&hl=en",
// "https://scholar.google.com/citations?user=zV3vrfAAAAAJ&hl=en"];



