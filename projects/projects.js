import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json'); // load the project data from a JSON file

const projectsContainer = document.querySelector('.projects'); // Select the container where you want to render the project articles.

if (projects && projects.length > 0) { // if projects is valid, and not empty array
    renderProjects(projects, projectsContainer, 'h2'); // dynamically display the fetched projects
} else {
    projectsContainer.textContent = 'No projects found.'; // otherwise, say placeholder text
}

const projectsTitle = document.querySelector('.projects-title'); //update title project with count
if (projectsTitle) {
    const count = Array.isArray(projects) ? projects.length : 0; // if its null, just set to 0 length
    projectsTitle.textContent = `${count} Projects`;
}






let searchInput = document.querySelector('.searchBar');


let query = '';
let selectedIndex = -1;
let newData = [];

function filterProjects(projectsGiven) {
  return projectsGiven.filter(project => {
    const matchesSearch = Object.values(project).join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesYear = selectedIndex !== -1 ? project.year === newData[selectedIndex].label : true;  // Apply year filter if selected
    return matchesSearch && matchesYear;
  });
}




searchInput.addEventListener('input', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects
  const filteredProjects = filterProjects(projects);

  // TODO: render updated projects!
  if (filteredProjects && filteredProjects.length > 0) { // if projects is valid, and not empty array
    renderProjects(filteredProjects, projectsContainer, 'h2'); // dynamically display the fetched projects
    renderPieChart(filteredProjects); // dynamically render the pie chart
  } else {
    projectsContainer.textContent = 'No projects found.'; // otherwise, say placeholder text
    d3.select('svg').selectAll('path').remove(); // remove pie chart
    d3.select('.legend').selectAll('li').remove(); // remove legend
  }
});




function renderPieChart(projectsGiven) {
  // Re-calculate rolled data: count projects per year
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // Transform rolled data into objects with { value, label }
  newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Create pie layout
  let newSliceGenerator = d3.pie().value(d => d.value);
  let newArcData = newSliceGenerator(newData);

  // Create arc generator
  let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let newArcs = newArcData.map(d => newArcGenerator(d));

  // Set up colors
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Clear previous paths and legend items
  let svg = d3.select('svg');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // Render arcs
  newArcs.forEach((arc, idx) => {
    svg.append('path')
       .attr('d', arc)
       .attr('fill', colors(idx))
       .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;

            svg
            .selectAll('path')
            .attr('class', (_, i) => (
                // TODO: filter idx to find correct pie slice and apply CSS from above
                i === selectedIndex ? 'selected' : ''
            ));
            legend
                .selectAll('li')
                .attr('class', (_, i) => (
                    // TODO: filter idx to find correct legend and apply CSS from above
                    i === selectedIndex ? 'legend-item selected' : 'legend-item'
                ));

            const filteredProjects = filterProjects(projects);
            if (filteredProjects && filteredProjects.length > 0) {
            renderProjects(filteredProjects, projectsContainer, 'h2');
            } else {
            projectsContainer.textContent = 'No projects found.';
            }
        });
  });

  // Render legend
  newData.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .attr('class', 'legend-item')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);