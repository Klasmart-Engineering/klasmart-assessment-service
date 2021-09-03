#!/bin/sh

COMMITS=$(git log origin/$BITBUCKET_PR_DESTINATION_BRANCH..$BITBUCKET_BRANCH --oneline --reverse | cut -d " " -f 1)
status=0
commitlint_status=0
for COMMIT in $COMMITS
do
    MSG=$(git show --format="%B" -s $COMMIT)
    echo "$MSG" | npx commitlint -V || (commitlint_status=1 && status=1)

    if  [[ $MSG == wip:* ]]
    then
        status=1
        echo "The 'wip' commit type is permittable during development, but we're failing"
        echo "this PR pipeline to ensure it doesn't find its way into the destination branch."
    fi

    if  [[ $MSG == fixup!* ]]
    then
        status=1
        echo "'fixup!' is permittable during development, but we're failing"
        echo "this PR pipeline to ensure it doesn't find its way into the destination branch."
    fi
    echo ------------------
done
if  [[ $commitlint_status == 1 ]]
then
    echo "One or more commit messages were formatted incorrectly. Please see CONTRIBUTING.md for details."
    echo "This should have been caught locally by commit hooks."
    echo "Make sure husky hooks are being triggered. You may have to chmod the husky files."
fi

exit $status