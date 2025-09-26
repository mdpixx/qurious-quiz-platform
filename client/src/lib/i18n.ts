interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    // Header
    "header.title": "Qurious",
    "header.language": "EN",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.ai_builder": "AI Quiz Builder",
    "nav.host_live": "Host Live",
    "nav.join_quiz": "Join Quiz",
    "nav.results": "Analytics",
    
    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.subtitle": "Ready to create engaging quizzes for your team?",
    "dashboard.total_quizzes": "Total Quizzes",
    "dashboard.players_month": "Players This Month",
    "dashboard.avg_score": "Avg. Score",
    "dashboard.best_streak": "Best Streak",
    "dashboard.create_ai": "Create with AI",
    "dashboard.create_ai_desc": "Upload docs or paste content to generate questions instantly",
    "dashboard.host_live": "Host Live Quiz",
    "dashboard.host_live_desc": "Start a real-time quiz session for your audience",
    "dashboard.create_manual": "Create Manually",
    "dashboard.create_manual_desc": "Build your quiz question by question",
    "dashboard.recent_quizzes": "Recent Quizzes",
    "dashboard.view_all": "View All",
    
    // AI Builder
    "ai_builder.title": "AI Quiz Builder",
    "ai_builder.subtitle": "Generate quiz questions from your content using AI",
    "ai_builder.content_source": "Choose Your Content Source",
    "ai_builder.upload_document": "Upload Document",
    "ai_builder.upload_desc": "PDF, Word, PowerPoint",
    "ai_builder.web_url": "Web URL",
    "ai_builder.url_desc": "Article, Wikipedia, Blog",
    "ai_builder.paste_text": "Paste Text",
    "ai_builder.text_desc": "Notes, Articles, Content",
    "ai_builder.generation_settings": "Generation Settings",
    "ai_builder.question_types": "Question Types",
    "ai_builder.multiple_choice": "Multiple Choice",
    "ai_builder.true_false": "True/False",
    "ai_builder.short_answer": "Short Answer",
    "ai_builder.poll_questions": "Poll Questions",
    "ai_builder.num_questions": "Number of Questions",
    "ai_builder.difficulty": "Difficulty Level",
    "ai_builder.generate": "Generate Quiz Questions",
    "ai_builder.generating": "Generating Questions...",
    
    // Host Live
    "host.title": "Host Live Quiz",
    "host.subtitle": "Set up your live quiz session",
    "host.select_quiz": "Select Quiz",
    "host.game_settings": "Game Settings",
    "host.game_mode": "Game Mode",
    "host.speed_mode": "Speed Mode (Classic)",
    "host.accuracy_mode": "Accuracy Mode",
    "host.team_mode": "Team Mode",
    "host.time_per_question": "Time per Question",
    "host.features": "Features",
    "host.streak_bonuses": "Streak bonuses",
    "host.confetti": "Confetti celebrations",
    "host.sound_effects": "Sound effects",
    "host.show_answers": "Show answers after each question",
    "host.create_session": "Create Live Session",
    "host.session_details": "Session Details",
    "host.join_code": "Join Code",
    "host.participants": "Participants",
    "host.start_quiz": "Start Quiz",
    "host.pause_session": "Pause Session",
    "host.end_session": "End Session",
    
    // Join Quiz
    "join.title": "Join Quiz",
    "join.subtitle": "Enter your quiz code to get started",
    "join.enter_code": "Enter quiz code (e.g., ABC123)",
    "join.nickname": "Your nickname",
    "join.join_button": "Join Quiz",
    "join.scan_qr": "Scan QR Code",
    "join.youre_in": "You're In!",
    "join.waiting": "Waiting for the quiz to start...",
    "join.other_players": "Other Players",
    
    // Results
    "results.title": "Quiz Analytics",
    "results.subtitle": "Detailed insights from your quiz sessions",
    "results.recent_sessions": "Recent Sessions",
    "results.export_csv": "Export CSV",
    "results.performance_overview": "Performance Overview",
    "results.total_sessions": "Total Sessions",
    "results.total_players": "Total Players",
    "results.completion_rate": "Completion Rate",
    "results.avg_session_time": "Avg. Session Time",
    "results.top_performers": "Top Performers",
    "results.question_performance": "Question Performance",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.create": "Create",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.close": "Close",
  },
  hi: {
    // Header
    "header.title": "क्यूरियस",
    "header.language": "हि",
    
    // Navigation
    "nav.dashboard": "डैशबोर्ड",
    "nav.ai_builder": "AI क्विज़ बिल्डर",
    "nav.host_live": "लाइव होस्ट",
    "nav.join_quiz": "क्विज़ जॉइन करें",
    "nav.results": "परिणाम",
    
    // Dashboard
    "dashboard.welcome": "वापसी पर स्वागत",
    "dashboard.subtitle": "अपनी टीम के लिए आकर्षक क्विज़ बनाने के लिए तैयार हैं?",
    "dashboard.total_quizzes": "कुल क्विज़",
    "dashboard.players_month": "इस महीने खिलाड़ी",
    "dashboard.avg_score": "औसत स्कोर",
    "dashboard.best_streak": "सर्वश्रेष्ठ स्ट्रीक",
    "dashboard.create_ai": "AI के साथ बनाएं",
    "dashboard.create_ai_desc": "तुरंत प्रश्न जेनरेट करने के लिए दस्तावेज़ अपलोड करें या सामग्री पेस्ट करें",
    "dashboard.host_live": "लाइव क्विज़ होस्ट करें",
    "dashboard.host_live_desc": "अपने दर्शकों के लिए रियल-टाइम क्विज़ सत्र शुरू करें",
    "dashboard.create_manual": "मैन्युअल रूप से बनाएं",
    "dashboard.create_manual_desc": "अपना क्विज़ प्रश्न दर प्रश्न बनाएं",
    "dashboard.recent_quizzes": "हाल की क्विज़",
    "dashboard.view_all": "सभी देखें",
    
    // Common
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफलता",
    "common.cancel": "रद्द करें",
    "common.save": "सेव करें",
    "common.edit": "संपादित करें",
    "common.delete": "हटाएं",
    "common.create": "बनाएं",
    "common.back": "वापस",
    "common.next": "अगला",
    "common.previous": "पिछला",
    "common.close": "बंद करें",
  }
};

let currentLanguage = "en";

export function setLanguage(lang: "en" | "hi") {
  currentLanguage = lang;
  localStorage.setItem("qurious-language", lang);
}

export function getCurrentLanguage(): "en" | "hi" {
  return currentLanguage as "en" | "hi";
}

export function initializeLanguage() {
  const saved = localStorage.getItem("qurious-language");
  if (saved && (saved === "en" || saved === "hi")) {
    currentLanguage = saved;
  }
}

export function t(key: string, fallback?: string): string {
  const translation = translations[currentLanguage]?.[key];
  return translation || fallback || key;
}

// Initialize language on module load
if (typeof window !== "undefined") {
  initializeLanguage();
}
