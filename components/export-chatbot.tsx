"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import {
  Upload,
  Send,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ZoomableImage } from "@/components/zoomable-image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BASE_URL = "https://upload-s3-bucket.vercel.app";
const MATCHMAKING_URL = "https://expora-matchmaking.vercel.app";

const mockResponses = {
  welcome:
    "Hello! I'm your Export Compliance Assistant. Upload a product image, and I'll analyze if your product is suitable for export.",
  imageUploaded:
    "I've received your product image. Click send to start the analysis.",
  analyzing: "Analyzing your product image...",
};

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  imageUrl?: string;
};

export function ExportChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: mockResponses.welcome,
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      addMessage({
        id: Date.now().toString(),
        content: "I've uploaded a product image for analysis.",
        sender: "user",
        timestamp: new Date(),
        imageUrl: URL.createObjectURL(file),
      });

      addMessage({
        id: Date.now().toString() + "-bot",
        content: mockResponses.imageUploaded,
        sender: "bot",
        timestamp: new Date(),
      });
    }
  };

  const handleSendMessage = async () => {
    if (!imageFile) {
      addMessage({
        id: Date.now().toString() + "-error",
        content: "Please upload an image before sending.",
        sender: "bot",
        timestamp: new Date(),
      });
      return;
    }

    setIsAnalyzing(true);

    // Add user message if there's input
    if (inputValue.trim()) {
      addMessage({
        id: Date.now().toString(),
        content: inputValue,
        sender: "user",
        timestamp: new Date(),
      });
      setInputValue("");
    }

    // Add analyzing message
    addMessage({
      id: Date.now().toString() + "-analyzing",
      content: mockResponses.analyzing,
      sender: "bot",
      timestamp: new Date(),
    });

    try {
      // Upload image to S3
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadResponse = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const uploadedImageUrl = uploadData.file_url;

      // Call prediction API
      const predictResponse = await fetch(`${BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imagePath: uploadedImageUrl,
        }),
      });

      if (!predictResponse.ok) {
        throw new Error("Prediction failed");
      }

      const predictData = await predictResponse.json();

      // Add API response as bot message
      addMessage({
        id: Date.now().toString() + "-result",
        content: predictData.message,
        sender: "bot",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error during analysis:", error);
      addMessage({
        id: Date.now().toString() + "-error",
        content: "There was an error analyzing your product. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      });
    } finally {
      setIsAnalyzing(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return format(date, "h:mm:ss a");
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleImageClick = (imageUrl: string) => {
    setZoomImageUrl(imageUrl);
  };

  const closeZoomImage = () => {
    setZoomImageUrl(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-3 md:p-5">
        <div className="flex flex-col h-[85vh]">
          {/* Redirect button */}
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => window.open(MATCHMAKING_URL, "_blank")}
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Find Buyer
            </Button>
          </div>

          {/* Chat messages area */}
          <ScrollArea className="flex-1 pr-4 mb-2">
            <div className="space-y-6">
              {messages.map((message, index) => {
                const isFirstInGroup =
                  index === 0 || messages[index - 1].sender !== message.sender;
                const showAvatar = message.sender === "bot" && isFirstInGroup;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <div className="flex flex-col space-y-2 max-w-[85%]">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-8 w-8 bg-black">
                            <Bot className="h-5 w-5 text-white" />
                          </Avatar>
                          <span className="text-sm font-medium">
                            AI Assistant
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-lg p-4 max-w-[350px] sm:max-w-[400px] md:max-w-[500px] overflow-x-auto",
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground ml-10"
                            : "bg-muted/50 mr-10"
                        )}
                      >
                        <div className="min-w-[250px] max-md:px-5 md:px8">
                          <div className="flex flex-col gap-2">
                            <div className="whitespace-pre-line">
                              {message.sender === "bot" ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    ol: ({ children }) => (
                                      <ol className="list-decimal ml-6">
                                        {children}
                                      </ol>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc ml-6">
                                        {children}
                                      </ul>
                                    ),
                                    li: ({ children }) => (
                                      <li className="mb-1">{children}</li>
                                    ),
                                    p: ({ children }) => (
                                      <p className="mb-1">{children}</p>
                                    ), // Reduce space between paragraphs
                                    br: () => <br className="leading-tight" />, // Ensure consistent new line spacing
                                    div: ({ node, ...props }) => (
                                      <div
                                        className="prose prose-sm dark:prose-invert max-w-none leading-normal"
                                        {...props}
                                      />
                                    ),
                                  }}
                                >
                                  {message.content.replace(/\n/g, "  \n")}
                                </ReactMarkdown>
                              ) : (
                                message.content
                              )}
                            </div>
                            {message.imageUrl && (
                              <div className="mt-2">
                                <img
                                  src={message.imageUrl || "/placeholder.svg"}
                                  alt="Uploaded product"
                                  className="max-h-48 rounded-md object-contain cursor-pointer"
                                  onClick={() =>
                                    handleImageClick(message.imageUrl!)
                                  }
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                              <span>{formatTime(message.timestamp)}</span>
                              {message.sender === "bot" && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => copyMessage(message.content)}
                                    className="p-1 hover:bg-muted rounded-md transition-colors"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button className="p-1 hover:bg-muted rounded-md transition-colors">
                                    <Download className="h-4 w-4" />
                                  </button>
                                  <button className="p-1 hover:bg-muted rounded-md transition-colors">
                                    <ThumbsUp className="h-4 w-4" />
                                  </button>
                                  <button className="p-1 hover:bg-muted rounded-md transition-colors">
                                    <ThumbsDown className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={triggerFileInput}
              disabled={isAnalyzing}
              className="flex-shrink-0"
            >
              <Upload className="h-5 w-5" />
              <span className="sr-only">Upload image</span>
            </Button>
            <Input
              placeholder="Type a message (optional)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isAnalyzing}
              className="flex-1 text-sm md:text-base"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!imageFile || isAnalyzing}
              className="flex-shrink-0"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isAnalyzing}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-10 w-10 rounded-md border overflow-hidden">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                Product image uploaded
              </span>
            </div>
          )}
        </div>
      </CardContent>
      {zoomImageUrl && (
        <ZoomableImage imageUrl={zoomImageUrl} onClose={closeZoomImage} />
      )}
    </Card>
  );
}
