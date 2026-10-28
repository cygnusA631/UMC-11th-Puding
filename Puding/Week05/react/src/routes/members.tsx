import { createFileRoute } from "@tanstack/react-router";
import { MemberPage } from "../pages/members/member-page";

export const Route = createFileRoute("/members")({
  component: MemberPage,
});
