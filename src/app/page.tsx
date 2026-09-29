"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [enquiryForm, setEnquiryForm] = useState({ name: "", email: "", contactNumber: "", whatsappNumber: "", standard: "", schoolName: "", message: "" });
  const [loginError, setLoginError] = useState("");
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Please enter username and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("sessionId", data.sessionId);
        localStorage.setItem("userStream", data.stream);
        setLoginError("");
        if (data.role === "student" && data.stream === "mech") {
          router.push("/mech-dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setLoginError(data.error || "Invalid username or password.");
      }
    } catch (err) {
      setLoginError("An error occurred during login. Please try again.");
    }
  };

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enquiryForm.name && enquiryForm.email && enquiryForm.contactNumber && enquiryForm.message) {
      try {
        const res = await fetch("/api/enquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(enquiryForm),
        });

        if (res.ok) {
          setEnquirySuccess(true);
          setEnquiryForm({ name: "", email: "", contactNumber: "", whatsappNumber: "", standard: "", schoolName: "", message: "" });
          setTimeout(() => setEnquirySuccess(false), 3000);
        } else {
          console.error("Failed to submit enquiry");
        }
      } catch (err) {
        console.error("Error submitting enquiry:", err);
      }
    }
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>StudyGenie</h1>
        <p>Your Ultimate Learning Companion</p>
      </header>
      
      <main className="landing-main">
        <section className="hero-section glass-panel">
          <div className="hero-image-container">
            <Image 
              src="/hero.jpg" 
              alt="StudyGenie Hero" 
              width={500} 
              height={500} 
              className="hero-image"
              priority
            />
          </div>
          <div className="hero-content">
            <h2>Unlock Your Potential</h2>
            <p>Experience the magic of learning. Step into a world of knowledge, uncover new insights, and conquer your academic goals with StudyGenie.</p>
          </div>
        </section>

        <div className="forms-container">
          {/* Login Section */}
          <section className="form-section glass-panel">
            <h2>Login</h2>
            <p className="form-subtitle">Access your dashboard</p>
            <form onSubmit={handleLogin} className="landing-form">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  placeholder="Enter your username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="Enter your password"
                />
              </div>
              {loginError && <p className="error-text">{loginError}</p>}
              <button type="submit" className="btn submit-btn">Login</button>
            </form>
          </section>

          {/* Enquiry Section */}
          <section className="form-section glass-panel">
            <h2>Enquiry Form</h2>
            <p className="form-subtitle">Have questions? We're here to help.</p>
            <form onSubmit={handleEnquiry} className="landing-form">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({...enquiryForm, name: e.target.value})}
                  placeholder="Your Name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={enquiryForm.email}
                  onChange={(e) => setEnquiryForm({...enquiryForm, email: e.target.value})}
                  placeholder="Your Email"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Number (with country code)</label>
                <input 
                  type="text" 
                  value={enquiryForm.contactNumber}
                  onChange={(e) => setEnquiryForm({...enquiryForm, contactNumber: e.target.value})}
                  placeholder="+1 234 567 8900"
                  required
                />
              </div>
              <div className="form-group">
                <label>WhatsApp Number</label>
                <input 
                  type="text" 
                  value={enquiryForm.whatsappNumber}
                  onChange={(e) => setEnquiryForm({...enquiryForm, whatsappNumber: e.target.value})}
                  placeholder="WhatsApp Number (Optional)"
                />
              </div>
              <div className="form-group">
                <label>Standard</label>
                <input 
                  type="text" 
                  value={enquiryForm.standard}
                  onChange={(e) => setEnquiryForm({...enquiryForm, standard: e.target.value})}
                  placeholder="e.g. 9th Standard"
                />
              </div>
              <div className="form-group">
                <label>School Name</label>
                <input 
                  type="text" 
                  value={enquiryForm.schoolName}
                  onChange={(e) => setEnquiryForm({...enquiryForm, schoolName: e.target.value})}
                  placeholder="Your School Name"
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({...enquiryForm, message: e.target.value})}
                  placeholder="How can we help you?"
                  rows={4}
                  required
                />
              </div>
              {enquirySuccess && <p className="success-text">Thank you! Your enquiry has been sent.</p>}
              <button type="submit" className="btn submit-btn">Submit Enquiry</button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
