"use client";

import { useState, useEffect } from "react";

const QUESTION_TYPES = [
  { id: "oneword", label: "One Word" },
  { id: "sa", label: "Short Answer" },
  { id: "fill", label: "Fill in the Blanks" },
  { id: "match", label: "Match Type" },
  { id: "essay", label: "5 Marks (Essay)" },
];

const SUBJECTS = ["Biology", "Chemistry", "Physics", "Maths", "English"];

export default function Home() {
  const [mainTab, setMainTab] = useState("generator");
  
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeQType, setActiveQType] = useState(QUESTION_TYPES[0].id);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  const [questions, setQuestions] = useState<any>(null);
  const [chapterFiles, setChapterFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterFiles, setNewChapterFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Exam State
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [onewordOptions, setOnewordOptions] = useState<Record<number, string[]>>({});
  const [matchOptions, setMatchOptions] = useState<string[]>([]);

  // Fetch folders on load & when subject changes
  useEffect(() => {
    const fetchFolders = async () => {
      setIsLoadingFolders(true);
      try {
        const res = await fetch(`/api/chapters?subject=${encodeURIComponent(activeSubject)}`);
        const data = await res.json();
        if (data.folders) {
          setFolders(data.folders);
          if (data.folders.length > 0) {
            handleFolderSelect(data.folders[0]);
          } else {
            setActiveFolder(null);
            setQuestions(null);
          }
        }
      } catch (err) {
        console.error("Failed to load folders");
      } finally {
        setIsLoadingFolders(false);
      }
    };
    fetchFolders();
  }, [activeSubject]);

  const generateOptions = (qIndex: number, correctAns: string, allQuestions: any[]) => {
    if (!allQuestions || allQuestions.length < 3) return [correctAns, "Option A", "Option B"].sort(() => Math.random() - 0.5);
    const otherAnswers = allQuestions
      .filter((_, i) => i !== qIndex)
      .map(q => q.a)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [correctAns, ...otherAnswers].sort(() => Math.random() - 0.5);
  };

  const handleFolderSelect = async (folder: string) => {
    setActiveFolder(folder);
    setQuestions(null);
    setError("");
    setChapterFiles([]);
    setSelectedFiles([]);
    setExamAnswers({});
    setExamSubmitted(false);
    
    try {
      const res = await fetch(`/api/chapter-questions?subject=${encodeURIComponent(activeSubject)}&folder=${encodeURIComponent(folder)}`);
      const data = await res.json();
      if (res.ok && data) {
        setQuestions(data);
        if (data.oneword) {
          const opts: Record<number, string[]> = {};
          data.oneword.forEach((q: any, i: number) => {
            opts[i] = generateOptions(i, q.a, data.oneword);
          });
          setOnewordOptions(opts);
        }
        if (data.match) {
          setMatchOptions([...data.match.map((q: any) => q.a)].sort(() => Math.random() - 0.5));
        }
      }
      
      const filesRes = await fetch(`/api/chapter-files?subject=${encodeURIComponent(activeSubject)}&folder=${encodeURIComponent(folder)}`);
      const filesData = await filesRes.json();
      if (filesRes.ok && filesData.files) {
        setChapterFiles(filesData.files);
        setSelectedFiles(filesData.files);
      }
    } catch (err) {
      console.error("Failed to check for existing questions or files");
    }
  };

  const handleProcessChapter = async () => {
    if (!activeFolder) return;
    await handleProcessChapterForFolder(activeFolder);
  };

  const handleProcessChapterForFolder = async (folder: string, filesToProcess?: string[]) => {
    setIsProcessing(true);
    setError("");
    setQuestions(null);
    
    try {
      const res = await fetch("/api/process-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, folder: folder, selectedFiles: filesToProcess || selectedFiles }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");
      
      setQuestions(data.data);
      if (data.data.oneword) {
        const opts: Record<number, string[]> = {};
        data.data.oneword.forEach((q: any, i: number) => {
          opts[i] = generateOptions(i, q.a, data.data.oneword);
        });
        setOnewordOptions(opts);
      }
      if (data.data.match) {
        setMatchOptions([...data.data.match.map((q: any) => q.a)].sort(() => Math.random() - 0.5));
      }
      setActiveQType(QUESTION_TYPES[0].id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadChapter = async () => {
    if (!newChapterName || !newChapterFiles || newChapterFiles.length === 0) {
      setError("Please provide a chapter name and select files.");
      return;
    }
    setIsUploading(true);
    setError("");
    setQuestions(null);
    try {
      const formData = new FormData();
      formData.append("subject", activeSubject);
      formData.append("chapterName", newChapterName);
      Array.from(newChapterFiles).forEach(file => {
        formData.append("files", file);
      });
      const res = await fetch("/api/upload-chapter", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload files");
      
      const folderRes = await fetch(`/api/chapters?subject=${encodeURIComponent(activeSubject)}`);
      const folderData = await folderRes.json();
      if (folderData.folders) setFolders(folderData.folders);
      
      setActiveFolder(newChapterName);
      setNewChapterName("");
      setNewChapterFiles(null);
      await handleProcessChapterForFolder(newChapterName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitExam = () => {
    let earned = 0;
    let totalWeight = 0;

    const checkMatch = (user: string, correct: string, weight: number) => {
      totalWeight += weight;
      if (!user) return;
      if (user.toLowerCase().trim() === correct.toLowerCase().trim()) {
        earned += weight;
      }
    };
    
    const checkEssay = (user: string, weight: number) => {
      totalWeight += weight;
      if (!user) return;
      // Simple proxy: give partial/full marks based on length
      const words = user.trim().split(/\s+/).length;
      if (words > 20) earned += weight;
      else if (words > 5) earned += Math.floor(weight / 2);
    };

    if (questions.oneword) {
      questions.oneword.forEach((q: any, i: number) => {
        checkMatch(examAnswers[`oneword_${i}`] || "", q.a, 1);
      });
    }
    if (questions.fill) {
      questions.fill.forEach((q: any, i: number) => {
        checkMatch(examAnswers[`fill_${i}`] || "", q.a, 1);
      });
    }
    if (questions.match) {
      questions.match.forEach((q: any, i: number) => {
        checkMatch(examAnswers[`match_${i}`] || "", q.a, 1);
      });
    }
    if (questions.sa) {
      questions.sa.forEach((q: any, i: number) => {
        checkEssay(examAnswers[`sa_${i}`] || "", 2); // 2 marks each
      });
    }
    if (questions.essay) {
      questions.essay.forEach((q: any, i: number) => {
        checkEssay(examAnswers[`essay_${i}`] || "", 5); // 5 marks each
      });
    }

    const scaledScore = totalWeight > 0 ? Math.round((earned / totalWeight) * 80) : 0;
    setExamScore(scaledScore);
    setExamSubmitted(true);
    window.scrollTo(0, 0);
  };

  return (
    <main className="app-container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", width: "100%" }}>
        <div>
          <h1>StudyGenie 9th Std</h1>
          <p>Local Chapter Question Generator</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            className={`btn ${mainTab === "generator" ? "" : "secondary"}`}
            onClick={() => setMainTab("generator")}
            disabled={mainTab === "exam"}
            style={mainTab === "generator" ? {} : { background: "transparent", border: "1px solid rgba(255,255,255,0.2)", opacity: mainTab === "exam" ? 0.5 : 1, cursor: mainTab === "exam" ? "not-allowed" : "pointer" }}
          >
            📝 Question Generator
          </button>
          <button 
            className={`btn ${mainTab === "exam" ? "" : "secondary"}`}
            onClick={() => setMainTab("exam")}
            style={mainTab === "exam" ? { background: "#8b5cf6" } : { background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            🎓 Take Exam
          </button>
        </div>
      </header>

      {/* Subject Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem", pointerEvents: mainTab === "exam" ? "none" : "auto", opacity: mainTab === "exam" ? 0.5 : 1 }}>
        {SUBJECTS.map(subject => (
          <button
            key={subject}
            onClick={() => setActiveSubject(subject)}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "99px",
              border: activeSubject === subject ? "none" : "1px solid rgba(255,255,255,0.2)",
              background: activeSubject === subject ? "#10b981" : "transparent",
              color: "white",
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: activeSubject === subject ? "bold" : "normal",
              whiteSpace: "nowrap"
            }}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="main-content">
        <aside className="sidebar" style={{ opacity: mainTab === "exam" ? 0.5 : 1, pointerEvents: mainTab === "exam" ? "none" : "auto" }}>
          <h2>{activeSubject} Chapters</h2>
          {isLoadingFolders ? (
            <p style={{ color: "#94a3b8" }}>Loading chapters...</p>
          ) : folders.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No chapters found for {activeSubject}.</p>
          ) : (
            <ul className="chapter-list">
              <li
                className={`chapter-item ${activeFolder === null ? "active" : ""}`}
                onClick={() => { setActiveFolder(null); setQuestions(null); setError(""); }}
                style={{ fontWeight: 'bold', color: '#10b981' }}
              >
                ➕ Create New Chapter
              </li>
              {folders.map((folder) => (
                <li
                  key={folder}
                  className={`chapter-item ${activeFolder === folder ? "active" : ""}`}
                  onClick={() => handleFolderSelect(folder)}
                >
                  📁 {folder}
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="content-area">
          {/* Upload View */}
          {!activeFolder && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Upload to {activeSubject}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Chapter Name</label>
                  <input type="text" value={newChapterName} onChange={e => setNewChapterName(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Select Files</label>
                  <input type="file" multiple onChange={e => setNewChapterFiles(e.target.files)} accept="image/*,application/pdf,text/plain" style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.1)", color: "white" }} />
                </div>
                <button className="btn" onClick={handleUploadChapter} disabled={isUploading || isProcessing} style={{ marginTop: "1rem" }}>
                  {isUploading ? "Uploading files..." : isProcessing ? "Generating questions..." : "🚀 Upload & Generate"}
                </button>
              </div>
            </div>
          )}

          {/* Generator View */}
          {activeFolder && mainTab === "generator" && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>{activeSubject} - {activeFolder}</h3>
              {!questions && !isProcessing && (
                <div className="upload-zone" style={{ cursor: 'default' }}>
                  <p>Questions not yet generated for this chapter.</p>
                  <button className="btn" style={{ marginTop: "1rem" }} onClick={handleProcessChapter}>✨ Generate Questions</button>
                </div>
              )}
              {isProcessing && <div className="upload-zone"><div className="loader"></div><p>Processing...</p></div>}
              {questions && (
                <div style={{ marginTop: "2rem" }}>
                  <div className="question-tabs">
                    {QUESTION_TYPES.map((qt) => (
                      <button key={qt.id} className={`q-tab ${activeQType === qt.id ? "active" : ""}`} onClick={() => setActiveQType(qt.id)}>
                        {qt.label} ({questions[qt.id]?.length || 0})
                      </button>
                    ))}
                  </div>
                  <div className="questions-list">
                    {questions[activeQType]?.length > 0 ? (
                      questions[activeQType].map((q: any, i: number) => (
                        <div key={i} className="question-item">
                          <p className="q">Q: {q.q}</p>
                          <p className="a">A: {q.a}</p>
                        </div>
                      ))
                    ) : <p style={{ color: "#94a3b8" }}>No questions generated for this type.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXAM MODE VIEW */}
          {activeFolder && mainTab === "exam" && (
            <div className="glass-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#8b5cf6" }}>📝 {activeSubject} Exam: {activeFolder}</h3>
                {!examSubmitted && (
                  <button 
                    className="btn secondary" 
                    onClick={() => { setMainTab("generator"); window.scrollTo(0,0); }} 
                    style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.9rem" }}
                  >
                    🔙 Cancel Exam
                  </button>
                )}
              </div>
              
              {!questions ? (
                <p>Please generate questions first in the Question Generator tab.</p>
              ) : (
                <>
                  {examSubmitted && (
                    <div style={{ padding: "2rem", background: "rgba(139, 92, 246, 0.2)", borderRadius: "12px", marginBottom: "2rem", textAlign: "center", border: "1px solid #8b5cf6" }}>
                      <h2>Exam Completed!</h2>
                      <p style={{ fontSize: "1.2rem", margin: "1rem 0" }}>Your Score: <strong>{examScore} / 80</strong></p>
                      <p style={{ color: "#94a3b8" }}>Review your answers and the correct answers below.</p>
                      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                        <button className="btn" onClick={() => { setExamSubmitted(false); setExamAnswers({}); window.scrollTo(0,0); }} style={{ background: "#8b5cf6" }}>Retake Exam</button>
                        <button className="btn secondary" onClick={() => { setExamSubmitted(false); setExamAnswers({}); setMainTab("generator"); window.scrollTo(0,0); }} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>🚪 Exit Exam</button>
                      </div>
                    </div>
                  )}

                  <div className="exam-form" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {QUESTION_TYPES.map(category => {
                      const qs = questions[category.id];
                      if (!qs || qs.length === 0) return null;

                      return (
                        <div key={category.id} style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <h4 style={{ color: "#10b981", fontSize: "1.2rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
                            {category.label}
                          </h4>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {qs.map((q: any, index: number) => {
                              const key = `${category.id}_${index}`;
                              return (
                                <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  <p style={{ fontSize: "1.05rem" }}><strong>Q{index + 1}:</strong> {q.q}</p>
                                  
                                  {/* Inputs */}
                                  {!examSubmitted && (
                                    <>
                                      {category.id === "oneword" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginLeft: "1rem" }}>
                                          {onewordOptions[index]?.map((opt, i) => (
                                            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                              <input 
                                                type="radio" 
                                                name={key} 
                                                value={opt} 
                                                checked={examAnswers[key] === opt}
                                                onChange={e => setExamAnswers({ ...examAnswers, [key]: e.target.value })}
                                              />
                                              {opt}
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {category.id === "fill" && (
                                        <input 
                                          type="text" 
                                          placeholder="Type your answer here..."
                                          value={examAnswers[key] || ""}
                                          onChange={e => setExamAnswers({ ...examAnswers, [key]: e.target.value })}
                                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", width: "100%", maxWidth: "400px" }}
                                        />
                                      )}

                                      {category.id === "match" && (
                                        <select 
                                          value={examAnswers[key] || ""}
                                          onChange={e => setExamAnswers({ ...examAnswers, [key]: e.target.value })}
                                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", width: "100%", maxWidth: "500px" }}
                                        >
                                          <option value="" disabled>-- Select matching definition --</option>
                                          {matchOptions.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      )}

                                      {(category.id === "sa" || category.id === "essay") && (
                                        <textarea 
                                          placeholder="Write your detailed answer here..."
                                          value={examAnswers[key] || ""}
                                          onChange={e => setExamAnswers({ ...examAnswers, [key]: e.target.value })}
                                          rows={category.id === "essay" ? 6 : 3}
                                          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", width: "100%", resize: "vertical" }}
                                        />
                                      )}
                                    </>
                                  )}

                                  {/* Review Mode (After Submission) */}
                                  {examSubmitted && (
                                    <div style={{ padding: "1rem", background: "rgba(0,0,0,0.4)", borderRadius: "8px", borderLeft: "4px solid #8b5cf6" }}>
                                      <p style={{ marginBottom: "0.5rem", color: "#cbd5e1" }}><strong>Your Answer:</strong> <br/>{examAnswers[key] || <em style={{color:"#ef4444"}}>No answer provided</em>}</p>
                                      <p style={{ color: "#10b981" }}><strong>Correct Answer:</strong> <br/>{q.a}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {!examSubmitted && (
                      <button className="btn" onClick={handleSubmitExam} style={{ padding: "1rem 2rem", fontSize: "1.2rem", background: "#8b5cf6", alignSelf: "center", marginTop: "1rem" }}>
                        ✅ Submit Exam for Grading
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
