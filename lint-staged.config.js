const { ESLint } = require('eslint');

const removeIgnoredFiles = async (files) => {
  const eslint = new ESLint();
  const ignoredFiles = await Promise.all(
    files.map((file) => eslint.isPathIgnored(file)),
  );
  const filteredFiles = files.filter((_, i) => !ignoredFiles[i]);

  // escape spaces for CLI
  const finalFiles = filteredFiles.map(f => f.replace(' ', '\\ '));

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
