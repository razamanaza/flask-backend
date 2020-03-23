$(function(){
  $('#countries-list').change(function() {
    id = this.value
    $.get("/countries/" + id, function(response){
      $("#output").html('<svg></svg>');
      drawChart(response);
    }).fail(function(e){
      console.log('Request error: ' + e.status + ' ' + e.statusText);
    });
  });

  function drawChart(response) {
    let responseObj = JSON.parse(response);
    let [gdp, agriculture, industry, service] = dataNorm(responseObj.data);
    const margin = 80;
    const width = 800 - 2 * margin;
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
    chart.append('g')
    .call(d3.axisTop(xScale));
    chart.append('g')
    .call(d3.axisLeft(yScale));

    svg
      .append('text')
      .attr('class', 'label')
      .attr('x', -(height / 2) - margin)
      .attr('y', margin / 2.4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Years')

      svg.append('text')
      .attr('class', 'label')
      .attr('x', width / 2 + margin)
      .attr('y', margin / 2)
      .attr('text-anchor', 'middle')
      .text('GDP in billions of USD')

    const barGroups = chart.selectAll()
      .data(gdp)
      .enter()
      .append('g')

    barGroups
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 1)
      .attr('y', (g) => yScale(g.date))
      .attr('width', (g) => xScale(g.gdp))
      .attr('height', yScale.bandwidth());

    barGroups
      .on('mouseenter', function (actual, i) {
        bar = d3.select(this);

        bar
          .select('rect')
          .classed('bar-bright', true)
          .transition()
          .duration(300)
          .attr('y', (a) => yScale(a.date) - 4)
          .attr('height', yScale.bandwidth() + 8);

        bar
          .append('text')
          .attr('class', 'bar-label')
          .attr('text-anchor', 'middle')
          .attr('y', (a) => yScale(a.date) + 15)
          .attr('x', (a) => xScale(a.gdp) / 2)
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .text(actual.gdp);

      })
      .on('mouseleave', function (actual, i) {
          d3.select(this)
            .select('rect')
            .classed('bar-bright', false)
            .transition()
            .duration(300)
            .attr('y', (a) => yScale(a.date))
            .attr('height', yScale.bandwidth());

          chart.selectAll('.bar-label').remove()

      });

  }

  function dataNorm(data){
    let gdp = [];
    for(e in data.gdp){
      if(data.gdp[e] !== ''){
        gdp.push({'date': e, 'gdp': Number(data.gdp[e] / 1000000000)});
      }
    }
    return [gdp, data['agriculture'], data['industry'], data['service']];
  }



});
