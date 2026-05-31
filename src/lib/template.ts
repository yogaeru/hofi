export const configPackagesTemplate = (packagesInstalled: string[]) => {
  const CONFIG_TOML_PACKAGES_TEMPLATE = `
[packages]
packages = [
  ${packagesInstalled.map(p => `"${p}"`).join(",\n  ")}
]
`;
  return CONFIG_TOML_PACKAGES_TEMPLATE;
};



