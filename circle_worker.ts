import { type LayoutOptions, solve_layout, to_wire } from "./circle_layouts";

// Lays circles out off the page's thread: each message is a layout's options with an id, and the
// reply is the layout, with its items by number (see circle_layouts.ts). Served as
// /circle_worker.js by server.ts.

declare const self: Worker;

self.onmessage = (event: MessageEvent<{ id: number; options: LayoutOptions }>) => {
  const { id, options } = event.data;
  self.postMessage({ id, laid: to_wire(solve_layout(options), options.rings) });
};
