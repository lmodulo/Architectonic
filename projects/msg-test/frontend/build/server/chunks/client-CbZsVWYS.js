import './root-D7p37-hI.js';
import { w as writable } from './index-CrsKX1sQ.js';
import './state.svelte-DnIKQJ0i.js';

function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
function goto(url, opts = {}) {
  {
    throw new Error("Cannot call goto(...) on the server");
  }
}

export { goto as g, stores as s };
//# sourceMappingURL=client-CbZsVWYS.js.map
