// Generates public/globe-land.json: evenly spaced [lat, lng] points on land, for the 3D globe.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);
const pts = [];
const step = 1.6; // degrees of latitude between rows
for (let lat = -58; lat <= 80; lat += step) {
  const circ = Math.cos((lat * Math.PI) / 180);
  const lngStep = step / Math.max(circ, 0.2);
  for (let lng = -180; lng < 180; lng += lngStep) {
    if (geoContains(land, [lng, lat])) pts.push([+lat.toFixed(2), +lng.toFixed(2)]);
  }
}
writeFileSync(new URL("../public/globe-land.json", import.meta.url), JSON.stringify(pts));
console.log("land points:", pts.length);
