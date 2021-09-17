#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const gh = require('./gh');

const argv = yargs(hideBin(process.argv))
    .option('token', {
        alias: 't',
        description: 'Travis api token'
    })
    .option('org', {
        alias: 'o',
        description: 'Organization to scan'
    })
    .option('extended', {
        alias: 'e',
        type: 'boolean',
        description: 'Whether or not to use GH APIs to filter out repositories without any forks, and add information about top 3 contributors'
    })
    .option('github_token', {
        alias: 'ght',
        description: 'Github token. Unless you have a very small number of repositories, required in order to increase githubs rate limit'
    })
    .demandOption(['token', 'org'])
    .usage('Helper to scan an organization in Travis to find potentially vulnerable repositories from Sept 2021 incident. Provide token and org to scan your organization using Travis APIs. Only repos which had Travis builds and have environment variables in Travis will be returned. Provide also the boolean extended and github_token in order to refine the search to include only repos which have forks and also get a nice summary which include the repo name and information about the top 3 contributors')
    .help()
    .argv;

const {token, org, extended, github_token} = argv;

if (extended && !github_token) {
    console.error('!!! Please provide Github access token if you have more than a couple repositories, otherwise you will get blocked by GH rate limits which are not properly handled by this script.')
}

const path = './repos.json';

const client = axios.create({
    baseURL: `https://api.travis-ci.com`,
    headers: {
        'User-Agent': 'FilterReposNodeApp',
        'Travis-API-Version': 3,
        'Authorization': `token ${token}`
    }
});

async function getOrgRepos(org) {
    const repos = [];
    let nextUrl = `/owner/${org}/repos`;
    do {
        console.log(`Getting repositories chunk from ${nextUrl}`);
        let result = await client.get(nextUrl);
        nextUrl = result.data['@pagination'].next && result.data['@pagination'].next['@href'];
        repos.push(...result.data.repositories);
        break;
    } while (nextUrl);

    return repos;
}

async function getRepoEnvVars(repo) {
    let result = await client.get(`${repo['@href']}/env_vars`);
    return result.data.env_vars;
}

(async function () {
    const repos = await getOrgRepos(org);
    const reposWithEnvVars = [];
    console.log(`Checking if repositories have environment variables, this might take a while.`);
    for (let repo of repos) {
        const envVariables = await getRepoEnvVars(repo);
        if (envVariables.length > 0) {
            reposWithEnvVars.push(repo);
        }
    }

    console.log('The following repositories are potentially impacted - they have used Travis and have environment variables:');
    console.log(JSON.stringify(reposWithEnvVars.map(repo => repo.name)));
    console.log(`Writing JSON summary output to ${path}`);

    fs.writeFileSync(path, JSON.stringify({"repos": reposWithEnvVars}));

    if (extended) {
        console.log('\nRefining using GH APIs.. getting a list of potentially impacted repos which have forks and gathering top contributors information');
        gh(github_token, reposWithEnvVars);
    }
})();
