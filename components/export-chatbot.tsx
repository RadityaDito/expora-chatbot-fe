"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Define the base URL as a constant
const BASE_URL = "https://vvd9ztsexf.execute-api.ap-southeast-1.amazonaws.com";
// const BASE_URL = "https://upload-s3-bucket.vercel.app";
const UPLOAD_URL = "https://upload-s3-bucket.vercel.app";

// Mock data for countries
const countries = [
  { value: "us", label: "United States" },
  { value: "eu", label: "European Union" },
  { value: "cn", label: "China" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "br", label: "Brazil" },
  { value: "in", label: "India" },
  { value: "ru", label: "Russia" },
];

// Mock responses based on country and image type
const mockResponses = {
  welcome:
    "Hello! I'm your Export Compliance Assistant. Upload a product image and select a destination country, and I'll analyze if your product is suitable for export to that market.",
  imageUploaded:
    "I've received your product image. Please select a destination country to continue.",
  analyzing: "Analyzing your product image for export to {country}...",
  results: {
    us: {
      approved:
        "Your product appears to comply with US import regulations. Key compliance points:\n\n• No prohibited symbols or markings\n• Labeling appears to meet FDA standards\n• No obvious restricted materials\n\nRecommendation: Proceed with export, but verify specific industry regulations that may apply.",
      rejected:
        "Your product may face challenges with US import regulations. Potential issues:\n\n• Product contains symbols that may violate US trademark laws\n• Labeling doesn't appear to meet FDA requirements\n• Possible restricted materials detected\n\nRecommendation: Consult with a compliance expert before proceeding.",
    },
    eu: {
      approved:
        "Your product appears to comply with EU import regulations. Key compliance points:\n\n• CE marking requirements appear to be met\n• No prohibited substances detected\n• Packaging appears to meet EU standards\n\nRecommendation: Ensure GDPR compliance if product collects user data.",
      rejected:
        "Your product may face challenges with EU import regulations. Potential issues:\n\n• Missing required CE marking\n• Possible non-compliance with REACH regulations\n• Packaging may not meet EU recycling standards\n\nRecommendation: Address these issues before attempting export to the EU.",
    },
    cn: {
      approved:
        "Your product appears to comply with Chinese import regulations. Key compliance points:\n\n• No politically sensitive imagery\n• Product appears to meet CCC certification requirements\n• Labeling appears compliant\n\nRecommendation: Verify specific industry requirements for China.",
      rejected:
        "Your product may face challenges with Chinese import regulations. Potential issues:\n\n• Contains imagery that may be politically sensitive\n• May not meet CCC certification requirements\n• Labeling may not comply with Chinese regulations\n\nRecommendation: Consult with a China trade expert before proceeding.",
    },
    default: {
      approved:
        "Based on my analysis, your product appears suitable for export to {country}. No obvious compliance issues detected, but I recommend verifying with local import regulations.",
      rejected:
        "Based on my analysis, your product may face compliance challenges for export to {country}. Consider consulting with a trade expert familiar with this market.",
    },
  },
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
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview for immediate display
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Add user message with image
      addMessage({
        id: Date.now().toString(),
        content: "I've uploaded a product image for analysis.",
        sender: "user",
        timestamp: new Date(),
        imageUrl: URL.createObjectURL(file),
      });

      // Upload to API
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${UPLOAD_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        console.log(response);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        setUploadedImageUrl(data.file_url);

        // Add bot response
        addMessage({
          id: Date.now().toString() + "-bot",
          content: mockResponses.imageUploaded,
          sender: "bot",
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        addMessage({
          id: Date.now().toString() + "-error",
          content: "There was an error uploading your image. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        });
      }
    }
  };

  const handleCountryChange = async (value: string) => {
    setSelectedCountry(value);

    if (imagePreview && uploadedImageUrl) {
      const countryName =
        countries.find((c) => c.value === value)?.label || value;

      // Add user message about country selection
      addMessage({
        id: Date.now().toString(),
        content: `I want to export this product to ${countryName}.`,
        sender: "user",
        timestamp: new Date(),
      });

      // Add analyzing message
      const analyzingMessage = mockResponses.analyzing.replace(
        "{country}",
        countryName
      );
      addMessage({
        id: Date.now().toString() + "-analyzing",
        content: analyzingMessage,
        sender: "bot",
        timestamp: new Date(),
      });

      console.log("uploadedImageUrl");
      console.log(uploadedImageUrl);

      // Call prediction API
      setIsAnalyzing(true);
      try {
        const response = await fetch(`${BASE_URL}/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imagePath: uploadedImageUrl,
            country: value,
          }),
        });

        if (!response.ok) {
          throw new Error("Prediction failed");
        }

        const data = await response.json();

        // Add API response as bot message
        addMessage({
          id: Date.now().toString() + "-result",
          content: data.message,
          sender: "bot",
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error getting prediction:", error);
        addMessage({
          id: Date.now().toString() + "-error",
          content:
            "There was an error analyzing your product. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        });
      } finally {
        setIsAnalyzing(false);
      }
    } else if (!uploadedImageUrl && imagePreview) {
      // Handle case where image preview exists but upload failed
      addMessage({
        id: Date.now().toString() + "-error",
        content:
          "Please wait for the image to finish uploading or try uploading again.",
        sender: "bot",
        timestamp: new Date(),
      });
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Add user message
      addMessage({
        id: Date.now().toString(),
        content: inputValue,
        sender: "user",
        timestamp: new Date(),
      });

      // Clear input
      setInputValue("");

      // Simulate bot response
      setTimeout(() => {
        addMessage({
          id: Date.now().toString() + "-bot",
          content:
            "I'm here to help with product export compliance. Please upload a product image and select a destination country to get started.",
          sender: "bot",
          timestamp: new Date(),
        });
      }, 1000);
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
              onClick={() =>
                window.open("https://your-other-project-url.com", "_blank")
              }
              className="w-full"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Our Other Project
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
                          "rounded-lg p-4",
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground ml-10"
                            : "bg-muted/50 mr-10"
                        )}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="whitespace-pre-line">
                            {message.content}
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
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Country selection */}
          <div className="mt-3 md:mt-4">
            <Select
              value={selectedCountry}
              onValueChange={handleCountryChange}
              disabled={!imagePreview || isAnalyzing}
            >
              <SelectTrigger className="w-full text-sm md:text-base">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isAnalyzing}
              className="flex-1 text-sm md:text-base"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isAnalyzing}
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
