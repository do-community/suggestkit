# SuggestKit

SuggestKit is a high performance suggestion engine which can scale without losing too much performance. It works by using an internal binary tree to look up each character in a string. From here, we can go through the child of each node. This compares to using the `includes` function which is significantly slower (this is benchmarked on a Ryzen 9 3900x running Ubuntu 20.04.1 LTS with the Linux 5.8 kernel using 20k characters and 300 possibilities):

```
stringIncludes x 100 ops/sec ±0.12% (71 runs sampled)
tree x 1,133 ops/sec ±1.24% (89 runs sampled)
```

SuggestKit also accounts for ignoring markdown. This is important since you might have code/logs in markdown that generate a lot of false negatives.

SuggestKit is extremely flexible. To use SuggestKit, you simply need to import the library and call it with an array of type `{info: T, key: string | RegExp}` (we are using TypeScript here, so `T` is a generic meaning it can be of any type, the key is what people will type outside of markdown to get the suggestions) to get the search function. Note you should generate this function once for all of the results you have and then keep it stored in a variable somewhere rather than generating it everytime since the generation can be slow:
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
Note that whilst regex keys are supported, they do not support the binary tree mode and will therefore be significantly slower.

From here, we can just call the searcher with the text we want to search (and `searchInCodeBlocks` which will define if we want to search in code blocks) function and we will get `T[]` returned, allowing you to very easily use it in many scenarios:
```ts
console.log(searcher("`hellomd` hello", searchInCodeBlocks));
// Returns: ["Hello World!"]
```

SuggestKit also automatically ensures that each `info` part returned is from a unique index.
