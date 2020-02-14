function executeFailable(shell, cmd) {
    const { stdout, stderr, code } = shell.exec(cmd, { silent: true });
    var exit = false;
    if (code != 0) {
        console.log("ops.. Something went wrong: ");
        console.log("stderr: " + stderr);
        exit = true;
    }

    return { stderr, stdout, exit }
}

function benchBranch(config) {
    let cwd = process.cwd();
    var shell = require('shelljs');

    shell.cd(cwd + "/git")
    console.log(`cloning ${config.repository}...`);

    var { stdout, stderr, code } = shell.exec(`git clone ${config.repository}`, { silent: true });

    if (code == 0) {
        console.log("Checked out git repository...")
    } else {
        console.log("Git clone failed, probably directory exists...");
        console.log(stderr)
    }

    shell.cd(cwd + "/git/substrate");

    console.log("checking out master...");

    var { stdout, stderr, exit } = executeFailable(shell, 'git checkout master');
    if (exit) return;

    console.log("pulling out master...");

    var { stdout, stderr, exit } = executeFailable(shell, 'git pull origin master');
    if (exit) return;

    console.log("doing git fetch...");

    var { stdout, stderr, exit } = executeFailable(shell, 'git fetch');
    if (exit) return;

    console.log("resetting hard to origin/master...");

    var { stdout, stderr, exit } = executeFailable(shell, 'git reset --hard origin/master');
    if (exit) return;

    console.log("benching master...");

    var { stdout, stderr, exit } = executeFailable(shell, 'cargo bench -p node-testing import');
    if (exit) return;

    var masterResult = stdout;

    console.log("merging new branch...");

    var { stdout, stderr, exit } = executeFailable(shell, `git merge origin/${config.branch}`);
    if (exit) return;

    console.log("benching new branch...");

    var { stdout, stderr, exit } = executeFailable(shell, 'cargo bench -p node-testing import');
    if (exit) return;

    var branchResult = stdout;


    return { masterResult, branchResult };
}

module.exports = benchBranch;