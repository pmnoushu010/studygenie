"use client";

import React, { useState } from "react";

export interface ComputationCell {
  text?: string;
  align?: "left" | "right" | "center";
  isHeading?: boolean;
  isSubheading?: boolean;
  isUnderline?: boolean;
  isItalic?: boolean;
  isItalicPrefix?: boolean; // Formats "Less:" or "Add:" as italics
  borderTop?: boolean;
  borderBottom?: boolean;
  isDoubleBottom?: boolean;
  isBoxed?: boolean;
  colSpan?: number;
  rowSpan?: number;
  style?: React.CSSProperties;
}

export interface ComputationHeader {
  title: string;
  rowSpan?: number;
  colSpan?: number;
  width?: string;
}

export interface ComputationTableData {
  title: string;
  subtitle?: string;
  headers: ComputationHeader[];
  subHeaders?: (string | { text: string; colSpan?: number; width?: string })[];
  columnWidths?: string[];
  rows: (string | ComputationCell | null)[][];
  notes?: string[];
}

interface CAComputationTableProps {
  computation?: ComputationTableData;
  rawText?: string;
  className?: string;
}

export default function CAComputationTable({
  computation,
  rawText,
  className = "",
}: CAComputationTableProps) {
  const [viewMode, setViewMode] = useState<"table" | "text">("table");
  const [copied, setCopied] = useState(false);

  // If no structured computation provided, check if rawText contains markdown table or parseable computation
  const resolvedComputation: ComputationTableData | null =
    computation || (rawText ? tryParseMarkdownTable(rawText) : null);

  const handleCopy = () => {
    let copyContent = "";
    if (resolvedComputation) {
      copyContent += `${resolvedComputation.title}\n`;
      if (resolvedComputation.subtitle) copyContent += `${resolvedComputation.subtitle}\n`;
      copyContent += "=".repeat(60) + "\n";
      
      const colTitles = resolvedComputation.headers.map(h => h.title).join(" | ");
      copyContent += colTitles + "\n";
      if (resolvedComputation.subHeaders) {
        copyContent += resolvedComputation.subHeaders.map(s => typeof s === "string" ? s : s.text).join(" | ") + "\n";
      }
      copyContent += "-".repeat(60) + "\n";

      resolvedComputation.rows.forEach(row => {
        const rowStr = row.map(cell => {
          if (!cell) return "";
          if (typeof cell === "string") return cell;
          return cell.text || "";
        }).join(" | ");
        copyContent += rowStr + "\n";
      });

      if (resolvedComputation.notes && resolvedComputation.notes.length > 0) {
        copyContent += "\nNotes:\n" + resolvedComputation.notes.map(n => `• ${n}`).join("\n");
      }
    } else if (rawText) {
      copyContent = rawText;
    }

    navigator.clipboard.writeText(copyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resolvedComputation) {
    // Fallback: render raw text
    return (
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#e2e8f0" }}>
        {rawText}
      </div>
    );
  }

  // Format cell text with italic "Less:" or "Add:"
  const renderCellContent = (cell: string | ComputationCell | null) => {
    if (!cell) return null;
    const text = typeof cell === "string" ? cell : cell.text || "";
    if (!text) return null;

    const isUnderline = typeof cell !== "string" && cell.isUnderline;
    const isHeading = typeof cell !== "string" && cell.isHeading;
    const isItalic = typeof cell !== "string" && cell.isItalic;

    let formattedContent: React.ReactNode = text;

    // Check for "Less:" or "Add:" prefixes
    if (text.startsWith("Less:") || text.startsWith("less:")) {
      const rest = text.substring(5);
      formattedContent = (
        <span>
          <em style={{ fontStyle: "italic", fontWeight: isHeading ? "bold" : "normal" }}>Less:</em>
          {rest}
        </span>
      );
    } else if (text.startsWith("Add:") || text.startsWith("add:")) {
      const rest = text.substring(4);
      formattedContent = (
        <span>
          <em style={{ fontStyle: "italic", fontWeight: isHeading ? "bold" : "normal" }}>Add:</em>
          {rest}
        </span>
      );
    }

    if (isUnderline) {
      formattedContent = <u style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>{formattedContent}</u>;
    }

    if (isHeading) {
      formattedContent = <strong style={{ fontWeight: 700 }}>{formattedContent}</strong>;
    }

    if (isItalic && !text.startsWith("Less:") && !text.startsWith("Add:")) {
      formattedContent = <em style={{ fontStyle: "italic" }}>{formattedContent}</em>;
    }

    return formattedContent;
  };

  return (
    <div
      className={`ca-computation-wrapper ${className}`}
      style={{
        marginTop: "1rem",
        marginBottom: "1.5rem",
        fontFamily: "'Georgia', 'Times New Roman', 'Liberation Serif', serif",
      }}
    >
      {/* Top action bar: ICAI Module badge & toggle controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
          padding: "0.4rem 0.75rem",
          background: "rgba(30, 41, 59, 0.7)",
          borderRadius: "8px 8px 0 0",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderBottom: "none",
          fontSize: "0.85rem",
          color: "#94a3b8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              background: "#c59f60",
              color: "#271705",
              fontWeight: "bold",
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            ICAI Module Format
          </span>
          <span style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>
            Official Computation Statement
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {rawText && (
            <button
              onClick={() => setViewMode(viewMode === "table" ? "text" : "table")}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e2e8f0",
                padding: "3px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
              title="Toggle statement table or raw text"
            >
              {viewMode === "table" ? "📝 View Text" : "📊 View Table"}
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#10b981" : "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: copied ? "#ffffff" : "#e2e8f0",
              padding: "3px 10px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "0.75rem",
              transition: "all 0.2s ease",
            }}
            title="Copy statement to clipboard"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>
      </div>

      {viewMode === "text" && rawText ? (
        <div
          style={{
            padding: "1.25rem",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "0 0 8px 8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            color: "#e2e8f0",
          }}
        >
          {rawText}
        </div>
      ) : (
        /* ICAI Official Statement Table Container */
        <div
          style={{
            background: "#f5ecd8", // Authentic warm ICAI book parchment
            borderRadius: "0 0 8px 8px",
            padding: "1.25rem 1.5rem 1.5rem 1.5rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            border: "1.5px solid #2b1809",
            overflowX: "auto",
          }}
        >
          {/* Centered Title */}
          <div
            style={{
              textAlign: "center",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#3b1e08", // Rich brown title
              marginBottom: resolvedComputation.subtitle ? "0.25rem" : "0.85rem",
              letterSpacing: "0.2px",
            }}
          >
            {resolvedComputation.title}
          </div>

          {resolvedComputation.subtitle && (
            <div
              style={{
                textAlign: "center",
                fontSize: "0.95rem",
                fontStyle: "italic",
                color: "#5e3816",
                marginBottom: "0.85rem",
              }}
            >
              {resolvedComputation.subtitle}
            </div>
          )}

          {/* Table */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1.5px solid #2b1809",
              backgroundColor: "#f5ecd8",
              color: "#1a0f05",
              fontSize: "0.92rem",
              tableLayout: "fixed",
            }}
          >
            {/* Column Widths */}
            {resolvedComputation.columnWidths && (
              <colgroup>
                {resolvedComputation.columnWidths.map((w, idx) => (
                  <col key={idx} style={{ width: w }} />
                ))}
              </colgroup>
            )}

            {/* Header */}
            <thead>
              {/* Row 1 Headers */}
              <tr>
                {resolvedComputation.headers.map((h, idx) => (
                  <th
                    key={idx}
                    rowSpan={h.rowSpan || 1}
                    colSpan={h.colSpan || 1}
                    style={{
                      backgroundColor: "#cfae77", // Warm sandy khaki/camel
                      color: "#301804",
                      fontWeight: 700,
                      textAlign: "center",
                      padding: "7px 10px",
                      border: "1.5px solid #2b1809",
                      verticalAlign: "middle",
                      fontSize: "0.95rem",
                      width: h.width || undefined,
                    }}
                  >
                    {h.title}
                  </th>
                ))}
              </tr>

              {/* Row 2 Sub-Headers (e.g. ₹ symbols) */}
              {resolvedComputation.subHeaders && resolvedComputation.subHeaders.length > 0 && (
                <tr>
                  {resolvedComputation.subHeaders.map((sub, idx) => {
                    const text = typeof sub === "string" ? sub : sub.text;
                    const colSpan = typeof sub === "string" ? 1 : sub.colSpan || 1;
                    const width = typeof sub === "string" ? undefined : sub.width;
                    return (
                      <th
                        key={idx}
                        colSpan={colSpan}
                        style={{
                          backgroundColor: "#cfae77",
                          color: "#301804",
                          fontWeight: 700,
                          textAlign: "center",
                          padding: "4px 8px",
                          border: "1.5px solid #2b1809",
                          verticalAlign: "middle",
                          fontSize: "0.9rem",
                          width: width,
                        }}
                      >
                        {text}
                      </th>
                    );
                  })}
                </tr>
              )}
            </thead>

            {/* Body */}
            <tbody>
              {resolvedComputation.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => {
                    const isCellObj = typeof cell === "object" && cell !== null;
                    const text = isCellObj ? cell.text || "" : cell || "";
                    const align = isCellObj && cell.align ? cell.align : cIdx === 0 ? "left" : "right";
                    const colSpan = isCellObj ? cell.colSpan || 1 : 1;
                    const rowSpan = isCellObj ? cell.rowSpan || 1 : 1;

                    // Border styling
                    const borderTop = isCellObj && (cell.borderTop || cell.isBoxed || cell.isDoubleBottom);
                    const borderBottom = isCellObj && (cell.borderBottom || cell.isBoxed);
                    const doubleBottom = isCellObj && cell.isDoubleBottom;

                    return (
                      <td
                        key={cIdx}
                        colSpan={colSpan}
                        rowSpan={rowSpan}
                        style={{
                          padding: text ? "5px 10px" : "3px 10px",
                          borderLeft: "1.5px solid #2b1809",
                          borderRight: "1.5px solid #2b1809",
                          borderTop: borderTop ? "1.5px solid #2b1809" : "none",
                          borderBottom: doubleBottom
                            ? "3px double #2b1809"
                            : borderBottom
                            ? "1.5px solid #2b1809"
                            : "none",
                          textAlign: align,
                          verticalAlign: "top",
                          color: "#1a0f05",
                          fontVariantNumeric: "tabular-nums",
                          ...(isCellObj && cell.style ? cell.style : {}),
                        }}
                      >
                        {renderCellContent(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Notes / Footnotes / Legal Provisions */}
          {resolvedComputation.notes && resolvedComputation.notes.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "0.75rem",
                borderTop: "1px dashed #7a502c",
                fontSize: "0.85rem",
                color: "#4a2910",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ fontWeight: 700, color: "#351a05" }}>Notes:</strong>
              <ol style={{ margin: "0.35rem 0 0 1.25rem", padding: 0 }}>
                {resolvedComputation.notes.map((note, nIdx) => (
                  <li key={nIdx} style={{ marginBottom: "0.25rem" }}>
                    {note}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Markdown / Raw text table parser fallback
function tryParseMarkdownTable(text: string): ComputationTableData | null {
  if (!text) return null;
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.startsWith("|") && l.endsWith("|"));

  if (tableLines.length < 3) return null;

  try {
    const rawHeaders = tableLines[0]
      .split("|")
      .map(c => c.trim())
      .filter(Boolean);

    // Skip separator row (tableLines[1])
    const rows: (string | ComputationCell | null)[][] = [];

    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i]
        .split("|")
        .slice(1, -1)
        .map(c => c.trim());

      const rowCells: (string | ComputationCell | null)[] = cells.map((cellText, idx) => {
        if (!cellText) return "";
        const isNum = /^[\d,₹.\-\+ ]+$/.test(cellText.replace(/₹/g, "").trim());
        const align: "left" | "right" = isNum && idx > 0 ? "right" : "left";
        const isUnderline = cellText.startsWith("<u>") || cellText.startsWith("__");
        const cleanText = cellText.replace(/<\/?u>/g, "").replace(/^__/, "").replace(/__$/, "");

        return {
          text: cleanText,
          align,
          isUnderline,
          isHeading: isUnderline || idx === 0 && (cleanText.endsWith(":") || cleanText.includes("Total") || cleanText.includes("Computation")),
        };
      });

      rows.push(rowCells);
    }

    // Try finding title from preceding text
    let title = "Computation Statement";
    for (const l of lines) {
      if (l.toLowerCase().includes("computation") || l.toLowerCase().includes("statement") || l.toLowerCase().includes("calculation")) {
        title = l.replace(/^[#* \-_]+/, "").replace(/[:]+$/, "").trim();
        break;
      }
    }

    return {
      title,
      headers: rawHeaders.map(h => ({ title: h })),
      rows,
    };
  } catch (e) {
    return null;
  }
}
