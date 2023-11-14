import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    external: ["@hotwired/stimulus"],
    output: [
      {
        name: "StimulusZodForm",
        file: "dist/index.umd.js",
        format: "umd",
        globals: {
          "@hotwired/stimulus": "Stimulus",
        },
      },
      {
        file: "dist/index.js",
        format: "es",
      },
    ],
    context: "window",
    plugins: [resolve(), typescript({ removeComments: false })],
  },
  {
    input: "dist/index.d.ts",
    output: [{ file: "dist/types.d.ts", format: "es" }],
    plugins: [dts()],
  },
];
