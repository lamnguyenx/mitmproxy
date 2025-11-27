import React, { useCallback, useState, useEffect } from "react";
import { HTTPFlow, HTTPMessage } from "../../flow";
import { useAppDispatch, useAppSelector } from "../../ducks";
import { setContentViewFor } from "../../ducks/ui/flow";
import { ContentViewData, useContentView } from "./useContentView";
import { useContent } from "./useContent";
import { MessageUtils } from "../../flow/utils";
import FileChooser from "../common/FileChooser";
import * as flowActions from "../../ducks/flows";
import { uploadContent } from "../../ducks/flows";
import Button from "../common/Button";
import CodeEditor from "./CodeEditor";
import ContentRenderer from "./ContentRenderer";
import ViewSelector from "./ViewSelector";
import { copyViewContentDataToClipboard, fetchApi } from "../../utils";

// Local storage keys for persisting toggle states
const TEXT_WRAP_STORAGE_KEY = "mitmproxy_text_wrap_enabled";
const MULTILINE_SPLIT_STORAGE_KEY = "mitmproxy_multiline_split_";

type HttpMessageProps = {
    flow: HTTPFlow;
    message: HTTPMessage;
};

export default function HttpMessage({ flow, message }: HttpMessageProps) {
    const [isEdited, setIsEdited] = useState<boolean>(false);
    if (isEdited) {
        return (
            <HttpMessageEdit
                flow={flow}
                message={message}
                stopEdit={() => setIsEdited(false)}
            />
        );
    } else {
        return (
            <HttpMessageView
                flow={flow}
                message={message}
                startEdit={() => setIsEdited(true)}
            />
        );
    }
}

type HttpMessageEditProps = {
    flow: HTTPFlow;
    message: HTTPMessage;
    stopEdit: () => void;
};

function HttpMessageEdit({ flow, message, stopEdit }: HttpMessageEditProps) {
    const dispatch = useAppDispatch();

    const part = flow.request === message ? "request" : "response";
    const url = MessageUtils.getContentURL(flow, message);
    const content = useContent(url, message.contentHash);
    const [editedContent, setEditedContent] = useState<string>();

    const save = async () => {
        await dispatch(
            flowActions.update(flow, {
                [part]: { content: editedContent || content || "" },
            }),
        );
        stopEdit();
    };
    return (
        <div className="contentview" key="edit">
            <div className="controls">
                <h5>[Editing]</h5>
                <Button
                    onClick={save}
                    icon="fa-check text-success"
                    className="btn-xs"
                >
                    Done
                </Button>
                &nbsp;
                <Button
                    onClick={() => stopEdit()}
                    icon="fa-times text-danger"
                    className="btn-xs"
                >
                    Cancel
                </Button>
            </div>
            <CodeEditor
                initialContent={content || ""}
                onChange={setEditedContent}
            />
        </div>
    );
}

type HttpMessageViewProps = {
    flow: HTTPFlow;
    message: HTTPMessage;
    startEdit: () => void;
};

function HttpMessageView({ flow, message, startEdit }: HttpMessageViewProps) {
    const dispatch = useAppDispatch();
    const part = flow.request === message ? "request" : "response";
    const contentView = useAppSelector(
        (state) => state.ui.flow.contentViewFor[flow.id + part] || "Auto",
    );

    const [maxLines, setMaxLines] = useState<number>(
        useAppSelector((state) => state.options.content_view_lines_cutoff),
    );
    const showMore = useCallback(
        () => setMaxLines(Math.max(1024, maxLines * 2)),
        [maxLines],
    );

    const contentViewData = useContentView(
        flow,
        message,
        contentView,
        maxLines + 1,
        message.contentHash,
    );

    // Get initial text wrap state from localStorage or default to true
    const initialTextWrapState = localStorage.getItem(TEXT_WRAP_STORAGE_KEY) !== 'false';
    const [isTextWrapped, setIsTextWrapped] = useState<boolean>(initialTextWrapState);

    // Track if content has been modified by the multi-line splitter
    const [isContentModified, setIsContentModified] = useState<boolean>(false);

    // Effect to persist text wrap state
    useEffect(() => {
        localStorage.setItem(TEXT_WRAP_STORAGE_KEY, String(isTextWrapped));
    }, [isTextWrapped]);

    // Effect to toggle text wrapping CSS
    useEffect(() => {
        const cmElements = document.querySelectorAll('.cm-editor, .cm-scroller, .cm-content, .cm-line');

        if (isTextWrapped) {
            // Apply text wrapping styles
            cmElements.forEach(el => {
                if (el.classList.contains('cm-editor')) {
                    (el as HTMLElement).style.width = '100%';
                }
                if (el.classList.contains('cm-scroller')) {
                    (el as HTMLElement).style.overflowX = 'hidden';
                    (el as HTMLElement).style.whiteSpace = 'normal';
                }
                if (el.classList.contains('cm-content')) {
                    (el as HTMLElement).style.whiteSpace = 'pre-wrap';
                    (el as HTMLElement).style.wordWrap = 'break-word';
                    (el as HTMLElement).style.overflowWrap = 'break-word';
                    (el as HTMLElement).style.width = '100%';
                }
                if (el.classList.contains('cm-line')) {
                    (el as HTMLElement).style.whiteSpace = 'pre-wrap';
                    (el as HTMLElement).style.wordBreak = 'break-word';
                    (el as HTMLElement).style.width = '100%';
                    (el as HTMLElement).style.maxWidth = '100%';
                    (el as HTMLElement).style.overflowX = 'hidden';
                }
            });

            // Hide gap elements
            document.querySelectorAll('.cm-gap').forEach(el => {
                (el as HTMLElement).style.display = 'none';
            });
        } else {
            // Remove text wrapping styles
            cmElements.forEach(el => {
                if (el.classList.contains('cm-editor')) {
                    (el as HTMLElement).style.width = '';
                }
                if (el.classList.contains('cm-scroller')) {
                    (el as HTMLElement).style.overflowX = '';
                    (el as HTMLElement).style.whiteSpace = '';
                }
                if (el.classList.contains('cm-content')) {
                    (el as HTMLElement).style.whiteSpace = '';
                    (el as HTMLElement).style.wordWrap = '';
                    (el as HTMLElement).style.overflowWrap = '';
                    (el as HTMLElement).style.width = '';
                }
                if (el.classList.contains('cm-line')) {
                    (el as HTMLElement).style.whiteSpace = '';
                    (el as HTMLElement).style.wordBreak = '';
                    (el as HTMLElement).style.width = '';
                    (el as HTMLElement).style.maxWidth = '';
                    (el as HTMLElement).style.overflowX = '';
                }
            });

            // Show gap elements
            document.querySelectorAll('.cm-gap').forEach(el => {
                (el as HTMLElement).style.display = '';
            });
        }
    }, [isTextWrapped]);

    // Check for content modification state on load
    useEffect(() => {
        const storageKey = `${MULTILINE_SPLIT_STORAGE_KEY}${flow.id}${part}`;
        const isModified = localStorage.getItem(storageKey) === 'true';
        setIsContentModified(isModified);
    }, [flow.id, part]);

    let desc: string;
    if (message.contentLength === 0) {
        desc = "No content";
    } else if (contentViewData === undefined) {
        desc = "Loading...";
    } else {
        desc =
            `${contentViewData.view_name} ${contentViewData.description}`.trimEnd();
    }

    return (
        <div className="contentview" key="view">
            <div className="controls">
                <h5>{desc}</h5>
                {contentViewData && contentViewData?.text.length > 0 && (
                    <>
                        <CopyButton flow={flow} message={message} />
                        &nbsp;
                        <ToggleMultiLineButton
                            content={contentViewData?.text ?? ""}
                            flow={flow}
                            message={message}
                            onContentModified={setIsContentModified}
                        />
                        &nbsp;
                        <Button
                            onClick={() => setIsTextWrapped(!isTextWrapped)}
                            icon={isTextWrapped ? "fa-align-left" : "fa-align-justify"}
                            className="btn-xs"
                        >
                            {isTextWrapped ? "Disable Wrap" : "Enable Wrap"}
                        </Button>
                    </>
                )}
                &nbsp;
                <Button onClick={startEdit} icon="fa-edit" className="btn-xs">
                    Edit
                </Button>
                &nbsp;
                <FileChooser
                    icon="fa-upload"
                    text="Replace"
                    title="Upload a file to replace the content."
                    onOpenFile={(content) =>
                        dispatch(uploadContent(flow, content, part))
                    }
                    className="btn btn-default btn-xs"
                />
                &nbsp;
                <ViewSelector
                    value={contentView}
                    onChange={(cv) =>
                        dispatch(
                            setContentViewFor({
                                messageId: flow.id + part,
                                contentView: cv,
                            }),
                        )
                    }
                />
            </div>
            {ViewImage.matches(message) && (
                <ViewImage flow={flow} message={message} />
            )}
            {isContentModified && (
                <div className="alert alert-warning" style={{ padding: '5px', marginTop: '5px', marginBottom: '5px' }}>
                    <i className="fa fa-info-circle"></i> Multi-line strings in this JSON have been split into arrays to enhance readability.
                </div>
            )}
            <ContentRenderer
                content={contentViewData?.text ?? ""}
                maxLines={maxLines}
                showMore={showMore}
            />
        </div>
    );
}

type ToggleMultiLineButtonProps = {
    content: string;
    flow: HTTPFlow;
    message: HTTPMessage;
    onContentModified: (isModified: boolean) => void;
};

function ToggleMultiLineButton({ content, flow, message, onContentModified }: ToggleMultiLineButtonProps) {
    const dispatch = useAppDispatch();
    const part = flow.request === message ? "request" : "response";
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // Storage key for this specific flow and message
    const storageKey = `${MULTILINE_SPLIT_STORAGE_KEY}${flow.id}${part}`;

    // Get initial mode from localStorage
    const initialMode = localStorage.getItem(storageKey) === 'true' ? 'join' : 'split';
    const [mode, setMode] = useState<'split' | 'join'>(initialMode);

    // Function to check if a string contains newlines
    const hasNewlines = (str: string): boolean => {
        return typeof str === 'string' && str.includes('\n');
    };

    // Function to check if an array contains strings that might have been split from newlines
    const looksLikeSplitLines = (arr: any[]): boolean => {
        if (arr.length <= 1) return false;
        // Check if all elements are strings
        return arr.every(item => typeof item === 'string');
    };

    // Function to recursively process JSON and split multi-line strings
    const processJson = (obj: any, operation: 'split' | 'join'): any => {
        if (typeof obj !== 'object' || obj === null) {
            // If it's a string with newlines and we're splitting
            if (operation === 'split' && hasNewlines(obj)) {
                return obj.split('\n');
            }
            return obj;
        }

        // If it's an array
        if (Array.isArray(obj)) {
            // If we're joining and this looks like it might be split lines, join them
            if (operation === 'join' && looksLikeSplitLines(obj)) {
                return obj.join('\n');
            }
            // Otherwise process each element
            return obj.map(item => processJson(item, operation));
        }

        // If it's an object, process each property
        const result: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = processJson(obj[key], operation);
            }
        }
        return result;
    };

    const handleToggleMultiLine = async () => {
        try {
            setIsProcessing(true);

            // Try to parse the content as JSON
            let jsonObj;
            try {
                jsonObj = JSON.parse(content);
            } catch (e) {
                console.error("Content is not valid JSON", e);
                alert("Content is not valid JSON");
                setIsProcessing(false);
                return;
            }

            // Process the JSON based on current mode
            const processedJson = processJson(jsonObj, mode);

            // Convert back to string with pretty formatting
            const processedContent = JSON.stringify(processedJson, null, 2);

            // Update the flow with the processed content
            await dispatch(
                flowActions.update(flow, {
                    [part]: { content: processedContent },
                }),
            );

            // Toggle the mode for next operation
            const newMode = mode === 'split' ? 'join' : 'split';
            setMode(newMode);

            // Update the content modified state
            const isModified = newMode === 'join';
            onContentModified(isModified);

            // Store the state in localStorage
            localStorage.setItem(storageKey, String(isModified));
        } catch (e) {
            console.error("Error processing JSON", e);
            alert("Error processing JSON: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setIsProcessing(false);
        }
    };

    // Only show the button if content appears to be JSON
    const isJsonContent = content.trim().startsWith('{') || content.trim().startsWith('[');
    if (!isJsonContent) {
        return null;
    }

    return (
        <Button
            onClick={handleToggleMultiLine}
            icon={mode === 'split' ? "fa-scissors" : "fa-link"}
            className={`btn-xs ${mode === 'join' ? 'btn-warning' : ''}`}
            disabled={isProcessing}
        >
            {mode === 'split' ? "Split Multi-line" : "Join Lines"}
        </Button>
    );
}

type CopyButtonProps = {
    flow: HTTPFlow;
    message: HTTPMessage;
};

function CopyButton({ flow, message }: CopyButtonProps) {
    const part = flow.request === message ? "request" : "response";
    const contentView = useAppSelector(
        (state) => state.ui.flow.contentViewFor[flow.id + part] || "Auto",
    );

    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isFetchingFullContent, setIsFetchingFullContent] =
        useState<boolean>(false);

    const handleClickCopyButton = async () => {
        try {
            const url = MessageUtils.getContentURL(flow, message, contentView);
            setIsFetchingFullContent(true);

            const response = await fetchApi(url);
            if (!response.ok) {
                throw new Error(
                    `${response.status} ${response.statusText}`.trim(),
                );
            }

            const data: ContentViewData = await response.json();

            await copyViewContentDataToClipboard(data);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetchingFullContent(false);
        }
    };

    return (
        <Button
            onClick={handleClickCopyButton}
            icon="fa-clipboard"
            className="btn-xs"
            disabled={isFetchingFullContent}
        >
            {isCopied ? "Copied!" : "Copy"}
        </Button>
    );
}

const isImage =
    /^image\/(png|jpe?g|gif|webp|vnc.microsoft.icon|x-icon|svg\+xml)$/i;
ViewImage.matches = (msg) =>
    isImage.test(MessageUtils.getContentType(msg) || "");

type ViewImageProps = {
    flow: HTTPFlow;
    message: HTTPMessage;
};

export function ViewImage({ flow, message }: ViewImageProps) {
    return (
        <div className="flowview-image">
            <img
                src={MessageUtils.getContentURL(flow, message)}
                alt="preview"
                className="img-thumbnail"
            />
        </div>
    );
}