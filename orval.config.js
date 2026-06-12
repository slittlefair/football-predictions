module.exports = {
  api: {
    input: "./api/openapi.yaml",
    output: {
      target: "./src/api/generated.ts",
      client: "react-query",
    },
  },
};