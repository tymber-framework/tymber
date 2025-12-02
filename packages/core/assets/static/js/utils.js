export async function doFetch({ path, method, payload, query }) {
  const requestHeaders = new Headers();

  requestHeaders.set("x-csrf-token", "1");
  requestHeaders.set("credentials", "include");

  const options = {
    method,
    headers: requestHeaders,
  };

  if (payload) {
    requestHeaders.set("content-type", "application/json");
    options.body = JSON.stringify(payload);
  }

  if (query) {
    path += "?" + new URLSearchParams(query);
  }

  try {
    const res = await fetch(path, options);

    let body;

    if (res.headers.get("content-type") === "application/json") {
      body = await res.json();
    } else if (res.headers.has("content-type")) {
      body = await res.arrayBuffer();
    }

    return {
      ok: res.ok,
      status: res.status,
      headers: res.headers,
      body,
    };
  } catch (_e) {
    // network error
    return {
      ok: false
    };
  }
}

export function snakeToCamelCase(str) {
  return str.replace(/_([a-z])/g, (letter) => letter[1].toUpperCase());
}

export function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export const Toast = {
  props: {
    modelValue: Boolean,
    duration: Number
  },

  emits: ["update:modelValue"],

  data() {
    return {
      show: false
    }
  },

  watch: {
    modelValue() {
      if (this.show) {
        this.$emit("update:modelValue", false);
        return;
      }
      this.show = true;

      setTimeout(() => {
        this.show = false;
        this.$emit("update:modelValue", false);
      }, this.duration || 1000);
    }
  },

  template: `
    <Transition name="toast">
      <div v-if="show" class="toast notification">
        <slot />
      </div>
    </Transition>
  `
}

export const Modal = {
  props: {
    modelValue: Boolean
  },

  emits: ["update:modelValue"],

  methods: {
    onClose() {
      this.$emit("update:modelValue", false);
    }
  },

  template: `
    <div class="modal" :class="{ 'is-active': modelValue }">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <slot name="header" />
          <button class="delete" aria-label="close" @click="onClose()"></button>
        </header>
        <section class="modal-card-body">
          <slot name="content" />
        </section>
      </div>
    </div>
  `
}

export const DataTable = {
  props: {
    headers: Array,
    value: Array,
    options: Object,
    isLoading: Boolean,
  },

  emits: [
    "update:options",
  ],

  methods: {
    updateOptions(header) {
      const newOptions = {
        sortBy: header,
        sortDesc: this.options.sortBy === header ? !this.options.sortDesc : false,
      }
      this.$emit("update:options", newOptions);
    },

    computeValue(item, header) {
      if (!header.value.includes(".")) {
        return item[header.value];
      }
      return header.value.split('.').reduce((obj, key) => obj[key], item);
    }
  },

  template: `
    <table class="table is-fullwidth">
      <thead>
        <tr>
          <th v-for="header of headers">
            <div class="is-flex is-align-items-center">
              <slot :name="'header.' + header.value" :value="header.text">
                {{ header.text }}
              </slot>
              <button class="button is-small ml-1" v-if="header.isSortable" @click="updateOptions(header.value)">
                <span class="icon" :class="{ 'has-text-grey': options.sortBy !== header.value }">
                  <svg>
                    <use xlink:href="#sort-ascending" v-if="options.sortBy === header.value && options.sortDesc"></use>
                    <use xlink:href="#sort-descending" v-else-if="options.sortBy === header.value && !options.sortDesc"></use>
                    <use xlink:href="#sort" v-else></use>
                  </svg>
                </span>
              </button>
            </div>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item of value">
          <td v-for="header of headers">
            <slot :name="'item.' + header.value" :item="item" :value="computeValue(item, header)">
              {{ computeValue(item, header) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  `
}

export function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

export const LazyInput = {
  props: {
    modelValue: String,
    delay: {
      type: Number,
      default: 300
    }
  },

  emits: ["update:modelValue"],

  created() {
    this.onInput = debounce((e) => {
      this.$emit("update:modelValue", e.target.value);
    }, this.delay);
  },

  template: `
    <input :value="modelValue" @input="onInput($event)" />
  `
}
