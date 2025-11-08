import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// JUST RUN
// npx elocuent -d . -o meta/loc.csv --spaces 2
// IN TERMINAL IF YOU EVER WANT TO UPDATE THIS

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/vis-society/lab-7/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                // What other options do we need to set?
                // Hint: look up configurable, writable, and enumerable
                enumerable: false,   // hidden when logging or iterating
                writable: true,      // can modify if needed
                configurable: true   // can delete or redefine if needed
            });

            return ret;
        });
}

function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    
    // Add total commits
    dl.append('dt').text('Commits');
    dl.append('dd').text(commits.length);

    // Add num files
    const uniqueFiles = new Set(data.map((d) => d.file));
    dl.append('dt').text('Files');
    dl.append('dd').text(uniqueFiles.size);

    // Add total lines of code
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Add avg line length
    const avgLineLength = d3.mean(data, (d) => d.length);
    dl.append('dt').text('Avg Line Length');
    dl.append('dd').text(avgLineLength.toFixed(1));

    // Add avg line depth
    const avgDepth = d3.mean(data, (d) => d.depth);
    dl.append('dt').text('Avg Line Depth');
    dl.append('dd').text(avgDepth.toFixed(2));

    // Add num unique commit days
    const uniqueDays = new Set(data.map((d) => d.date.toISOString().slice(0, 10)));
    const numDaysWorked = uniqueDays.size;

    dl.append('dt').text('Days Worked On');
    dl.append('dd').text(numDaysWorked);
    }

function renderScatterPlot(data, commits) {
    // Put all the JS code of Steps inside this function
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
        };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    const yGrid = d3
        .axisLeft(yScale)
        .tickSize(-usableArea.width)
        .tickFormat('');
    
    // Create radius scale
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt() // Change only this line
        .domain([minLines, maxLines])
        .range([5, 30]); // adjust these values based on your experimentation
    
    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // Add gridlines
    svg
        .append('g')
        .attr('class', 'y-grid')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yGrid);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
            // console.log(rScale(commit.totalLines))
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    createBrushSelector(svg);


}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-linesedited');

    if (!commit || Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
    time.textContent = commit.datetime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
    // Create brush and attach event listener
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
    console.log(event);
    const selection = event.selection;

    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d)
    );

    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) return false;

    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];

    const container = document.getElementById('language-breakdown');
    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );

    container.innerHTML = '';
    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
        `;
    }
}

let xScale, yScale;

let data = await loadData();
let commits = processCommits(data);
console.log(commits);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
