import { fetchJSON, renderProjects } from '../global.js';

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