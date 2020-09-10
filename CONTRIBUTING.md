# Trail is an Open Source Project

## Want to be a collaborator?

If you'd like to be involved please contact the Trail team by reaching out to a Lead Maintainer.

## Bugs

If you found a bug please follow these guidelines:

* Check the Issues list to see if the bug was already reported and if potentially there is already a PR open to fix it.
* If it is a security bug DO NOT open an Issue and instead contact the Trail lead maintainers with a clear description of the bug.
* All Issues should be described clearly and with reproduceable steps. 
* Please include: the version of the packages you are using, the NodeJS version you have installed, and the operating system and version.  

## Feature Requests

If you have a feature request please open a new Issue:

* describing the feature.
* how you believe it will improve the project.

After feedback and discussion the feature will be considered and someone assigned to work on it. If you feel like implementing the feature please ask so the Trail team can manage the contribution effort.

## Code Contribution Rules

To contribute to the Trail project you should follow these rules:

1. All contributions start with a pull-request (PR) from your forked repository and reside in a non-master branch.
1. Contributions should keep the code-style used on the rest of the project codebase.
1. Your PR will have to be reviewed by Trail core team members before being merged.
1. Your contribution is your own creation:

    * You have the right to submit it
    * It does not breach any copyright laws or other licensing.
    * Your contribution will be public.
    * Your contribution will be maintained and potentially subject to future changes or removal.
    *  Your contribution can be redistributed according to the Trail [LICENSE](LICENSE.md)

1. The CI pipeline checks must pass before a PR is merged.
1. Trail uses SemVer for versioning. Do not change packages versions, that will be done by the core team members.


## Doing a Release

Any changes to the versioning of Trail or it's packages is managed by the core team.

### The release and publishing process:

1. Merge the approved PR into master
1. Bump the version on master

    * In the root of the project run `lerna version` and choose the appropriate SemVer version. Lerna will create the necessary git tags, push and creates a release for each package in Github

1. In each package folder that was changed run `npm publish` (you must have publishing permissions in npmjs.org)
