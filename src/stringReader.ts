export default class StringReader {
    private index: number;
    private text: string;

    constructor(text: string) {
        this.text = text;
        this.index = 0;
        this.add();
        if (this.index === 1) this.index = 0;
    }

    private add(index?: number) {
        // Set the index as appropriate.
        if (index) index = index + 1;
        else this.index++;

        // Get the next character.
        const next = index ? this.text[index] : this.text[this.index];

        switch (next) {
            case "\\": {
                // This might be an escape. The best way of checking this is checking the string length.
                if ((index || this.index) !== this.text.length - 1) {
                    // This isn't the last item of a string, meaning there's a next character. Add 1 to the index.
                    if (index) index = index + 1;
                    else this.index++;
                }
                break;
            }
            case "`": {
                // This is possibly markdown which we want to ignore.

                // Get the index. This isn't ideal to reallocate for this.index, but this is a lot rarer, so I'm not too worried.
                const indexUnset = !index;
                if (!index) index = this.index;

                // Get the count up to a maximum of 3.
                // The lack of a for loop here is intentional, I am trying to reduce memory allocations. With large text blocks, this makes a significant difference.
                let tildaCount = 1;
                if (this.text[index+1] === "`") tildaCount++;
                if (this.text[index+2] === "`") tildaCount++;

                // Ok, we know we need to at least skip tildaCount more elements now.
                index += tildaCount;

                // We will now read on from the index. There is the possibility we'll hit EOL doing this. If we do, we know we've gone as far as possible.
                let found = 0;
                for (let x = index; x < this.text.length; x++) {
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
                if (indexUnset) this.index = index;
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
