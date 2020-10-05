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
    private regexes: {key: RegExp, index: number}[];

    constructor() {
        this.nodes = [];
        this.regexes = [];
    }

    parse(text: string, searchInCodeBlocks: boolean) {
        // Create the string reader.
        const reader = new StringReader(text, searchInCodeBlocks);

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

        // If there is regex, handle that.
        if (this.regexes.length !== 0) {
            // Check if this is searching in code blocks.
            if (searchInCodeBlocks) {
                // Just iterate through each item.
                for (const regexRes of this.regexes) {
                    // Check if the regex matched. If it did, add to the array.
                    if (text.match(regexRes.key)) {
                        if (!suggestions.includes(regexRes.index)) suggestions.push(regexRes.index);
                    }
                }
            } else {
                // This is a little more complicated. We need to split the string.
                const parts = reader.splitIntoParts();
                for (const regexRes of this.regexes) {
                    // Check if the regex matched. If it did, add to the array.
                    for (const part of parts) {
                        if (part.match(regexRes.key)) {
                            if (!suggestions.includes(regexRes.index)) suggestions.push(regexRes.index);
                            break;
                        }
                    }
                }
            }
        }

        // Return suggestions.
        return suggestions;
    }

    insert(suggestion: {key: string | RegExp, index: number}) {
        // Append to regexes if this is one.
        if (suggestion.key instanceof RegExp) {
            this.regexes.push({key: suggestion.key, index: suggestion.index});
            return;
        }

        // Create a reader on the key reader.
        const keyReader = new StringReader(suggestion.key, true);

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
export default function createSuggestionsSearcher<T>(suggestions: {info: T, key: string | RegExp}[]): (text: string, searchInCodeBlocks: boolean) => T[] {
    // Create a root.
    const root = new TreeRoot();

    // Insert each suggestion into the tree.
    for (const suggestion of suggestions.map((x, i) => {
        return {key: x.key, index: i};
    })) root.insert(suggestion);

    // Return a function to get the suggestion.
    return (text: string, searchInCodeBlocks: boolean) => root.parse(text, searchInCodeBlocks).sort().map(x => suggestions[x].info);
}
