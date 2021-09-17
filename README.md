# travis-org-vuln-scanner

On Sept 13, Travis team announced about a critical vulnerability, see https://travis-ci.community/t/security-bulletin/12081

In large organizations, it's not easy to understand the blast radius.

This tool will help you to scan organizations in Github by filtering out repositories which are not impacted.

## Basic filtering using Travis APIs

By providing 'org' and 'token' arguments to this script, your organization will be scanned.
Only repositories that have Travis builds and environment variables set in Travis will be included in the result.

### Sample output
```
Getting repositories chunk from /owner/org/repos
Checking if repositories have environment variables, this might take a while.
The following repositories are potentially impacted - they have used Travis and have environment variables:
["repo1","repo2","repo3"]
Writing JSON summary output to ./repos.json
```

## Extended refinement

If you provide also `extended` and `github_token`, the script will use Github APIs to filter out repositories which don't have any forks.
In addition, it will create a summary which includes the potential impacted repo + basic details about the top 3 contributors (link to github profile + name and email if publicly available)

### Sample output
```csv
Repository Name, Contributor1 name, Contributor1 email, Contributor1 profile, Contributor2 name, Contributor2 email, Contributor2 profile, Contributor3 name, Contributor3 email, Contributor3 profile
repo1, John Doe, jdoe@example.com, https://github.com/jdoe, John Doe, jdoe@example.com, https://github.com/jdoe, John Doe, jdoe@example.com, https://github.com/jdoe
```


## Usage

```
Options:
      --version              Show version number                       [boolean]
  -t, --token                Travis api token                         [required]
  -o, --org                  Organization to scan                     [required]
  -e, --extended             Whether or not to use GH APIs to filter out
                             repositories without any forks, and add information
                             about top 3 contributors                  [boolean]
      --github_token, --ght  Github token. Unless you have a very small number
                             of repositories, required in order to increase
                             githubs rate limit
      --help                 Show help                                 [boolean]
```

You can clone it and run it locally by -

```bash
node index travis-org-vuln-scanner -t TRAVIS_TOKEN -o ORGANIZATION_NAME --extended --github_token GITHUB_TOKEN
```

OR by just using NPX

```bash
npx travis-org-vuln-scanner -t TRAVIS_TOKEN -o ORGANIZATION_NAME --extended --github_token GITHUB_TOKEN
```

To ensure you're using the latest version, you can add `--ignore-existing` to the `npx` command, e.g. -

```bash
npx --ignore-existing travis-org-vuln-scanner -t TRAVIS_TOKEN -o ORGANIZATION_NAME --extended --github_token GITHUB_TOKEN
```
