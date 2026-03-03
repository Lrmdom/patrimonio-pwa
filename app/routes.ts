import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
  layout("routes/locale-layout.tsx", [
    route(":locale", "routes/locale.tsx"),
  ]),
  index("routes/home.tsx"),
  route("/about", "routes/About.tsx"),
  route("/heritage-test", "routes/heritage-test.tsx"),
  route("/heritage-simple", "routes/heritage-simple.tsx"),
  route("/enable-visual-editing", "routes/enable-visual-editing.tsx"),
  route("api/preview-mode/enable", "routes/api.preview-mode.enable.tsx"),
  route("api/preview-mode/disable", "routes/api.preview-mode.disable.tsx"),
  route("api/route", "routes/api.route.tsx"),
] satisfies RouteConfig;
