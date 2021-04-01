export function search<M>(
    root: TrieNode<M>,
    word: string,
    editBudget: number,
    editCosts: Costs,
    editedWord = "",
    result = new Map<string, Result<M>>()
): Map<string, Result<M>> {
    if (word.length === 0) {
        return searchCompletionsOnly(root, editedWord, editBudget, editCosts.insert, result);
    }

    if (editBudget < (word.length - root.depth) * editCosts.delete) {
        return result;
    }

    const firstChar = word.charAt(0);
    const wordRemainder = word.slice(1);

    if (root.children.has(firstChar)) {
        search(
            root.children.get(firstChar)!,
            wordRemainder,
            editBudget,
            editCosts,
            editedWord + firstChar,
            result
        );
    }

    if (editBudget >= editCosts.delete) {
        search(root, wordRemainder, editBudget - editCosts.delete, editCosts, editedWord, result);
    }

    for (const [char, child] of root.children) {
        if (editBudget >= editCosts.insert) {
            search(
                child,
                word,
                editBudget - editCosts.insert,
                editCosts,
                editedWord + char,
                result
            );
        }

        if (editBudget >= editCosts.replace) {
            search(
                child,
                wordRemainder,
                editBudget - editCosts.replace,
                editCosts,
                editedWord + char,
                result
            );
        }
    }

    return result;
}

function searchCompletionsOnly<M>(
    root: TrieNode<M>,
    word: string,
    editBudget: number,
    insertionCost: number,
    result: Map<string, Result<M>>
): Map<string, Result<M>> {
    if ("meta" in root) {
        const remainder = Math.max(editBudget, result.get(word)?.remainder ?? 0);
        const resultEntry = { meta: root.meta!, remainder };

        result.set(word, resultEntry);
    }

    if (editBudget >= insertionCost) {
        for (const [char, child] of root.children) {
            searchCompletionsOnly(
                child,
                word + char,
                editBudget - insertionCost,
                insertionCost,
                result
            );
        }
    }

    return result;
}

type Costs = {
    readonly insert: number;
    readonly delete: number;
    readonly replace: number;
};

type Result<M> = {
    readonly meta: M;
    readonly remainder: number;
};

type TrieNode<M> = {
    depth: number;
    meta?: M;
    children: Map<string, TrieNode<M>>;
};
