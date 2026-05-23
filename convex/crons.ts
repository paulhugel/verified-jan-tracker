import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "Sync verified Jan Apple Silicon issues",
  { hours: 1 },
  api.github.syncJanAppleSiliconIssues,
  {},
);

export default crons;
