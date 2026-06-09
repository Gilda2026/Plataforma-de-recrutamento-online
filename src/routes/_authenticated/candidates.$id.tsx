import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/candidates/$id"
)({
  component: CandidateLayout,
});

function CandidateLayout() {
  return <Outlet />;
}