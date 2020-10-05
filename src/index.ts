import StringReader from "./stringReader";

class TreeNode {
    public startCharacter: string | undefined;
    public nodes: TreeNode[];
    public suggestions: number[];

    constructor(startCharacter: string) {
        this.startCharacter = startCharacter;
        this.nodes = [];
        this.suggestions = [];
    }

    insert(reader: StringReader, suggestionIndex: number) {
        // Trampolining to not hit call stack limit.
        let t: TreeNode = this;
        let nextChar: string | undefined;
        let broken = false;
        let node: TreeNode;
        for (;;) {
            nextChar = reader.readNext();
            if (!nextChar) {
                // Ok, we should insert the suggestion here.
                t.suggestions.push(suggestionIndex);
                return;
            }
            for (node of t.nodes) {
                if (node.startCharacter === nextChar) {
                    t = node;
                    broken = true;
                    break;
                }
            }
            if (broken) {
                // Reset broken.
                broken = false;
            } else {
                // Create a new node.
                const newNode = new TreeNode(nextChar!);
                t.nodes.push(newNode);
                t = newNode;
            }
        }
    }
}

class TreeRoot {
    private nodes: TreeNode[];

    constructor() {
        this.nodes = [];
    }

    parse(text: string) {
        // Create the string reader.
        const reader = new StringReader(text);

        // Defines all of the suggestions.
        const suggestions: number[] = [];

        // Iterate through each char of the string.
        for (let c = reader.readNext(); c; c = reader.readNext()) {
            // Check the character.
            let t = this.nodes.find(n => n.startCharacter === c);
            if (t) {
                reader.uncountedIterate((c: string) => {
                    t = t!.nodes.find(n => n.startCharacter === c);
                    if (!t) {
                        // Return to the top of the loop.
                        return false;
                    }

                    // Insert the suggestions of the current node.
                    for (const s of t.suggestions) {
                        if (!suggestions.includes(s)) suggestions.push(s);
                    }

                    // Return true here.
                    return true;
                });
            }
        }

        // Return suggestions.
        return suggestions;
    }

    insert(suggestion: {key: string, index: number}) {
        // Create a reader on the key reader.
        const keyReader = new StringReader(suggestion.key);

        // Read the first char.
        const firstChar = keyReader.readNext();
        if (!firstChar) {
            // First char doesn't exist. Blank key.
            throw new Error("Blank key provided");
        }

        // Create the node if it doesn't exist already.
        for (const node of this.nodes) {
            if (node.startCharacter === firstChar) {
                // Ok, call insert on this and return.
                return node.insert(keyReader, suggestion.index);
            }
        }
        const node = new TreeNode(firstChar);
        this.nodes.push(node);
        node.insert(keyReader, suggestion.index);
    }
}

// Map all the queries to the binary tree so they can be efficiently searched. Note you should only call this once when you know all suggestions to generate the searcher and not on every search query.
export default function createSuggestionsSearcher<T>(suggestions: {info: T, key: string}[]): (text: string) => T[] {
    // Create a root.
    const root = new TreeRoot();

    // Insert each suggestion into the tree.
    for (const suggestion of suggestions.map((x, i) => {
        return {key: x.key, index: i};
    })) root.insert(suggestion);

    // Return a function to get the suggestion.
    return (text: string) => root.parse(text).sort().map(x => suggestions[x].info);
}
