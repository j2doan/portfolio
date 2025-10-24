console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");
// console.log(navLinks);

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/j2doan', title: 'Profile' },
];

let nav = document.createElement('nav'); // create <nav></nav>
document.body.prepend(nav); // slap it at the beginning of <body></body>

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1") // helps make links work on every page, not just home
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

for (let p of pages) {
    let url = p.url; // get current url
    url = !url.startsWith('http') ? BASE_PATH + url : url; // if it doesnt start with https, just slap /portfolio/ to the beginning of the url, or / depending on if you on loval host or github server
    let title = p.title; // get page title

    let a = document.createElement('a'); // create a new <a></a>
    a.href = url; // <a href=...>
    a.textContent = title; // add the title within the <a></a>

    a.classList.toggle( // turn on the "current" attribute if current host and pathname is equal to the one being created rn
        "current",
        a.host === location.host && a.pathname === location.pathname
    );
    
    if (a.host !== location.host) { // current portfolio repo and actual github profile have diff hosts, add _blank only to profile bc diff link
        a.target = "_blank";
    }

    nav.append(a);
}

document.body.insertAdjacentHTML( //inserts a small raw HTML block of code
    'afterbegin', // at the beginning of <body></body> (since its document.body)
    `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
		</select>
	</label>`, // a color scheme label class that has a drop-down selector for light/dark/auto
);

let select = document.querySelector('.color-scheme select'); // finds <select> element (i.e. light/dark/auto) in the color scheme label (defined in HTML above), stores it into the variable select

if ("colorScheme" in localStorage) { // localStorage initially empty, unless it already has something in it (from the block of code below)
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme); // if so, then immediatley set it to whatever the previous light/dark/auto was. basically <html style="color-scheme: dark;"> for example
    select.value = localStorage.colorScheme; //drop-down selector will be whatever you picked last time. THIS IS ALL FOR IF YOU REFRESHED PAGE
}

select.addEventListener('input', function (event) { // for the <select> element, if theres an "input" (you clicked a drop-down option), then once that EVENT occurs, the function will run (we defined the function as so)
    console.log('color scheme changed to', event.target.value); // log it in console
    document.documentElement.style.setProperty('color-scheme', event.target.value); // set html style, e.g. <html style="color-scheme: dark;">
    localStorage.colorScheme = event.target.value; // we add the light/dark/auto to the variable localStorage (used for refreshing pages later, aka block of code above)
});

let form = document.querySelector("form"); // selects <form></form> and stores it into variable "form"

form?.addEventListener("submit", function (event) { // regarding the <form> element, when user presses submit button, function will run as so (basically getting rid of the weird syntax):
    event.preventDefault();
    let data = new FormData(form);
    let url = form.action + "?";
    for (let [name, value] of data) {
        url += `${name}=${encodeURIComponent(value)}&`;
    }
    url = url.slice(0, -1);
    location.href = url;
});

export async function fetchJSON(url) { // an asynchronous function that will fetch your project data
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') { // a function that accepts two parameters: the project object and the containerElement where the project will be displayed
    // Your code will go here
    if (!containerElement) { // test if containerElement is valid
        console.error('renderProjects: containerElement cannot be null or undefined.');
        return;
    }

    if (!Array.isArray(project)) { // projects needs to be an array of projects
        console.error('renderProjects: projects must be an array.');
        return;
    }

    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadings.includes(headingLevel)) { // validate headings, otherwise default h2 (e.g. u cant do div as heading)
        console.warn(`Invalid headingLevel "${headingLevel}" detected. Defaulting to <h2>.`);
        headingLevel = 'h2';
    }

    containerElement.innerHTML = '';

    project.forEach(p => {
        const article = document.createElement('article'); // create new article element for project
        

        const title = typeof p.title === 'string' && p.title.trim() !== ''  // verify that title does not crash 
            ? p.title
            : 'Untitled Project';

        const image = typeof p.image === 'string' && p.image.trim() !== ''  // verify image will not crash
            ? p.image
            : 'images/placeholder.png';

        const description = typeof p.description === 'string' && p.description.trim() !== '' // verify description will not crash
            ? p.description
            : 'No description available.';

        article.innerHTML = `
            <${headingLevel}>${title}</${headingLevel}>
            <img src="${image}" alt="${title}">
            <p>${description}</p>
        `;

        containerElement.appendChild(article);

    });
}
