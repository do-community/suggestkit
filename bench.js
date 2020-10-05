const Benchmark = require("benchmark");
const suggestKit = require("./dist").default;

const suite = new Benchmark.Suite();

const a = [];
for (let index = 0; index < 300; index++) {
    a.push({
        key: "abc".repeat(index + 1),
        info: null,
    });
}

const tree = suggestKit(a);
const stringMatcher = text => {
    const results = [];
    for (const x of a) {
        if (text.includes(x.key)) results.push(x.info);
    }
    return results;
};

const longString = `${"a".repeat(10000)}\`abc\`abc${"a".repeat(10000)}`;

suite.add( 
    "stringIncludes", () => stringMatcher(longString),
).add(
    "tree", () => tree(longString),
).on("cycle", event => {
    console.log(String(event.target));
}).run({async: false});
