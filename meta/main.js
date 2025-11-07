import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

let data = await loadData();
let commits = processCommits(data);
console.log(commits);

renderCommitInfo(data, commits);
