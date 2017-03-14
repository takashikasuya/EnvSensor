var setting={sensorNum:3, duration:2, min_datetime:9999999999999, max_datetime:0}
var sensors = new Object();

window.onload = function(){
	milkcocoa = new MilkCocoa.connectWithApiKey('teaix6xae7c.mlkcca.com', 'JKKHFNMFBCALOPDF', 'DchkjkhnbdajCfnEPlmeIWFSJBXNhYCDXPbKXiGk');
	ds = milkcocoa.dataStore('EnvData');
	ds.on('send', function() {
			// console.log('sendされました！');
			});
	ds.stream().size(24 * 6 * setting.sensorNum * setting.duration).next(function(err, data) {
			parse(data);

			//ヒートマップを描画する
			var domElement = document.getElementById("raw");
			var table = [];
			var tabletitle = [];
			var ti = 0;
			for (key in sensors) {
			table[ti] = "<table border=1>";
			table[ti] += "<tr><td>id</td>";
			for (keylist in sensors[key][0]) {
			table[ti] += "<td>" + keylist + "</td>";
			}
			table[ti] += "</tr>";
			console.log(sensors[key].length);
			for (var ski = sensors[key].length - 1; ski >= 0 ; ski--) {
			table[ti] += "<tr>";
			table[ti] += "<td>" + ski + "</td>";
			for (vlist in sensors[key][ski]) {
			if(vlist == "datetime"){
				var d = new Date(sensors[key][ski][vlist]);
				table[ti] += "<td>" + d + "</td>";
			}else if(vlist == "topic"){
				var t = sensors[key][ski][vlist].slice(-17);
				table[ti] += "<td>" + t + "</td>";
			}else{
				table[ti] += "<td>" + sensors[key][ski][vlist] + "</td>";
			}
			}
			table[ti] += "</tr>";
			}
			table[ti] += "</table>";
			tabletitle[ti] = sensors[key][1]["topic"];
			ti++;
			}
			var wholehtml = "";
			for(var tdi = 0; tdi < table.length; tdi++){
				wholehtml += "<h3>" + tabletitle[tdi] + "</h3>"; 
				wholehtml += table[tdi]; 
			}
			domElement.innerHTML = wholehtml;
	});
}

function parse(data) {
	for (var i = 0; i < data.length; i++) {
		var sensor = data[i].value;
		var topic = sensor.topic;
		var datetime = Date.parse(sensor.datetime);
		sensor.datetime = datetime;

		if (setting.min_datetime > datetime)
			setting.min_datetime = datetime;
		else if (setting.max_datetime < datetime)
			setting.max_datetime = datetime;

		if (sensors[topic] == undefined) {
			sensors[topic] = new Array();
		}
		sensors[topic].push(sensor);
	}
}

//noise値の期間内での平均を計算しsensorsの要素として追加する
function addNoiseAverage() {
	for (key in sensors) {
		console.log(sensors[key]);
		avesum = 0;
		for (var ti = 0; ti < sensors[key].length; ti++) {
			avesum += sensors[key][ti].noise;
		}
		console.log(avesum);
		console.log(sensors[key].length);
		average = avesum/sensors[key].length;
		sensors[key].noise_average = average;
	}
	console.log(sensors);
}

