$(function(){
  $('#countries-list').change(function() {
    id = this.value
    $.get("/countries/" + id, function(response){
      $("#output").html('<svg></svg>');
      drawBar(response);
    }).fail(function(e){
      console.log('Request error: ' + e.status + ' ' + e.statusText);
    });
  });

  function drawBar(response) {
    let responseObj = JSON.parse(response);
    let [gdp, agriculture, industry, service] = dataNorm(responseObj.data);
    const margin = 80;
    const width = 700 - 2 * margin;
    //The height of container is dynamic and depend on the number of values in GDP
    const height = gdp.length * 35 - 2 * margin;
    const svg = d3.select('svg');
    const chart = svg.append('g')
    .attr('transform', `translate(${margin}, ${margin})`);
    //Gets the max vaule of gdp in array
    const gdpMax = Math.max(...gdp.map(e => e.gdp));
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([0, gdpMax]);
    const yScale = d3.scaleBand()
      .range([0, height])
      .domain(gdp.map((g) => g.date))
      .padding(0.3);

    //Sets the height of the main area
    $("#output").css('height', height + 2 * margin);

    //Draws X and Y axis
    chart
      .append('g')
      .call(d3.axisTop(xScale));
    chart
      .append('g')
      .call(d3.axisLeft(yScale));

    //Add Y and X labels
    svg
      .append('text')
      .attr('class', 'label')
      .attr('x', -(height / 2) - margin)
      .attr('y', margin / 2.4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Years');

    svg
      .append('text')
      .attr('class', 'label')
      .attr('x', width / 2 + margin)
      .attr('y', margin / 2)
      .attr('text-anchor', 'middle')
      .text('GDP in billions of USD');

    //Create bars
    const barGroups = chart.selectAll()
      .data(gdp)
      .enter()
      .append('g');

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 1)
      .attr('y', (g) => yScale(g.date))
      .attr('width', (g) => xScale(g.gdp))
      .attr('height', yScale.bandwidth());

    //Add interactivity to bars
    barGroups
      .on('mouseenter', function (actual, i) {
        bar = d3.select(this);

        bar
          .select('rect')
          .classed('bar-bright', true)
          .transition()
          .duration(300)
          .attr('y', (a) => yScale(a.date) - 5)
          .attr('height', yScale.bandwidth() + 10);

        bar
          .append('text')
          .attr('class', 'bar-label')
          .attr('text-anchor', 'middle')
          .attr('y', (a) => yScale(a.date) + 15)
          .attr('x', (a) => xScale(a.gdp) / 2)
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .text(actual.gdp);

        //Draw PieChart on mouseover
        barRect = bar.select('rect');
        other = 100 - agriculture[actual.date] -
                industry[actual.date] -
                service[actual.date];
        pieData = [
          {'sector': 'agriculture', 'value': agriculture[actual.date]},
          {'sector': 'industry', 'value': industry[actual.date]},
          {'sector': 'service', 'value': service[actual.date]},
        ];
        if(other > 0) {
          pieData.push({'sector': 'other', 'value': other});
        }
        drawPie(
          Math.floor(barRect.attr('width')) + margin,
          Math.floor(barRect.attr('y')) + margin + 10,
          pieData
        );
      })
      .on('mouseleave', function (actual, i) {
          d3.select(this)
            .select('rect')
            .classed('bar-bright', false)
            .transition()
            .duration(300)
            .attr('y', (a) => yScale(a.date))
            .attr('height', yScale.bandwidth());

          chart.selectAll('.bar-label').remove();
          svg.selectAll('.pie-card').remove();
      });

  }

  //x and y - the coordinates of the current bar right border as a countdown point
  //data - data for the pie chart
  function drawPie(x, y, data) {
    console.log
    const svg = d3.select('svg');
    const radius = 150;
    const maxX = $("#output").width();
    let pieCard = svg.append('g')
      .attr('class', 'pie-card')
      .attr("transform", "translate(" + ((maxX - x) / 2 + x) + "," + y + ")");

    const color = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#ffd92f", "#8da0cb"]);

    let arc = d3.arc()
      .outerRadius(radius)
      .innerRadius(60);

    let labelArc = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

    let pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value; });

    let g = pieCard.selectAll()
      .data(pie(data))
      .enter().append("g")
      .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color(d.data.sector); })
      .transition()
      .ease(d3.easeLinear)
      .duration(500)
      .attrTween("d", tweenDonut);

    g.append("text")
      .transition()
      .ease(d3.easeLinear)
      .duration(500)
      .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
      .attr("dy", "12px")
      .text(function(d) { return d.data.value; });

    function tweenDonut(b) {
      b.innerRadius = 0;
      var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
      return function(t) { return arc(i(t)); };
    }

  }

  function dataNorm(data){
    let gdp = [];
    let sectors = {
      'agriculture': {},
      'industry': {},
      'service': {}
    };
    //Translate gdp from usd to billions of usd
    for(e in data.gdp){
      if(data.gdp[e] !== ''){
        gdp.push({'date': e, 'gdp': Number(data.gdp[e] / 1000000000)});
      }
    }
    //Replace undefined data with 0 and text values with numbers
    Object.keys(sectors).forEach((e) => {
      gdp.forEach((g) => {
        if(data[e][g.date]) {
          sectors[e][g.date] = Math.round(Number(data[e][g.date]));
        } else {
          sectors[e][g.date] = 0;
        }
      })
    });
    return [gdp, sectors['agriculture'], sectors['industry'], sectors['service']];
  }

});
