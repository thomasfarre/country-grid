module.exports = {
  "*.{js,jsx,ts,tsx}": (files) => {
    if (files.length === 0) return [];
    const joined = files.join(" ");
    return [`eslint --fix ${joined}`, `prettier --write ${joined}`];
  },
  "*.{json,css,md}": (files) => {
    if (files.length === 0) return [];
    return [`prettier --write ${files.join(" ")}`];
  },
  "src/**/*.{ts,tsx}": () => "npm run test:staged"
};
