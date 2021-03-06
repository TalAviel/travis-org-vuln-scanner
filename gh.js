const axios = require('axios');
const fs = require('fs');

let client;

async function getGHRepo(slug) {
    let result;

    try {
        result = await client.get(`/repos/${slug}`);
    } catch(e) {
        console.log('---');
        console.error(`Couldn't get repo ${slug}`);
        console.error(e && e.response && e.response.data);
        console.log('---');
        return;
    }
    return result.data;
}

async function getTopContributorsDetails(url, limit) {
    const contributors = await client.get(url);
    let users = [];
    for (let i = 0; i < limit && i < contributors.data.length; ++i) {
        const user = await client.get(contributors.data[i].url);
        users.push(user.data);
    }
    return users;
}

async function start(token, repos) {
    client = axios.create({
        baseURL: `https://api.github.com`,
        headers: {
            'User-Agent': 'FilterReposNodeApp',
            'Authorization': `token ${token}`
        }
    });

    let headers = 'Repository Name, Contributor1 name, Contributor1 email, Contributor1 profile, Contributor2 name, Contributor2 email, Contributor2 profile, Contributor3 name, Contributor3 email, Contributor3 profile';
    let csv = '';

    for (let repo of repos) {
        const ghRepo = await getGHRepo(repo.slug);
        if (!ghRepo || ghRepo.forks === 0) continue;

        let users = await getTopContributorsDetails(ghRepo.contributors_url, 3);
        users = users.map(user => `${user.name}, ${user.email}, ${user.html_url}`);

        csv += `\n${ghRepo.name}, ${users.join(', ')}`;
    }

    console.log(csv);

    console.log('Writing summary CSV to ./summary.csv');
    fs.writeFileSync('./summary.csv', headers + csv);
}

module.exports = start;
