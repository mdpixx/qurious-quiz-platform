import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Link as LinkIcon, Edit, Sparkles, Loader2, Check, X, Save } from "lucide-react";

type ContentSource = "upload" | "url" | "text";

interface GenerationOptions {
  questionTypes: string[];
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  language: string;
}

interface GeneratedQuestion {
  id?: string;
  question: string;
  type: "mcq" | "true_false" | "short_answer" | "poll";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  source?: string;
  category?: string;
}

export default function AIBuilder() {
  const { toast } = useToast();
  const [contentSource, setContentSource] = useState<ContentSource>("upload");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [options, setOptions] = useState<GenerationOptions>({
    questionTypes: ["mcq", "true_false"],
    questionCount: 15,
    difficulty: "mixed",
    language: "en"
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showGenerated, setShowGenerated] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (data: { content?: string; url?: string; options: GenerationOptions }) => {
      const endpoint = data.url ? "/api/ai/generate-from-url" : "/api/ai/generate-from-text";
      const payload = data.url ? { url: data.url, options: data.options } : { content: data.content, options: data.options };
      
      const response = await apiRequest("POST", endpoint, payload);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuestions(data.questions || []);
      setShowGenerated(true);
      toast({
        title: "Questions Generated",
        description: `Successfully generated ${data.questions?.length || 0} questions.`
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate questions. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerate = () => {
    if (contentSource === "url" && !url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL.",
        variant: "destructive"
      });
      return;
    }

    if (contentSource === "text" && !content.trim()) {
      toast({
        title: "Content Required", 
        description: "Please paste some content to generate questions from.",
        variant: "destructive"
      });
      return;
    }

    if (contentSource === "upload" && !selectedFile) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    if (contentSource === "upload" && selectedFile) {
      // For file upload, we'll read the file content as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        generateMutation.mutate({ content: fileContent, options });
      };
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the uploaded file.",
          variant: "destructive"
        });
      };
      reader.readAsText(selectedFile);
    } else {
      const payload = contentSource === "url" 
        ? { url: url.trim(), options }
        : { content: content.trim(), options };
      generateMutation.mutate(payload);
    }
  };

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setOptions(prev => ({
        ...prev,
        questionTypes: [...prev.questionTypes, type]
      }));
    } else {
      setOptions(prev => ({
        ...prev,
        questionTypes: prev.questionTypes.filter(t => t !== type)
      }));
    }
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['text/plain', 'text/csv', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|csv|pdf|doc|docx)$/i)) {
      toast({
        title: "File Type Not Supported",
        description: "Please upload a text file, CSV, PDF, or Word document.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `Selected: ${file.name}`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight break-words text-wrap">{t("ai_builder.title")}</h1>
        <p className="text-lg sm:text-xl text-muted-foreground font-medium break-words text-wrap">{t("ai_builder.subtitle")}</p>
      </div>

      {/* Content Input Section */}
      <Card className="mb-8 card-elevated rounded-2xl border-0 shadow-lg">
        <CardHeader className="p-8 pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            {t("ai_builder.content_source")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <SourceButton
              icon={<Upload className="h-6 w-6" />}
              title={t("ai_builder.upload_document")}
              description={t("ai_builder.upload_desc")}
              active={contentSource === "upload"}
              onClick={() => setContentSource("upload")}
              testId="button-source-upload"
            />
            <SourceButton
              icon={<LinkIcon className="h-6 w-6" />}
              title={t("ai_builder.web_url")}
              description={t("ai_builder.url_desc")}
              active={contentSource === "url"}
              onClick={() => setContentSource("url")}
              testId="button-source-url"
            />
            <SourceButton
              icon={<Edit className="h-6 w-6" />}
              title={t("ai_builder.paste_text")}
              description={t("ai_builder.text_desc")}
              active={contentSource === "text"}
              onClick={() => setContentSource("text")}
              testId="button-source-text"
            />
          </div>

          {/* Content Interfaces */}
          {contentSource === "upload" && (
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 hover:border-primary/50 ${
                isDragOver 
                  ? "border-primary bg-primary/10 shadow-lg" 
                  : selectedFile 
                    ? "border-success bg-success/5 shadow-md" 
                    : "border-border bg-gradient-to-br from-background to-muted/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDragOver 
                  ? "bg-primary/20" 
                  : selectedFile 
                    ? "bg-success/20" 
                    : "bg-muted/50"
              }`}>
                <Upload className={`h-8 w-8 ${
                  isDragOver 
                    ? "text-primary" 
                    : selectedFile 
                      ? "text-success" 
                      : "text-muted-foreground"
                }`} />
              </div>
              {selectedFile ? (
                <>
                  <p className="text-xl font-bold mb-2 text-success">File Selected ✓</p>
                  <p className="text-base text-muted-foreground mb-6 font-medium">{selectedFile.name}</p>
                  <div className="flex justify-center space-x-4">
                    <input
                      type="file"
                      id="file-input"
                      className="hidden"
                      accept=".txt,.csv,.pdf,.doc,.docx"
                      onChange={handleFileInputChange}
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-xl"
                      onClick={() => document.getElementById('file-input')?.click()}
                      data-testid="button-choose-different-file"
                    >
                      Choose Different File
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="rounded-xl"
                      onClick={() => setSelectedFile(null)}
                      data-testid="button-remove-file"
                    >
                      Remove File
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold mb-2">
                    {isDragOver ? "Drop your file here" : "Drag & drop your files here"}
                  </p>
                  <p className="text-base text-muted-foreground mb-6">or click to browse</p>
                  <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    accept=".txt,.csv,.pdf,.doc,.docx"
                    onChange={handleFileInputChange}
                  />
                  <Button 
                    className="btn-primary-lg rounded-xl"
                    onClick={() => document.getElementById('file-input')?.click()}
                    data-testid="button-choose-files"
                  >
                    Choose Files
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4 font-medium">
                    Supports: TXT, CSV, PDF, DOC, DOCX (max 10MB)
                  </p>
                </>
              )}
            </div>
          )}

          {contentSource === "url" && (
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="Enter URL (e.g., https://wikipedia.org/article...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="text-lg touch-target rounded-xl p-4 border-2 focus:border-primary"
                data-testid="input-url"
              />
            </div>
          )}

          {contentSource === "text" && (
            <Textarea
              placeholder="Paste your content here..."
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none rounded-xl border-2 focus:border-primary text-base p-4"
              data-testid="textarea-content"
            />
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card className="mb-10 card-elevated rounded-2xl border-0 shadow-lg">
        <CardHeader className="p-8 pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-accent to-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            {t("ai_builder.generation_settings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <Label className="text-sm font-medium mb-3 block">{t("ai_builder.question_types")}</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mcq"
                    checked={options.questionTypes.includes("mcq")}
                    onCheckedChange={(checked) => handleQuestionTypeChange("mcq", checked as boolean)}
                    data-testid="checkbox-mcq"
                  />
                  <Label htmlFor="mcq" className="text-sm">{t("ai_builder.multiple_choice")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="true_false"
                    checked={options.questionTypes.includes("true_false")}
                    onCheckedChange={(checked) => handleQuestionTypeChange("true_false", checked as boolean)}
                    data-testid="checkbox-true-false"
                  />
                  <Label htmlFor="true_false" className="text-sm">{t("ai_builder.true_false")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="short_answer"
                    checked={options.questionTypes.includes("short_answer")}
                    onCheckedChange={(checked) => handleQuestionTypeChange("short_answer", checked as boolean)}
                    data-testid="checkbox-short-answer"
                  />
                  <Label htmlFor="short_answer" className="text-sm">{t("ai_builder.short_answer")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="poll"
                    checked={options.questionTypes.includes("poll")}
                    onCheckedChange={(checked) => handleQuestionTypeChange("poll", checked as boolean)}
                    data-testid="checkbox-poll"
                  />
                  <Label htmlFor="poll" className="text-sm">{t("ai_builder.poll_questions")}</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("ai_builder.num_questions")}</Label>
                <Select
                  value={options.questionCount.toString()}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, questionCount: parseInt(value) }))}
                >
                  <SelectTrigger className="touch-target" data-testid="select-question-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="25">25 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">{t("ai_builder.difficulty")}</Label>
                <Select
                  value={options.difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard" | "mixed") => 
                    setOptions(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger className="touch-target" data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="medium">Intermediate</SelectItem>
                    <SelectItem value="hard">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="text-center mb-12">
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || options.questionTypes.length === 0}
          className="btn-primary-lg text-primary-foreground rounded-2xl hover:shadow-2xl transition-all duration-300 touch-target shadow-xl text-xl px-12 py-6"
          data-testid="button-generate"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-6 w-6 mr-3 animate-spin" />
              {t("ai_builder.generating")}
            </>
          ) : (
            <>
              <Sparkles className="h-6 w-6 mr-3" />
              {t("ai_builder.generate")}
            </>
          )}
        </Button>
      </div>

      {/* Generated Questions */}
      {showGenerated && (
        <Card className="card-elevated rounded-2xl border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
            <CardTitle className="text-2xl font-bold">Generated Questions</CardTitle>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="rounded-xl" data-testid="button-edit-all">
                <Edit className="h-4 w-4 mr-2" />
                Edit All
              </Button>
              <Button className="btn-secondary-lg rounded-xl" data-testid="button-save-quiz">
                <Save className="h-5 w-5 mr-2" />
                Save Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {generatedQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">No questions generated yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {generatedQuestions.map((question, index) => (
                  <QuestionCard
                    key={index}
                    question={question}
                    index={index}
                    onRemove={() => removeQuestion(index)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SourceButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
  testId: string;
}

function SourceButton({ icon, title, description, active, onClick, testId }: SourceButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 text-center hover:border-primary hover:shadow-md transition-all duration-300 touch-target ${
        active
          ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-md"
          : "border-border bg-gradient-to-br from-card to-background hover:bg-accent/5"
      }`}
      data-testid={testId}
    >
      <div className="mb-4 flex justify-center">
        <div className={`p-3 rounded-full ${
          active ? "bg-primary/20" : "bg-muted/50"
        }`}>
          {icon}
        </div>
      </div>
      <p className="font-semibold text-lg mb-2 break-words text-wrap">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed break-words text-wrap">{description}</p>
    </button>
  );
}

interface QuestionCardProps {
  question: GeneratedQuestion;
  index: number;
  onRemove: () => void;
}

function QuestionCard({ question, index, onRemove }: QuestionCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success/20 text-success";
      case "medium": return "bg-warning/20 text-warning";
      case "hard": return "bg-destructive/20 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "mcq": return "bg-primary/20 text-primary";
      case "true_false": return "bg-accent/20 text-accent";
      case "short_answer": return "bg-success/20 text-success";
      case "poll": return "bg-warning/20 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 bg-gradient-to-r from-background via-card to-background/50">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg mb-3 leading-relaxed break-words text-wrap" data-testid={`question-text-${index}`}>
            {question.question}
          </h4>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className={`px-3 py-2 rounded-xl font-medium ${getTypeColor(question.type)}`}>
              {question.type.replace("_", " ")}
            </span>
            <span className={`px-3 py-2 rounded-xl font-medium ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            {question.source && (
              <span className="text-muted-foreground px-3 py-2 bg-muted/50 rounded-xl">
                Source: {question.source}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 rounded-xl" data-testid={`button-edit-${index}`}>
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-destructive/10 rounded-xl" onClick={onRemove} data-testid={`button-remove-${index}`}>
            <X className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>
      
      {question.type === "mcq" && question.options && (
        <div className="space-y-3 ml-6">
          {question.options.map((option, optIndex) => (
            <div key={optIndex} className={`flex items-center space-x-3 p-3 rounded-xl ${
              option === question.correctAnswer 
                ? "bg-success/10 border border-success/20" 
                : "bg-muted/20"
            }`}>
              <div className={`p-1 rounded-full ${
                option === question.correctAnswer 
                  ? "bg-success text-success-foreground" 
                  : "bg-muted"
              }`}>
                {option === question.correctAnswer ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className={`font-medium break-words text-wrap ${
                option === question.correctAnswer ? "text-success" : "text-muted-foreground"
              }`}>
                {option}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {question.type !== "mcq" && (
        <div className="ml-6">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-success/10 border border-success/20">
            <div className="p-1 rounded-full bg-success text-success-foreground">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-success font-medium break-words text-wrap">{question.correctAnswer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
