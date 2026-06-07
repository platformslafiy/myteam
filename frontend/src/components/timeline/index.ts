// Active timeline implementation. Swap this single line to change engines
// (e.g. export { DhtmlxTimeline as Timeline }) without touching page code.
export { CustomTimeline as Timeline } from "./CustomTimeline";
export type {
  TimelineProps,
  TimelineEvent,
  TimelineResource,
  ZoomLevel,
} from "./types";
