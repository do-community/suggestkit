# SuggestKit

SuggestKit is a high performance suggestion engine which can scale without losing too much performance. It works by using an internal binary tree to look up each character in a string. From here, we can go through the child of each node. This compares to using the `includes` function which is significantly slower (this is benchmarked on a Ryzen 9 3900x running Ubuntu 20.04.1 LTS with the Linux 5.8 kernel using 20k characters and 30k possibilities, this is certainly a worst case scenario, but not an impossible case over time):

```
stringIncludes x 3.59 ops/sec ±0.23% (13 runs sampled)
tree x 1,135 ops/sec ±1.15% (86 runs sampled)
```

SuggestKit also accounts for ignoring markdown. This is important since you might have code/logs in markdown that generate a lot of false negatives.

SuggestKit is extremely flexible. To use SuggestKit, you simply need to import the library and call it with an array of type `{info: T, key: string}` (we are using TypeScript here, so `T` is a generic meaning it can be of any type, the key is what people will type outside of markdown to get the suggestions) to get the search function. Note you should generate this function once for all of the results you have and then keep it stored in a variable somewhere rather than generating it everytime since the generation can be slow:
```ts
import suggestKit from "suggestkit";

const searcher = suggestKit([
    {
        info: "Hello World!",
        key: "hello",
    },
    {
        info: "This won't show because it's in markdown.",
        key: "hellomd",
    },
]);
```

From here, we can just call the searcher function and we will get `T[]` returned, allowing you to very easily use it in many scenarios:
```ts
console.log(searcher("`hellomd` hello"));
// Returns: ["Hello World!"]
```

SuggestKit also automatically ensures that each `info` part returned is from a unique index.
