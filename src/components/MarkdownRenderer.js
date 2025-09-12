import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownRenderer.css';

const MarkdownRenderer = ({ content, className = '' }) => {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom styling for different elements
                    h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
                    h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                    h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                    h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
                    h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
                    h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
                    p: ({ children }) => <p className="markdown-p">{children}</p>,
                    strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
                    em: ({ children }) => <em className="markdown-em">{children}</em>,
                    ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
                    ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
                    li: ({ children }) => <li className="markdown-li">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
                    code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                            <code className="markdown-code-inline">{children}</code>
                        ) : (
                            <code className="markdown-code-block">{children}</code>
                        );
                    },
                    pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
                    table: ({ children }) => <table className="markdown-table">{children}</table>,
                    thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
                    tbody: ({ children }) => <tbody className="markdown-tbody">{children}</tbody>,
                    tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
                    th: ({ children }) => <th className="markdown-th">{children}</th>,
                    td: ({ children }) => <td className="markdown-td">{children}</td>,
                    hr: () => <hr className="markdown-hr" />,
                    a: ({ children, href }) => (
                        <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    // Handle line breaks properly
                    br: () => <br className="markdown-br" />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
