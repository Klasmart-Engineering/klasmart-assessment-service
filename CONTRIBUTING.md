# Contributing

[TOC]

## Merge Conventions

Fast forward after rebasing, or squash if your branch has a lot of minor commits that would clutter the commit history.

## Jira Ticket IDs

Include Jira ticket IDs in your commit messages. The quality of the Jira Deployments integration depends on it. See [Commit Message Footer](#markdown-header-commit-message-footer).

## Tests

Make an effort to add/update tests when making any code modifications. At the time of writing, coverage is at 100%. Use `npm run test:coverage` for a local coverage report to spot uncovered lines/branches.

## Commit Message Format

*This specification is inspired by [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md). Emojis come from [here](https://github.com/pvdlg/conventional-commit-types).*

We have very precise rules over how our Git commit messages must be formatted.
This format leads to **easier to read commit history**.

Each commit message consists of a **header**, a **body**, and a **footer**.

```
<header>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The `header` is mandatory and must conform to the [Commit Message Header](#markdown-header-commit-message-header) format.

The `body` is optional and must conform to the [Commit Message Body](#markdown-header-commit-message-body) format.

The `footer` is optional. The [Commit Message Footer](#markdown-header-commit-message-footer) format describes what the footer is used for and the structure it must have.

A commit that has the text `BREAKING CHANGE: ` at the beginning of its optional body or footer section introduces a breaking API change.

Any line of the commit message cannot be longer than 100 characters.

### Commit Message Header

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: Optionally, provides extra context.
  │
  └─⫸ Commit Type: Predefined list of commit categories.
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

#### Types

| Commit Type | Description                                                                                                 | Emoji  |
| ----------- | ----------------------------------------------------------------------------------------------------------- |:------:|
| `feat`      | A new feature                                                                                               | ✨     |
| `fix`       | A bug Fix                                                                                                   | 🐛     |
| `docs`      | Documentation only changes                                                                                  | 📚     |
| `style`     | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)      | 💎     |
| `refactor`  | A code change that neither fixes a bug nor adds a feature                                                   | 📦     |
| `perf`      | A code change that improves performance                                                                     | 🚀     |
| `test`      | Adding missing tests or correcting existing tests                                                           | 🚨     |
| `build`     | Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)         | 🛠     |
| `ci`        | Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs) | ⚙️     |
| `chore`     | Other changes that don't modify src or test files                                                           | ♻️     |
| `revert`    | Reverts a previous commit                                                                                   | 🗑     |

#### Scope

The scope optionally provides extra context. If you're fixing a ListView bug, for example, you might use fix(listview).

#### Summary

Use the summary field to provide a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end


### Commit Message Body

Just as in the summary, use the imperative, present tense: "fix" not "fixed" nor "fixes".

The body can contain information about breaking changes, and is also the place to explain the motivation for the change mentioned in the summary. This commit message should explain _why_ you are making the change.
You can include a comparison of the previous behavior with the new behavior in order to illustrate the impact of the change.


### Commit Message Footer

The footer can contain information about breaking changes, and is also the place to reference GitHub issues, Jira tickets, and other PRs that this commit closes or is related to.

```
BREAKING CHANGE: <breaking change description>
Fixes/Closes/etc #<issue number>
```

### Revert commits

If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit.

The content of the commit message body should contain:

- information about the SHA of the commit being reverted in the following format: `This reverts commit <SHA>`,
- a clear description of the reason for reverting the commit message.
