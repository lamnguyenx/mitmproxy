import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { yaml } from "@codemirror/lang-yaml";
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";

type ContentRendererProps = {
    content: string;
    maxLines: number;
    showMore: () => void;
    contentType?: string; // Optional content type hint
};

// VSCode Dark theme based on the provided Python style
const vscodeDarkTheme = EditorView.theme({
    "&": {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4"
    },
    ".cm-content": {
        caretColor: "#d4d4d4"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#d4d4d4"
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "#264f78"
    },
    ".cm-gutters": {
        backgroundColor: "#1e1e1e",
        color: "#858585",
        border: "none"
    },
    ".cm-activeLineGutter": {
        backgroundColor: "#333333"
    },
    ".cm-activeLine": {
        backgroundColor: "#282828"
    },
    ".cm-lineNumbers": {
        color: "#858585"
    }
});

// VSCode Dark highlighting style
const vscodeDarkHighlightStyle = HighlightStyle.define([
    // Comments
    { tag: t.comment, color: "#6a9955" },
    { tag: [t.lineComment, t.blockComment], color: "#6a9955" },

    // Keywords (control flow)
    { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: "#ffb0f8" },
    { tag: t.definitionKeyword, color: "#ffb0f8" },
    { tag: t.bool, color: "#569cd6" },
    { tag: t.null, color: "#569cd6" },

    // Functions
    { tag: [t.function(t.name), t.function(t.variableName), t.function(t.propertyName)], color: "#f0f0ba" },
    { tag: t.standard(t.function(t.name)), color: "#f0f0ba" },

    // Types and Classes
    { tag: [t.typeName, t.className, t.namespace], color: "#6be4cc" },
    { tag: t.definition(t.typeName), color: "#6be4cc" },
    { tag: t.definition(t.className), color: "#6be4cc" },
    { tag: t.typeOperator, color: "#6be4cc" },

    // Variables and attributes
    { tag: [t.name, t.variableName], color: "#9cdcfe" },
    { tag: t.attributeName, color: "#9cdcfe" },
    { tag: t.tagName, color: "#9cdcfe" },

    // Constants and enums
    { tag: t.constant(t.name), color: "#4fc1ff" },
    { tag: t.special(t.variableName), color: "#4fc1ff" },

    // Strings
    { tag: t.string, color: "#ffb395" },
    { tag: t.special(t.string), color: "#ffb395" },

    // String escape sequences
    { tag: t.escape, color: "#ffdd94" },
    { tag: t.character, color: "#65baff" },

    // Numbers
    { tag: t.number, color: "#e0ffd0" },
    { tag: t.integer, color: "#e0ffd0" },
    { tag: t.float, color: "#e0ffd0" },

    // Operators
    { tag: t.operator, color: "#d4d4d4" },
    { tag: t.operatorKeyword, color: "#ffb0f8" },

    // Punctuation
    { tag: t.punctuation, color: "#d4d4d4" },
    { tag: t.bracket, color: "#d4d4d4" },
    { tag: t.squareBracket, color: "#d4d4d4" },
    { tag: t.brace, color: "#d4d4d4" },

    // Regex-specific
    { tag: t.regexp, color: "#ffb395" },

    // Literals
    { tag: t.literal, color: "#ffffc2" },

    // Errors
    { tag: t.invalid, color: "#f48771" },

    // JSON specific
    { tag: t.propertyName, color: "#9cdcfe" },
]);

// Combine theme and highlighting style into a single extension
const vscodeDarkExtension = [
    vscodeDarkTheme,
    syntaxHighlighting(vscodeDarkHighlightStyle)
];

const ContentRenderer = React.memo(function ContentRenderer({
    content,
    maxLines,
    showMore,
    contentType,
}: ContentRendererProps) {
    if (content.length === 0) {
        return null;
    }

    const lines = content.split("\n");
    const displayedContent = lines.slice(0, maxLines).join("\n");
    const hasMoreLines = lines.length > maxLines;

    // Determine language extensions based on content or contentType
    const languageExtensions = useMemo((): Extension[] => {
        // If contentType is provided, use it for detection
        if (contentType) {
            if (contentType.includes("json")) return [json()];
            if (contentType.includes("html")) return [html()];
            if (contentType.includes("yaml") || contentType.includes("yml")) return [yaml()];
            // For any other content type, return empty array for plain text
            return [];
        }

        // Otherwise try to detect from content
        const trimmedContent = displayedContent.trim();

        // Check if content is JSON
        if ((trimmedContent.startsWith("{") && trimmedContent.endsWith("}")) ||
            (trimmedContent.startsWith("[") && trimmedContent.endsWith("]"))) {
            try {
                JSON.parse(trimmedContent);
                return [json()];
            } catch (e) {
                // Not valid JSON
            }
        }

        // Check if content is HTML
        if (trimmedContent.startsWith("<") &&
            (trimmedContent.includes("<!DOCTYPE html") ||
                trimmedContent.includes("<html") ||
                trimmedContent.includes("<body"))) {
            return [html()];
        }

        // Check if content is YAML
        if (!trimmedContent.includes("{") &&
            (trimmedContent.includes(": ") ||
                trimmedContent.match(/^[-\s]*[\w]+:/m))) {
            return [yaml()];
        }

        // Default: no specific language highlighting (plain text)
        return [];
    }, [displayedContent, contentType]);

    // Combine VSCode Dark theme with language extensions
    const extensions = useMemo(() => {
        return [...vscodeDarkExtension, ...languageExtensions];
    }, [languageExtensions]);

    return (
        <>
            <CodeMirror
                value={displayedContent}
                height="auto"
                readOnly={true}
                extensions={extensions}
                basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                }}
            />
            {hasMoreLines && (
                <button
                    onClick={showMore}
                    className="btn btn-xs btn-info"
                >
                    <i
                        className="fa fa-angle-double-down"
                        aria-hidden="true"
                    />{" "}
                    Show more
                </button>
            )}
        </>
    );
});

export default ContentRenderer;
