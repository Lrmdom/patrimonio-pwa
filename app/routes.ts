import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/about", "routes/About.tsx"),
  route("/heritage-test", "routes/heritage-test.tsx"),
  route("/heritage-simple", "routes/heritage-simple.tsx"),
  route("/enable-visual-editing", "routes/enable-visual-editing.tsx"),
  route("api/preview-mode/enable", "routes/api.preview-mode.enable.tsx"),
  route("api/preview-mode/disable", "routes/api.preview-mode.disable.tsx"),
] satisfies RouteConfig;
