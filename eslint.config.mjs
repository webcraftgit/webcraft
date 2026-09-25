import next from "eslint-config-next";

// The React Compiler "rules of React" (new in the eslint-plugin-react-hooks
// that Next 16 enables) flag deliberate patterns in this WebGL/GSAP code:
// random particle seeds, per-frame ref/object mutation, and mount-only
// setState. This project does not enable the React Compiler, so these are
// advisory. Keep them visible as warnings instead of failing the build.
const downgrade = {
  "react-hooks/purity": "warn",
  "react-hooks/immutability": "warn",
  "react-hooks/set-state-in-effect": "warn",
};

// Merge the downgrades into whichever config object already registers the
// react-hooks plugin, so the rules resolve without redefining the plugin.
const patched = next.map((c) =>
  c.plugins && c.plugins["react-hooks"]
    ? { ...c, rules: { ...c.rules, ...downgrade } }
    : c,
);

// Next 16 ships eslint-config-next as a native flat config (core-web-vitals +
// typescript + react + a11y). Spread it after our ignores.
const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  ...patched,
];

export default config;
