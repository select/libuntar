import { getEntries as n } from "./libuntar.js";
import { untar as u } from "./libuntar.js";
async function i(t) {
  const r = await new Response(
    t.stream().pipeThrough(new DecompressionStream("gzip"))
  ).arrayBuffer();
  return {
    arrayBuffer: r,
    entries: n(r).filter(
      // Filter out garbage files from MacOS
      ({ name: e }) => !(e.includes("._") || e.includes("PaxHeader"))
    )
  };
}
export {
  n as getEntries,
  u as untar,
  i as untgz
};
//# sourceMappingURL=untgz.js.map
