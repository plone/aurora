const { ESLint } = require('eslint');

function shellQuote(arg) {
  return "'" + String(arg).replace(/'/g, "'\\''") + "'";
}

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const ignoredFiles = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file)),
  );
  const filteredFiles = files.filter((_, i) => !ignoredFiles[i]);

  // escape parameters for CLI
  const finalFiles = filteredFiles.map(shellQuote);

  return finalFiles.join(' ');
};
module.exports = {
  'packages/!(volto)/**/*.{js,jsx,ts,tsx}': async (files) => {
    const filesToLint = await removeIgnoredFiles(files);
    if (!filesToLint) {
      return ['pnpm prettier --single-quote --write'];
    } else {
      return [
        `eslint --max-warnings=0 ${filesToLint}`,
        'pnpm prettier --single-quote --write',
      ];
    }
  },
  '**/*.{css,less,scss}': ['pnpm stylelint --fix'],
};
