import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  allowedOrigins: [
    "http://localhost:3000",
    "https://commeet.netlify.app",
  ],
});

export default http;
