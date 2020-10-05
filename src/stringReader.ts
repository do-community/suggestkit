export default class StringReader {
    private index: number;
    private text: string;
    private searchInCodeBlocks: boolean;

    constructor(text: string, searchInCodeBlocks: boolean) {
        this.text = text;
        this.searchInCodeBlocks = searchInCodeBlocks;
        this.index = 0;
        this.add();
        if (this.index === 1) this.index = 0;
    }

    splitIntoParts() {
        // Set i.
        let i = 0;

        // Set before.
        let before = 0;

        // Defines the parts.
        const parts = [];

        // Iterate through parts.
        let x: number;
        while (i !== this.text.length) {
            // Run the add function.
            x = this.add(i)!;

            // Check if x !== i + 1. If so, add the parts.
            if (i + 1 !== x) {
                // Split here.
                parts.push(this.text.substr(before, i-before+1));

                // Sets before to the new index.
                before = x;
            }

            // Set i.
            i = x;
        }

        // Push the end.
        const end = this.text.substr(before);
        if(end !== "") parts.push(end);

        // Return the parts.
        return parts;
    }

    private add(index?: number) {
        // Defines if index is unset.
        const indexUnset = index === undefined;

        // Set the index as appropriate.
        if (indexUnset) this.index++;
        else index = index! + 1;

        // Get the next character.
        const next = indexUnset ? this.text[this.index] : this.text[index!];

        switch (next) {
            case "\\": {
                // This might be an escape. The best way of checking this is checking the string length.
                if ((indexUnset ? this.index : index) !== this.text.length - 1) {
                    // This isn't the last item of a string, meaning there's a next character. Add 1 to the index.
                    if (indexUnset) this.index++;
                    else index = index! + 1;
                }
                break;
            }
            case "`": {
                // This is possibly markdown which we want to ignore.

                // If searchInCodeBlocks is true, ignore this.
                if (this.searchInCodeBlocks) return index;

                // Get the index. This isn't ideal to reallocate for this.index, but this is a lot rarer, so I'm not too worried.
                if (indexUnset) index = this.index;

                // Get the count up to a maximum of 3.
                // The lack of a for loop here is intentional, I am trying to reduce memory allocations. With large text blocks, this makes a significant difference.
                let tildaCount = 1;
                if (this.text[index!+1] === "`") tildaCount++;
                if (this.text[index!+2] === "`") tildaCount++;

                // Ok, we know we need to at least skip tildaCount more elements now.
                index! += tildaCount;

                // We will now read on from the index. There is the possibility we'll hit EOL doing this. If we do, we know we've gone as far as possible.
                let found = 0;
                for (let x = index!; x < this.text.length; x++) {
                    if (this.text[x] !== "`") {
                        // This isn't what we're looking for. Is found not 0? If so, we should reset it.
                        if (found !== 0) found = 0;
                    } else {
                        // Add 1 to found.
                        found++;

                        // If we're at the end of the tildas, set the end index and break.
                        if (found === tildaCount) {
                            index = x + 1;
                            break;
                        }
                    }
                }

                // Finalise the switch.
                if (indexUnset) this.index = index!;
                break;
            }
        }

        // Return "index".
        return index;
    }

    readNext() {
        if (this.index === this.text.length) return undefined;
        const r = this.text[this.index].toLowerCase();
        this.add();
        return r;
    }

    uncountedIterate(f: ((c: string) => boolean)) {
        for (let index = this.index; index < this.text.length; index = this.add(index)!) {
            if (!f(this.text[index].toLowerCase())) break;
        }
    }
}
