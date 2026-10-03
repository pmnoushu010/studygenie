"use client";

import React from "react";
import CAComputationTable, { ComputationTableData } from "./CAComputationTable";

interface CAAnswerRendererProps {
  question: {
    q: string;
    a: string;
    computation?: ComputationTableData;
    notes?: string[];
  };
  showQuestion?: boolean;
  questionNumber?: number | string;
  isExamReview?: boolean;
}

export default function CAAnswerRenderer({
  question,
  showQuestion = false,
  questionNumber,
  isExamReview = false,
}: CAAnswerRendererProps) {
  if (!question) return null;

  const hasComputation = !!question.computation || (question.a && question.a.includes("| Particulars"));

  return (
    <div className="ca-answer-renderer" style={{ width: "100%" }}>
      {showQuestion && (
        <p className="q" style={{ whiteSpace: "pre-wrap", marginBottom: "0.75rem", fontSize: "1.05rem" }}>
          {questionNumber !== undefined ? (
            <strong>Q{questionNumber}: </strong>
          ) : (
            <strong>Q: </strong>
          )}
          {question.q}
        </p>
      )}

      {hasComputation ? (
        <div style={{ marginTop: "0.5rem" }}>
          <CAComputationTable computation={question.computation} rawText={question.a} />
        </div>
      ) : (
        <p
          className="a"
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            color: isExamReview ? "#10b981" : "#e2e8f0",
            margin: 0,
          }}
        >
          {question.a}
        </p>
      )}
    </div>
  );
}
