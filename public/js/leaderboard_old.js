// JavaScript Document

var width = 960,
    height = 750,
    radius = Math.min(width, height) / 2;
	
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

	type  = 0;		
	percent = d3.format("%")
		
	var element = svg.selectAll("g myCircleText").data(rank);
	
    var elemEnter = element.enter()
	    .append("rect")
			.attr("x", function(d){return 70}) //initial x displacement of each column
			.attr("y", function(d,i){return i*30 + 0})  //initial y displacement of each row
			.attr("width", 660) //width of column
			.attr("height", 30) //height of row
			.attr("rx", 0) //rounds out corners
			.attr("ry", 0)
			.attr("stroke", "white")
			.attr("fill", function(d,i){return i%2 == 1 ? "white" : "rgb(230,230,230)"});
			
	var text = element.enter().append("text") //names
			.attr("dx", function(d){return 100})
			.attr("dy", function(d,i){return rank.indexOf(d)*30 + 20 })
			.text(function(d){return d.Name})
			.style("fill", "#006dcc")
					
	var text2 = element.enter().append("text") //number E.g. total number of cases, % accuracy
			.attr("dx", function(d){return 650})
			.attr("dy", function(d,i){return rank.indexOf(d)*30 + 20 })
			.text(function(d){ return d.Correct; })
			
	svg.append("line") //Line on top of table
	  .attr("x1", 70)
	  .attr("x2", 730)
	  .attr("y1", 1)
	  .attr("y2", 1)
	  .style("stroke", "black")
	  .attr("width", 600);
	
/*	svg.append("line") //Line on bottom of table
	  .attr("x1", 70)
	  .attr("x2", 730)
	  .attr("y1", 570)
	  .attr("y2", 570)
	  .style("stroke", "black")
	  .attr("width", 600);
*/	
	d3.select('#s').on( 'click', function() { //Display streak text when click
				rank = streak(rank)
				text.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  
				text2.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  .text(function(d){return +d.Explanation;});				  
				type = 2;
	});
				

		
	d3.select('#t').on( 'click', function() {
				rank = totalSort(rank)
				text.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  
				text2.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  .text(function(d){return +d.Correct;});
					  
				type = 0;
	});	
	
	d3.select('#a').on( 'click', function() {
				rank = accuSort(rank)
				text.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  
				text2.transition()
					.duration(500)
					  .attr("dy", function(d,i) { return rank.indexOf(d)*30 + 20})
					  .text(function(d){return percent(+d.Correct/+d.Total);});
					  
				
				type = 1;
	});
		
		
function shuffle(array) {
  var m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m], array[m] = array[i], array[i] = t;
  }
  return array;
}
		
		
function totalSort(array) {
  var m = array.length-1, t, i;
  while (m>=0) {
    n = m;
	while(n>=0){
		if(+array[n].Correct < +array[m].Correct ){
		     t = array[m], array[m] = array[n], array[n] = t;
		}
		n--;
	}
	m--;
  }
  return array;
}
						
function accuSort(array) {
  var m = array.length-1, t, i;
  while (m>=0) {
    n = m;
	while(n>=0){
		if((+array[n].Correct/+array[n].Total) < (+array[m].Correct/+array[m].Total) ){
		     t = array[m], array[m] = array[n], array[n] = t;
		}
		n--;
	}
	m--;
  }
  return array;
}

function streak(array) {
  var m = array.length-1, t, i;
  while (m>=0) {
    n = m;
	while(n>=0){
		if(+array[n].Explanation < +array[m].Explanation ){
		     t = array[m], array[m] = array[n], array[n] = t;
		}
		n--;
	}
	m--;
  }
  return array;
}

function activateButtonT()
{
	x=document.getElementById("t"); //Find the t button
	x.setAttribute("class","abtn") //Change the attribute so that the class becomes an active button
	x=document.getElementById("a"); //Deactivate the other buttons
	x.setAttribute("class","btn") 
	x=document.getElementById("s");
	x.setAttribute("class","btn")
}

function activateButtonA()
{
	x=document.getElementById("a"); //Find the a button
	x.setAttribute("class","abtn") //Change the attribute so that the class becomes an active button
	x=document.getElementById("t"); //Deactivate the other buttons
	x.setAttribute("class","btn") 
	x=document.getElementById("s");
	x.setAttribute("class","btn")
}	

function activateButtonS()
{
	x=document.getElementById("s"); //Find the a button
	x.setAttribute("class","abtn") //Change the attribute so that the class becomes an active button
	x=document.getElementById("t"); //Deactivate the other buttons
	x.setAttribute("class","btn") 
	x=document.getElementById("a");
	x.setAttribute("class","btn")
}	
  