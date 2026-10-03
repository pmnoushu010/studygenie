"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmojiPicker from 'emoji-picker-react';

const QUESTION_TYPES = [
  { id: "sa", label: "Part A (3 Marks)" },
  { id: "essay", label: "Part B (12 Marks)" },
];

const SEMESTERS = [
  { id: "sem-2", label: "Sem-2", subjects: ["Basic Mechanical Engineering"] },
  { id: "sem-3", label: "Sem-3", subjects: ["Mechanical Engineering"] }
];

export default function Home() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState("generator");
  const [userRole, setUserRole] = useState<string>("student");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState<string>("Student");
  
  const [activeSemester, setActiveSemester] = useState(SEMESTERS[0].id);
  const activeSemesterData = SEMESTERS.find(s => s.id === activeSemester) || SEMESTERS[0];
  const [activeSubject, setActiveSubject] = useState(SEMESTERS[0].subjects[0] || "");
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
  const [isSubjectExam, setIsSubjectExam] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // Active Users State
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);

  // User Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    username: "", password: "", name: "", email: "", mobileNumber: "", whatsappNumber: "", studentId: "", parentName: "", stream: "mech"
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userCreationMessage, setUserCreationMessage] = useState({ text: "", type: "" });

  // Direct Messaging (Inbox) State
  const [adminInboxUser, setAdminInboxUser] = useState<string | null>(null);
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [inboxInput, setInboxInput] = useState("");
  const [isSendingInbox, setIsSendingInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setUserCreationMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUserCreationMessage({ text: "User created successfully!", type: "success" });
        setNewUserForm({ username: "", password: "", name: "", email: "", mobileNumber: "", whatsappNumber: "", studentId: "", parentName: "", stream: "mech" });
        fetchUsers(); // Refresh list
      } else {
        setUserCreationMessage({ text: data.error || "Failed to create user", type: "error" });
      }
    } catch (err: any) {
      setUserCreationMessage({ text: "An error occurred", type: "error" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const fetchInboxMessages = async (otherUser: string) => {
    try {
      const myUsername = localStorage.getItem("userName");
      if (!myUsername) return;

      // Mark messages as read
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: myUsername, senderId: otherUser })
      });

      const res = await fetch(`/api/messages?user1=${encodeURIComponent(myUsername)}&user2=${encodeURIComponent(otherUser)}`);
      const data = await res.json();
      if (res.ok) setInboxMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendInboxMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboxInput.trim()) return;
    
    const myUsername = localStorage.getItem("userName");
    if (!myUsername) return;
    
    const receiverId = userRole === "superadmin" ? adminInboxUser : "pmnoushu010";
    if (!receiverId) return;

    setIsSendingInbox(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: myUsername,
          senderRole: userRole,
          receiverId: receiverId,
          text: inboxInput
        })
      });
      if (res.ok) {
        setInboxInput("");
        fetchInboxMessages(receiverId);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSendingInbox(false);
  };

  // Poll inbox messages if tab is open
  useEffect(() => {
    let interval: any;
    if (mainTab === "inbox") {
      const otherUser = userRole === "superadmin" ? adminInboxUser : "pmnoushu010";
      if (otherUser) {
        fetchInboxMessages(otherUser);
        interval = setInterval(() => fetchInboxMessages(otherUser), 3000); // Poll every 3s
      }
    }
    return () => clearInterval(interval);
  }, [mainTab, adminInboxUser, userRole]);

  // Poll for unread messages globally
  useEffect(() => {
    const fetchUnread = async () => {
      const myUsername = localStorage.getItem("userName");
      if (!myUsername) return;
      try {
        const res = await fetch(`/api/messages/unread?user=${encodeURIComponent(myUsername)}`);
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount);
          setUnreadSenders(data.senders);
        }
      } catch (e) {
        console.error("Failed to fetch unread messages");
      }
    };
    
    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => clearInterval(interval);
  }, []);

  // Ping heartbeat every 60 seconds
  useEffect(() => {
    const pingServer = async () => {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) return;
      try {
        await fetch("/api/auth/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
      } catch (err) {
        console.error("Failed to ping server");
      }
    };

    pingServer(); // Initial ping
    const interval = setInterval(pingServer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch folders on load & when subject changes
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const sessionId = localStorage.getItem("sessionId");
    const name = localStorage.getItem("userName") || "Student";
    
    if (!role || !sessionId) {
      router.push("/");
      return;
    }
    
    setUserRole(role);
    setUserName(name);
    setIsAuthorized(true);
    
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

  // Fetch active users when tab switches to network
  useEffect(() => {
    if (mainTab === "users" && userRole === "superadmin") {
      fetchUsers();
    }
  }, [mainTab, userRole]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) setAllUsers(data.users || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingUsers(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePassword = async (id: string, username: string) => {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword || newPassword.trim() === "") return;
    
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newPassword: newPassword.trim() })
      });
      if (res.ok) {
        alert("Password updated successfully!");
        fetchUsers();
      } else {
        alert("Failed to update password.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating password.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeFolder) return;

    const newUserMsg = { role: "user", text: chatInput };
    const updatedMessages = [...chatMessages, newUserMsg];
    
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/chapter-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          folder: "", // Always subject-wide
          messages: updatedMessages
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages([...updatedMessages, { role: "bot", text: data.reply }]);
      } else {
        setChatMessages([...updatedMessages, { role: "bot", text: `Error: ${data.error}` }]);
      }
    } catch (err) {
      setChatMessages([...updatedMessages, { role: "bot", text: "Failed to connect to the tutor." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleStartSubjectExam = async (level: string) => {
    setIsSubjectExam(true);
    setExamAnswers({});
    setExamSubmitted(false);
    
    try {
      const res = await fetch(`/api/subject-exams?subject=${encodeURIComponent(activeSubject)}`);
      const data = await res.json();
      if (res.ok && data && data[level]) {
        setQuestions(data[level]);
        setMainTab("exam");
      } else {
        alert("Failed to load subject exam.");
        setIsSubjectExam(false);
      }
    } catch (err) {
      alert("Error loading subject exam.");
      setIsSubjectExam(false);
    }
  };

  useEffect(() => {
    if (mainTab === "network" && userRole === "superadmin") {
      const fetchActiveUsers = async () => {
        setIsLoadingNetwork(true);
        try {
          const res = await fetch("/api/auth/active-users");
          const data = await res.json();
          if (data.success) {
            setActiveUsers(data.activeUsers);
          }
        } catch (err) {
          console.error("Failed to fetch active users");
        } finally {
          setIsLoadingNetwork(false);
        }
      };
      fetchActiveUsers();
      
      // Auto-refresh every 30 seconds while on the tab
      const interval = setInterval(fetchActiveUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [mainTab, userRole]);

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
    setIsSubjectExam(false);
    setQuestions(null);
    setError("");
    setChapterFiles([]);
    setSelectedFiles([]);
    setExamAnswers({});
    setExamSubmitted(false);
    
    // We do NOT clear chat messages here so the global chat persists 
    // or we can keep it as is if we want chapter-specific chats to clear.
    // Actually, let's clear it to avoid context confusion.
    setChatMessages([]);
    setChatInput("");
    
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

  const handleRenameChapter = async () => {
    if (!activeFolder) return;
    const newName = window.prompt("Enter new name for the chapter:", activeFolder);
    if (!newName || newName.trim() === "" || newName === activeFolder) return;

    try {
      const res = await fetch("/api/rename-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, oldFolder: activeFolder, newFolder: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename chapter");

      // Refresh folders list
      const folderRes = await fetch(`/api/chapters?subject=${encodeURIComponent(activeSubject)}`);
      const folderData = await folderRes.json();
      if (folderData.folders) setFolders(folderData.folders);

      setActiveFolder(newName);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteChapter = async () => {
    if (!activeFolder) return;
    const confirm = window.confirm(`Are you sure you want to delete the chapter "${activeFolder}"? This cannot be undone.`);
    if (!confirm) return;

    try {
      const res = await fetch("/api/delete-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: activeSubject, folder: activeFolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete chapter");

      // Refresh folders list
      const folderRes = await fetch(`/api/chapters?subject=${encodeURIComponent(activeSubject)}`);
      const folderData = await folderRes.json();
      if (folderData.folders) {
        setFolders(folderData.folders);
        if (folderData.folders.length > 0) {
          handleFolderSelect(folderData.folders[0]);
        } else {
          setActiveFolder(null);
          setQuestions(null);
        }
      }
    } catch (err: any) {
      alert(err.message);
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
        checkEssay(examAnswers[`sa_${i}`] || "", 3); // 3 marks each (Part A)
      });
    }
    if (questions.essay) {
      questions.essay.forEach((q: any, i: number) => {
        checkEssay(examAnswers[`essay_${i}`] || "", 12); // 12 marks each (Part B)
      });
    }

    const scaledScore = totalWeight > 0 ? Math.round((earned / totalWeight) * 80) : 0;
    setExamScore(scaledScore);
    setExamSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (!isAuthorized) {
    return null; // or a loading spinner while redirecting
  }

  return (
    <main className="app-container">
      <header style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem", width: "100%" }}>
        
        {/* Top Row: Title & Profile */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
          <div style={{ textAlign: "left" }}>
            <h1 style={{ marginBottom: "0.2rem", fontSize: "2rem", background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>StudyGenie Mechanical Engineering</h1>
            <p style={{ color: "#94a3b8" }}>Module {userRole === "superadmin" ? "(Admin)" : "(Student)"}</p>
          </div>
          
          <button
            className="profile-pill"
            onClick={() => {
              localStorage.removeItem("userRole");
              localStorage.removeItem("sessionId");
              localStorage.removeItem("userName");
              window.location.href = "/";
            }}
          >
            <div className="avatar">👤</div>
            <div className="user-info">
              <span className="username">{userName}</span>
              <span className="role">{userRole === "superadmin" ? "admin" : "student"}</span>
            </div>
            <span className="logout-text">Logout</span>
          </button>
        </div>

        {/* Stream/App Tabs (Admin Only) */}
        {userRole === "superadmin" && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "-0.5rem" }}>
            <button 
              className="nav-tab"
              onClick={() => router.push("/dashboard")}
              style={{ background: "transparent", color: "#3b82f6", borderColor: "rgba(59, 130, 246, 0.3)", padding: "0.5rem 1rem", fontSize: "1rem" }}
            >
              🏫 9th Std
            </button>
            <button 
              className="nav-tab active"
              style={{ background: "#f59e0b", color: "white", borderColor: "#f59e0b", padding: "0.5rem 1rem", fontSize: "1rem", fontWeight: "bold" }}
            >
              ⚙️ Mech Dashboard
            </button>
            <button 
              className="nav-tab"
              onClick={() => router.push("/ca-dashboard")}
              style={{ background: "transparent", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)", padding: "0.5rem 1rem", fontSize: "1rem" }}
            >
              📊 CA Dashboard
            </button>
          </div>
        )}

        {/* Bottom Row: Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button 
            className={`nav-tab ${mainTab === "generator" ? "active" : ""}`}
            onClick={() => setMainTab("generator")}
            disabled={mainTab === "exam"}
          >
            📝 Module
          </button>
          <button 
            className={`nav-tab ${mainTab === "chat" ? "active chat" : ""}`}
            onClick={() => setMainTab("chat")}
            disabled={mainTab === "exam"}
          >
            💬 SG Tutor
          </button>
          <button 
            className={`nav-tab ${(mainTab === "exam" && !isSubjectExam) ? "active exam" : ""}`}
            onClick={() => setMainTab("exam")}
          >
            🎓 Chapter Exam
          </button>
          <button 
            className={`nav-tab ${(mainTab === "subject-exam" || (mainTab === "exam" && isSubjectExam)) ? "active subject-exam" : ""}`}
            onClick={() => { setMainTab("subject-exam"); setIsSubjectExam(false); }}
          >
            🏆 Subject Exam
          </button>
          <button 
            className={`nav-tab ${mainTab === "inbox" ? "active" : ""}`}
            onClick={() => {
              setMainTab("inbox");
              if (userRole === "superadmin") {
                fetchUsers(); // To populate student list
              }
            }}
            style={mainTab === "inbox" ? { background: "#ec4899", borderColor: "#ec4899", boxShadow: "0 4px 12px rgba(236, 72, 153, 0.4)", position: "relative" } : { position: "relative" }}
          >
            📬 SG Chat
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: "-5px", right: "-10px", background: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "0.75rem", fontWeight: "bold" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {userRole === "superadmin" && (
            <>
              <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)", margin: "0 0.5rem", marginLeft: "auto" }} />
              <button 
                className={`nav-tab ${mainTab === "network" ? "active admin-network" : ""}`}
                onClick={() => setMainTab("network")}
              >
                👥 Active Users
              </button>
              <button 
                className={`nav-tab ${mainTab === "users" ? "active admin-users" : ""}`}
                onClick={() => setMainTab("users")}
              >
                🧑‍🎓 Manage Users
              </button>
            </>
          )}
        </div>
      </header>

      {/* Semester Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem" }}>
        {SEMESTERS.map(sem => (
          <button
            key={sem.id}
            onClick={() => {
              setActiveSemester(sem.id);
              if (sem.subjects.length > 0) {
                setActiveSubject(sem.subjects[0]);
              } else {
                setActiveSubject("");
              }
            }}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
              background: activeSemester === sem.id ? "#3b82f6" : "transparent",
              color: activeSemester === sem.id ? "white" : "#94a3b8",
              border: activeSemester === sem.id ? "none" : "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              fontWeight: activeSemester === sem.id ? "bold" : "normal"
            }}
          >
            {sem.label}
          </button>
        ))}
      </div>

      {/* Subject Tabs */}
      {activeSemesterData.subjects.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem", pointerEvents: mainTab === "exam" ? "none" : "auto", opacity: mainTab === "exam" ? 0.5 : 1 }}>
          {activeSemesterData.subjects.map(subject => (
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
      )}

      <div className="main-content" style={activeSemesterData.subjects.length === 0 ? { display: 'none' } : undefined}>
        <aside className="sidebar" style={{ opacity: mainTab === "exam" ? 0.5 : 1, pointerEvents: mainTab === "exam" ? "none" : "auto" }}>
          <h2>{activeSubject} Chapters</h2>
          {isLoadingFolders ? (
            <p style={{ color: "#94a3b8" }}>Loading chapters...</p>
          ) : folders.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No chapters found for {activeSubject}.</p>
          ) : (
            <ul className="chapter-list">
              {userRole === "superadmin" && (
                <li
                  className={`chapter-item ${activeFolder === null ? "active" : ""}`}
                  onClick={() => { setActiveFolder(null); setQuestions(null); setError(""); }}
                  style={{ fontWeight: 'bold', color: '#10b981' }}
                >
                  ➕ Create New Chapter
                </li>
              )}
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
          {/* Active Users Network View */}
          {mainTab === "network" && userRole === "superadmin" && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#3b82f6" }}>👥 Live Student Connections</h3>
              <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>Showing students who have been active in the last 5 minutes.</p>
              
              {isLoadingNetwork && activeUsers.length === 0 ? (
                <div className="upload-zone"><div className="loader"></div><p>Loading active users...</p></div>
              ) : activeUsers.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.2)" }}>
                  <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>No students are currently active.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {activeUsers.map((u, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "12px", borderLeft: "4px solid #3b82f6" }}>
                      <div>
                        <p style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0, color: "white" }}>👤 {u.username}</p>
                        <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>IP: {u.ipAddress} • Browser: {u.userAgent?.split(" ")[0] || "Unknown"}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {(() => {
                          const isOnline = Date.now() - new Date(u.lastActive).getTime() <= 65000;
                          return (
                            <span style={{ 
                              display: "inline-block", 
                              padding: "0.25rem 0.75rem", 
                              background: isOnline ? "#10b981" : "#f59e0b", 
                              color: "white", 
                              borderRadius: "99px", 
                              fontSize: "0.8rem", 
                              fontWeight: "bold" 
                            }}>
                              {isOnline ? "Online" : "Idle"}
                            </span>
                          );
                        })()}
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.25rem 0 0 0" }}>Last ping: {new Date(u.lastActive).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manage Users View */}
          {mainTab === "users" && userRole === "superadmin" && (
            <div className="glass-panel">
              <h3 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#10b981" }}>🧑‍🎓 Create New User</h3>
              <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", maxWidth: "800px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Username *</label>
                  <input type="text" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Password *</label>
                  <input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Name *</label>
                  <input type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Email Address *</label>
                  <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Mobile Number (with country code) *</label>
                  <input type="text" value={newUserForm.mobileNumber} onChange={e => setNewUserForm({...newUserForm, mobileNumber: e.target.value})} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>WhatsApp Number</label>
                  <input type="text" value={newUserForm.whatsappNumber} onChange={e => setNewUserForm({...newUserForm, whatsappNumber: e.target.value})} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Student ID</label>
                  <input type="text" value={newUserForm.studentId} onChange={e => setNewUserForm({...newUserForm, studentId: e.target.value})} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Parent Name</label>
                  <input type="text" value={newUserForm.parentName} onChange={e => setNewUserForm({...newUserForm, parentName: e.target.value})} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.2)", color: "white" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Stream *</label>
                  <select value={newUserForm.stream} onChange={e => setNewUserForm({...newUserForm, stream: e.target.value})} style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.8)", color: "white" }}>
                    <option value="9th">9th Standard</option>
                    <option value="mech">Mechanical Engineering</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                  <button type="submit" className="btn" disabled={isCreatingUser} style={{ background: "#10b981", width: "100%", maxWidth: "200px" }}>
                    {isCreatingUser ? "Creating..." : "➕ Create User"}
                  </button>
                  {userCreationMessage.text && (
                    <p style={{ marginTop: "1rem", color: userCreationMessage.type === "error" ? "#ef4444" : "#10b981", fontWeight: "bold" }}>
                      {userCreationMessage.text}
                    </p>
                  )}
                </div>
              </form>
              
              <div style={{ marginTop: "3rem" }}>
                <h3 style={{ marginBottom: "1rem", fontSize: "1.25rem", color: "#3b82f6" }}>📋 All Registered Users</h3>
                {isLoadingUsers ? <p>Loading users...</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                          <th style={{ padding: "0.75rem" }}>Username</th>
                          <th style={{ padding: "0.75rem" }}>Name</th>
                          <th style={{ padding: "0.75rem" }}>Stream</th>
                          <th style={{ padding: "0.75rem" }}>Role</th>
                          <th style={{ padding: "0.75rem" }}>Password</th>
                          <th style={{ padding: "0.75rem" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((u, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            <td style={{ padding: "0.75rem" }}>{u.username}</td>
                            <td style={{ padding: "0.75rem" }}>{u.name}</td>
                            <td style={{ padding: "0.75rem" }}>{u.stream === 'mech' ? 'Mechanical' : '9th Standard'}</td>
                            <td style={{ padding: "0.75rem" }}>{u.role}</td>
                            <td style={{ padding: "0.75rem", fontFamily: "monospace", color: "#a78bfa" }}>{u.password}</td>
                            <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                              <button onClick={() => handleUpdatePassword(u._id, u.username)} style={{ background: "#3b82f6", color: "white", padding: "0.25rem 0.75rem", borderRadius: "4px", border: "none", cursor: "pointer" }}>Change PWD</button>
                              <button onClick={() => handleDeleteUser(u._id)} style={{ background: "#ef4444", color: "white", padding: "0.25rem 0.75rem", borderRadius: "4px", border: "none", cursor: "pointer" }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                        {allUsers.length === 0 && (
                          <tr><td colSpan={5} style={{ padding: "1rem", textAlign: "center", color: "#94a3b8" }}>No users found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload View */}
          {!activeFolder && userRole === "superadmin" && mainTab === "generator" && (
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{activeSubject} - {activeFolder}</h3>
                  {userRole === "superadmin" && (
                    <>
                      <button onClick={handleRenameChapter} title="Rename Chapter" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", padding: "0.25rem 0.5rem", color: "white" }}>✏️</button>
                      <button onClick={handleDeleteChapter} title="Delete Chapter" style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", padding: "0.25rem 0.5rem", color: "white" }}>🗑️</button>
                    </>
                  )}
                </div>
                {questions && userRole === "superadmin" && (
                  <button className="btn secondary" onClick={handleProcessChapter} disabled={isProcessing} style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    🔄 Regenerate
                  </button>
                )}
              </div>
              
              {error && (
                <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderLeft: "4px solid #ef4444", borderRadius: "8px", marginBottom: "1.5rem", color: "#ef4444" }}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {!questions && !isProcessing && !error && (
                <div className="upload-zone" style={{ cursor: 'default' }}>
                  <p>Questions not yet generated for this chapter.</p>
                  {userRole === "superadmin" && (
                    <button className="btn" style={{ marginTop: "1rem" }} onClick={handleProcessChapter}>✨ Generate Questions</button>
                  )}
                </div>
              )}
              {!questions && !isProcessing && error && (
                <div className="upload-zone" style={{ cursor: 'default', borderColor: '#ef4444' }}>
                  <p style={{color: '#ef4444'}}>Failed to load or generate questions. Please try again later.</p>
                  {userRole === "superadmin" && (
                    <button className="btn" style={{ marginTop: "1rem" }} onClick={handleProcessChapter}>✨ Try Again</button>
                  )}
                </div>
              )}
              {isProcessing && <div className="upload-zone"><div className="loader"></div><p>Processing...</p></div>}
              {questions && (
                <div style={{ marginTop: "2rem" }}>
                  {questions.summary && (
                    <div style={{ padding: "1.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "12px", borderLeft: "4px solid #10b981", marginBottom: "2rem" }}>
                      <h4 style={{ color: "#10b981", marginBottom: "1rem", fontSize: "1.2rem" }}>📖 Chapter Summary & Important Details</h4>
                      <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#e2e8f0" }}>{questions.summary}</p>
                    </div>
                  )}
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
                          <p className="q" style={{ whiteSpace: "pre-wrap" }}>Q: {q.q}</p>
                          <p className="a" style={{ whiteSpace: "pre-wrap" }}>A: {q.a}</p>
                        </div>
                      ))
                    ) : <p style={{ color: "#94a3b8" }}>No questions generated for this type.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHAT VIEW */}
          {mainTab === "chat" && (
            <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#f59e0b" }}>💬 SG Tutor: {activeSubject}</h3>
              </div>
              
              <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "2rem" }}>
                    <p style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>👋 Hello! I am your SG Tutor for <strong>{activeSubject}</strong>.</p>
                    <p>Ask me any question about the concepts covered in this subject!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ 
                        maxWidth: "80%", 
                        padding: "1rem", 
                        borderRadius: "12px", 
                        background: msg.role === "user" ? "#3b82f6" : "rgba(245, 158, 11, 0.2)",
                        border: msg.role === "bot" ? "1px solid rgba(245, 158, 11, 0.4)" : "none",
                        color: "white"
                      }}>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                          {msg.role === "bot" ? "🤖 " : "👤 "}{msg.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#cbd5e1" }}>
                      <p style={{ margin: 0 }}>🤖 Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder={`Ask a question about this subject...`}
                  disabled={isChatting}
                  style={{ flex: 1, padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: "1rem" }}
                />
                <button type="submit" className="btn" disabled={isChatting || !chatInput.trim()} style={{ background: "#f59e0b", padding: "0 2rem", fontSize: "1.1rem" }}>
                  Send
                </button>
              </form>
            </div>
          )}

          {/* INBOX VIEW */}
          {mainTab === "inbox" && (
            <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#ec4899" }}>📬 SG Chat</h3>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", flex: 1, overflow: "hidden" }}>
                {userRole === "superadmin" && (
                  <div style={{ width: "250px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "bold" }}>Students</div>
                    {allUsers.filter(u => u.role === "student").map(u => (
                      <div 
                        key={u.username} 
                        onClick={() => setAdminInboxUser(u.username)}
                        style={{ padding: "1rem", cursor: "pointer", background: adminInboxUser === u.username ? "rgba(236, 72, 153, 0.2)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)", borderLeft: adminInboxUser === u.username ? "4px solid #ec4899" : "4px solid transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span>{u.name || u.username}</span>
                        {unreadSenders.includes(u.username) && (
                          <span style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }} title="New Message"></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {(!adminInboxUser && userRole === "superadmin") ? (
                    <div style={{ margin: "auto", color: "#94a3b8" }}>Select a student to start chatting</div>
                  ) : (
                    <>
                      <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        👤 Chatting with {userRole === "superadmin" ? adminInboxUser : "Admin"}
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {inboxMessages.length === 0 ? (
                          <div style={{ textAlign: "center", color: "#94a3b8", marginTop: "2rem" }}>No messages yet. Send a message to start the conversation!</div>
                        ) : (
                          inboxMessages.map((msg, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: msg.senderId === userName ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: msg.senderId === userName ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                                <div style={{ 
                                  padding: "0.5rem 0.75rem", 
                                  borderRadius: msg.senderId === userName ? "12px 12px 0 12px" : "12px 12px 12px 0", 
                                  background: msg.senderId === userName ? "#ec4899" : "rgba(255,255,255,0.1)",
                                  color: "white",
                                  fontSize: "0.95rem"
                                }}>
                                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                                </div>
                                <span style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "0.25rem" }}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div style={{ position: "relative" }}>
                        {showEmojiPicker && (
                          <div style={{ position: "absolute", bottom: "100%", left: "1rem", zIndex: 50, marginBottom: "0.5rem" }}>
                            <EmojiPicker 
                              onEmojiClick={(emojiData) => setInboxInput(prev => prev + emojiData.emoji)} 
                              theme={"dark" as any}
                            />
                          </div>
                        )}
                        <form onSubmit={handleSendInboxMessage} style={{ display: "flex", gap: "0.5rem", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                          <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "0 1rem", fontSize: "1.2rem", cursor: "pointer" }}
                          >
                            😀
                          </button>
                          <input 
                            type="text" 
                            value={inboxInput} 
                            onChange={e => setInboxInput(e.target.value)} 
                            onFocus={() => setShowEmojiPicker(false)}
                            placeholder="Type your message..."
                            disabled={isSendingInbox}
                            style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: "0.95rem" }}
                          />
                          <button type="submit" className="btn" disabled={isSendingInbox || !inboxInput.trim()} style={{ background: "#ec4899", padding: "0 1.5rem" }} onClick={() => setShowEmojiPicker(false)}>
                            Send
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBJECT EXAM SELECTOR */}
          {mainTab === "subject-exam" && (
            <div className="glass-panel" style={{ textAlign: "center", padding: "3rem" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#eab308" }}>🏆 {activeSubject} - Subject Exam</h2>
              <p style={{ color: "#94a3b8", marginBottom: "3rem", fontSize: "1.1rem" }}>Select the difficulty level for the comprehensive subject exam. The exam contains questions from all important chapters.</p>
              <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                <button className="btn" onClick={() => handleStartSubjectExam("level1")} style={{ background: "#10b981", fontSize: "1.2rem", padding: "1rem 2rem" }}>🟢 Level 1 Exam</button>
                <button className="btn" onClick={() => handleStartSubjectExam("level2")} style={{ background: "#ef4444", fontSize: "1.2rem", padding: "1rem 2rem" }}>🔴 Level 2 Exam</button>
              </div>
            </div>
          )}

          {/* EXAM MODE VIEW */}
          {(activeFolder || isSubjectExam) && mainTab === "exam" && (
            <div className="glass-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", color: "#8b5cf6" }}>📝 {activeSubject} Exam: {isSubjectExam ? "Comprehensive (All Chapters)" : activeFolder}</h3>
                {!examSubmitted && (
                  <button 
                    className="btn secondary" 
                    onClick={() => { 
                      if (isSubjectExam) {
                        setIsSubjectExam(false);
                        setMainTab("subject-exam");
                      } else {
                        setMainTab("generator");
                      }
                      window.scrollTo(0,0); 
                    }} 
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
                                      <p style={{ color: "#10b981", whiteSpace: "pre-wrap" }}><strong>Correct Answer:</strong> <br/>{q.a}</p>
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
