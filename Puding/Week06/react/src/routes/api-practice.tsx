import { createFileRoute } from "@tanstack/react-router";
import { ApiPracticePage } from "../pages/api-practice-page";

export const Route = createFileRoute("/api-practice")({component: ApiPracticePage});
